/**
 * Demo Video Capture — Per-Beat Scene Recorder
 *
 * Records each demo beat as a short Playwright video burst at 2560×1440.
 * Uses headed Chromium with Eve Vault extension and stable profile.
 * Injects a visible cursor overlay (indigo dot + click ripple).
 *
 * Beats are captured individually (short <60s recordings) to avoid
 * the known context.close() hang at 2560×1440 on long sessions.
 *
 * Beat 1 and Beat 9 are generated via ffmpeg (text-on-black / title card).
 * Beat 4 is a separate capture (hostile wallet).
 *
 * Usage:
 *   npx tsx scripts/record-demo-scenes.mts [beat]
 *
 * Examples:
 *   npx tsx scripts/record-demo-scenes.mts 6     # Record Beat 6 only
 *   npx tsx scripts/record-demo-scenes.mts 1     # Generate Beat 1 title card
 *   npx tsx scripts/record-demo-scenes.mts all   # Record all beats in risk order
 */

import { chromium, type BrowserContext, type Page, type Locator } from "playwright";
import { spawn, execSync, type ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.resolve(__dirname, "..");

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;
const WIDTH = 2560;
const HEIGHT = 1440;

const EVE_VAULT_PATH = String.raw`C:\Users\micha\Downloads\eve-vault-chrome\eve-vault-chrome`;
const PROFILE_DIR = path.join(PROJECT_DIR, "recordings", ".chromium-profile");
const SEGMENTS_DIR = path.join(PROJECT_DIR, "recordings", "segments");
const SCREENSHOTS_DIR = path.join(PROJECT_DIR, "recordings", "screenshots");
const VOICEOVERS_DIR = path.join(PROJECT_DIR, "recordings", "voiceovers");

// Voiceover durations (measured via ffprobe)
const VO = {
  "b01-pain-a": 21.499,
  "b02-power-a": 1.907,
  "b02-power-b": 9.796,
  "b03-policy-a": 3.997,
  "b03-policy-b": 10.893,
  "b04-denial-a": 4.127,
  "b04-denial-b": 5.329,
  "b05-revenue-a": 10.031,
  "b06-defense-a": 1.567,
  "b06-defense-b": 1.254,
  "b06-defense-c1": 1.437,
  "b06-defense-c2": 1.437,
  "b06-defense-c3": 1.567,
  "b07-commerce-a": 12.565,
  "b08-command-a": 5.616,
  "b08-command-b": 3.187,
} as const;

// Silence durations used between voiceovers
const SIL = {
  300: 0.3,
  400: 0.4,
  500: 0.5,
  1000: 1.0,
  1500: 1.5,
  2000: 2.0,
  3000: 3.0,
} as const;

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function waitForEnter(prompt: string): Promise<void> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, () => { rl.close(); resolve(); });
  });
}

/** Poll until condition returns true. */
async function pollUntil(
  label: string,
  fn: () => Promise<boolean>,
  timeoutMs = 120_000,
  intervalMs = 2_000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await fn()) return true;
    await sleep(intervalMs);
  }
  console.log(`  ✗ Timed out: ${label} (${(timeoutMs / 1000).toFixed(0)}s)`);
  return false;
}

/** Scene clock for timing interactions to voiceover durations. */
function createSceneClock(durationSec: number) {
  const startMs = Date.now();
  const durationMs = durationSec * 1000;
  return {
    async at(fraction: number) {
      const targetMs = fraction * durationMs;
      const elapsed = Date.now() - startMs;
      if (elapsed < targetMs) await sleep(targetMs - elapsed);
    },
    async atSec(sec: number) {
      const elapsed = Date.now() - startMs;
      const targetMs = sec * 1000;
      if (elapsed < targetMs) await sleep(targetMs - elapsed);
    },
    async finish() {
      const remaining = durationMs - (Date.now() - startMs);
      if (remaining > 0) await sleep(remaining);
    },
    elapsed(): number {
      return Date.now() - startMs;
    },
    remaining(): number {
      return Math.max(0, durationMs - (Date.now() - startMs));
    },
  };
}

function startDevServer(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const proc = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
      cwd: PROJECT_DIR, stdio: "pipe", shell: true,
    });
    let started = false;
    const timeout = setTimeout(() => {
      if (!started) { proc.kill(); reject(new Error("Dev server did not start within 30s")); }
    }, 30_000);
    proc.stdout?.on("data", (d: Buffer) => {
      if (!started && (d.toString().includes("Local:") || d.toString().includes("localhost"))) {
        started = true; clearTimeout(timeout); setTimeout(() => resolve(proc), 1_500);
      }
    });
    proc.stderr?.on("data", (d: Buffer) => {
      if (d.toString().includes("EADDRINUSE")) { clearTimeout(timeout); reject(new Error(`Port ${PORT} in use`)); }
    });
    proc.on("error", (e) => { clearTimeout(timeout); reject(e); });
    proc.on("exit", (c) => { if (!started) { clearTimeout(timeout); reject(new Error(`Exited with ${c}`)); } });
  });
}

// ══════════════════════════════════════════════════════════════════
// CURSOR OVERLAY — visible mouse pointer for headless/video capture
// ══════════════════════════════════════════════════════════════════

async function injectCursorOverlay(page: Page) {
  await page.evaluate(() => {
    if (document.getElementById("__cursor_dot")) return;

    const dot = document.createElement("div");
    dot.id = "__cursor_dot";
    Object.assign(dot.style, {
      position: "fixed",
      width: "18px",
      height: "18px",
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(99,102,241,0.95) 0%, rgba(99,102,241,0.4) 100%)",
      boxShadow: "0 0 12px 4px rgba(99,102,241,0.35)",
      pointerEvents: "none",
      zIndex: "999999",
      transition: "left 0.08s ease-out, top 0.08s ease-out",
      left: "-50px",
      top: "-50px",
    });
    document.body.appendChild(dot);

    const ring = document.createElement("div");
    ring.id = "__cursor_ring";
    Object.assign(ring.style, {
      position: "fixed",
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      border: "2px solid rgba(99,102,241,0.6)",
      pointerEvents: "none",
      zIndex: "999998",
      opacity: "0",
      transform: "scale(0.5)",
    });
    document.body.appendChild(ring);

    document.addEventListener("mousemove", (e) => {
      dot.style.left = `${e.clientX - 9}px`;
      dot.style.top = `${e.clientY - 9}px`;
    });
  });
}

/** Click with visible cursor movement + ripple animation. */
async function clickWithCursor(
  page: Page,
  locator: Locator,
  opts?: { preDelay?: number; postDelay?: number },
) {
  const { preDelay = 250, postDelay = 400 } = opts ?? {};
  await locator.scrollIntoViewIfNeeded();
  await sleep(preDelay);

  const box = await locator.boundingBox();
  if (!box) { await locator.click(); return; }
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  await page.mouse.move(cx, cy, { steps: 12 });

  await page.evaluate(({ x, y }) => {
    const ring = document.getElementById("__cursor_ring");
    if (ring) {
      ring.style.left = `${x - 18}px`;
      ring.style.top = `${y - 18}px`;
      ring.style.opacity = "1";
      ring.style.transform = "scale(0.5)";
      ring.style.transition = "none";
      requestAnimationFrame(() => {
        ring.style.transition = "transform 0.5s ease-out, opacity 0.5s ease-out";
        ring.style.transform = "scale(2.5)";
        ring.style.opacity = "0";
      });
    }
  }, { x: cx, y: cy });

  await locator.click();
  await sleep(postDelay);
}

/** Hover with visible cursor. */
async function hoverWithCursor(page: Page, locator: Locator, durationMs = 1500) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) return;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy, { steps: 12 });
  await sleep(durationMs);
}

// ══════════════════════════════════════════════════════════════════
// RECORDING CONTEXT — short per-beat video bursts
// ══════════════════════════════════════════════════════════════════

/**
 * Open a fresh recording context (new page with recordVideo),
 * run the scene, close the context, and return the saved video path.
 */
async function recordScene(
  beatId: string,
  durationSec: number,
  sceneRunner: (page: Page, clock: ReturnType<typeof createSceneClock>) => Promise<void>,
  options?: { reuseContext?: BrowserContext },
): Promise<string> {
  const segmentDir = path.join(SEGMENTS_DIR, `beat-${beatId}`);
  fs.mkdirSync(segmentDir, { recursive: true });

  let context: BrowserContext;
  let ownsContext = false;

  if (options?.reuseContext) {
    context = options.reuseContext;
  } else {
    context = await chromium.launchPersistentContext(PROFILE_DIR, {
      headless: false,
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      colorScheme: "dark",
      recordVideo: {
        dir: segmentDir,
        size: { width: WIDTH, height: HEIGHT },
      },
      args: [
        `--window-size=${WIDTH},${HEIGHT}`,
        `--disable-extensions-except=${EVE_VAULT_PATH}`,
        `--load-extension=${EVE_VAULT_PATH}`,
        "--disable-gpu",
      ],
    });
    ownsContext = true;
  }

  const page = context.pages()[0] || await context.newPage();
  const clock = createSceneClock(durationSec);

  console.log(`  ▶ Recording Beat ${beatId} (${durationSec}s)...`);

  try {
    await sceneRunner(page, clock);
    await clock.finish();
  } catch (e) {
    console.error(`  ✗ Scene error:`, (e as Error).message);
  }

  // Finalize video
  let videoPath = "";
  if (ownsContext) {
    try {
      const video = page.video();
      if (video) {
        videoPath = await video.path();
      }
      await context.close();
      console.log(`  ✓ Video saved: ${path.relative(PROJECT_DIR, videoPath)}`);
    } catch (e) {
      console.error(`  ⚠ Video finalization issue:`, (e as Error).message);
    }
  }

  return videoPath;
}

// ══════════════════════════════════════════════════════════════════
// BEAT 1 — Pain (ffmpeg title card generation)
// ══════════════════════════════════════════════════════════════════

/**
 * Beat 1: Separate slides per narration paragraph, each vertically centered.
 * Pure black background. Each slide fades in from black and fades out to black.
 * Synced to narration cadence (~22s total).
 *
 * Beat sheet spec:
 * - "White text fades in, one line at a time, matching narration cadence."
 * - Pure black background, no UI, no terminal.
 * - Brief pause (500ms) before "You have ten gates."
 * - Final line "No visibility. No alerts. No control." gets larger text.
 */
function generateBeat1() {
  console.log("\n─── Beat 1 — Pain (ffmpeg title card) ───\n");

  const outputPath = path.join(SEGMENTS_DIR, "beat-01-pain.mp4");
  const bg = "black";

  // Each slide is a separate card, vertically centered, timed to narration
  const slides = [
    { lines: ["Ten gates link five systems", "on your EVE Frontier."], dur: 4.0, size: 54, fade: 0.6 },
    { lines: ["Last night, two went offline.", "Nobody told you."], dur: 3.5, size: 50, fade: 0.6 },
    { lines: ["Your pilots rerouted through", "hostile territory."], dur: 3.0, size: 46, fade: 0.5 },
    { lines: ["Hostiles caught them hauling fuel."], dur: 2.5, size: 46, fade: 0.5 },
    { lines: ["Every rule, every gate \u2014", "a manual transaction."], dur: 3.5, size: 44, fade: 0.5 },
    { lines: ["You have ten gates."], dur: 2.5, size: 44, fade: 0.5 },
    { lines: ["No visibility. No alerts. No control."], dur: 3.0, size: 60, fade: 0.7 },
  ];

  const tempFiles: string[] = [];
  slides.forEach((slide, i) => {
    const tmp = path.join(SEGMENTS_DIR, `_b1_slide_${i}.mp4`);
    // Escape text for ffmpeg drawtext: colons, single quotes, commas
    const escaped = slide.lines.map(l =>
      l.replace(/\\/g, "\\\\\\\\")
       .replace(/:/g, "\\\\:")
       .replace(/'/g, "\u2019") // curly apostrophe avoids shell quoting issues
       .replace(/,/g, "\\\\,"),
    );
    // Multi-line: use separate drawtext for each line, vertically centered as a group
    const lineHeight = Math.round(slide.size * 1.6);
    const totalHeight = escaped.length * lineHeight;
    const startY = Math.round((HEIGHT - totalHeight) / 2);

    const drawFilters = escaped.map((line, li) => {
      const y = startY + li * lineHeight;
      return `drawtext=text='${line}':fontsize=${slide.size}:fontcolor=white:x=(w-text_w)/2:y=${y}`;
    }).join(",");

    const fadeIn = slide.fade;
    const fadeOut = slide.fade;
    const vf = `${drawFilters},fade=t=in:st=0:d=${fadeIn},fade=t=out:st=${(slide.dur - fadeOut).toFixed(2)}:d=${fadeOut}`;

    execSync(
      `ffmpeg -y -f lavfi -i "color=c=${bg}:s=${WIDTH}x${HEIGHT}:d=${slide.dur}:r=25" ` +
      `-vf "${vf}" ` +
      `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -an "${tmp}"`,
      { cwd: PROJECT_DIR, stdio: "pipe" },
    );
    tempFiles.push(tmp);
  });

  // Concatenate slides into final Beat 1
  const concatFile = path.join(SEGMENTS_DIR, "_b1_concat.txt");
  const concatContent = tempFiles.map(f => `file '${f.replace(/\\/g, "/")}'`).join("\n");
  fs.writeFileSync(concatFile, concatContent, { encoding: "utf-8" });

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c:v copy -movflags +faststart "${outputPath}"`,
    { cwd: PROJECT_DIR, stdio: "pipe" },
  );

  // Cleanup temp files
  tempFiles.forEach(f => { try { fs.unlinkSync(f); } catch {} });
  try { fs.unlinkSync(concatFile); } catch {}

  console.log(`  \u2713 Beat 1 generated: ${path.relative(PROJECT_DIR, outputPath)}`);
  return outputPath;
}

// ══════════════════════════════════════════════════════════════════
// BEAT 9 — Close (ffmpeg title card)
// ══════════════════════════════════════════════════════════════════

function generateBeat9() {
  console.log("\n─── Beat 9 — Close (ffmpeg title card) ───\n");

  const outputPath = path.join(SEGMENTS_DIR, "beat-09-close.mp4");
  const dur = 13;

  const cmd = [
    "ffmpeg", "-y",
    "-f", "lavfi", "-i", `color=c=black:s=${WIDTH}x${HEIGHT}:d=${dur}:r=25`,
    "-vf",
    `"drawtext=text='CivilizationControl':fontsize=80:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:alpha='if(lt(t\\,2)\\,t/2\\,1)',fade=t=in:st=0:d=2"`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-an", `"${outputPath}"`,
  ].join(" ");

  try {
    execSync(cmd, { cwd: PROJECT_DIR, stdio: "pipe" });
    console.log(`  ✓ Beat 9 generated: ${path.relative(PROJECT_DIR, outputPath)}`);
  } catch (e) {
    console.error("  ✗ ffmpeg failed:", (e as Error).message);
  }
  return outputPath;
}

// ══════════════════════════════════════════════════════════════════
// BROWSER SCENE RUNNERS
// ══════════════════════════════════════════════════════════════════

/** Beat 2 — Power Reveal: static hold on Command Overview (20s) */
async function runBeat2(page: Page, clock: ReturnType<typeof createSceneClock>) {
  // Navigate to Command Overview
  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(2_000);
  await injectCursorOverlay(page);

  // Ensure we're in Commercial posture (Beat 6 left us in Defensive)
  const commercialBtn = page.locator("button").filter({ hasText: "Commercial" }).first();
  const defensiveChip = page.locator("button").filter({ hasText: "Defensive" }).first();
  const isDefensive = await defensiveChip.evaluate(
    (el) => el.classList.contains("text-destructive") || window.getComputedStyle(el).color.includes("239"),
  ).catch(() => false);

  if (isDefensive) {
    console.log("    Switching posture from Defensive → Commercial...");
    await commercialBtn.click();
    await waitForEnter("    Press ENTER after approving the posture switch wallet popup...");
    await page.waitForTimeout(3_000); // Wait for on-chain confirmation
    console.log("    ✓ Posture switched to Commercial");
  }

  // Hard cut from black — the page load IS the effect
  // Hold: let the interface breathe
  await clock.atSec(2);

  // Shot 2: "CivilizationControl." — initial 2s silent hold
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "beat-02-power-reveal.png") });

  // Shot 3-4: hold on full Command Overview (narration runs over this)
  // No interaction — static hold for the full duration
  await clock.finish();
}

// Known object IDs for direct navigation
const GATE_ID = "0xf13071441b28507485782c8bf4f45c5596f2d0e14230ad9f684d8e76da311b68";
const SSU_ID = "0x73a260bd3de57c46d390a18abe797dc1d24a166c383e871e2abc46ba996bf121";

/** Beat 3 — Policy: gate detail → tiered pricing → batch apply → Signal Feed (26s) */
async function runBeat3(page: Page, clock: ReturnType<typeof createSceneClock>) {
  // Navigate directly to gate detail page
  await page.goto(`${BASE_URL}/gates/${GATE_ID}`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(2_000);
  await injectCursorOverlay(page);

  // Shot 1 (0:00–0:04): Gate Directive panel, Commercial tab visible
  // Hold on tribe pricing table — 3s silence window
  await clock.atSec(4);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "beat-03-policy-table.png") });

  // Shot 2 (0:04–0:11): Hold on tribe table during narration
  // "Allies at a thousand. Rivals at twenty-five thousand..."
  await clock.atSec(11);

  // Shot 3 (0:11–0:16): Click "Apply to All Gates"
  const applyBtn = page.locator("button").filter({ hasText: /Apply to All Gates/ }).first();
  if (await applyBtn.isVisible().catch(() => false)) {
    await clickWithCursor(page, applyBtn);
    console.log("    Clicked 'Apply to All Gates'. Approve wallet popup.");
    await waitForEnter("    Press ENTER after approving the wallet popup...");
  } else {
    console.log("    ⚠ 'Apply to All Gates' button not found. Holding on current view.");
  }

  // Shot 4 (0:16–0:22): Signal Feed cascade
  await clock.atSec(18);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "beat-03-signal-feed.png") });

  // Shot 5 (0:22–0:26): Hold on confirmed directive
  await clock.finish();
}

/** Beat 5 — Revenue: Signal Feed toll entry + revenue metric (18s) */
async function runBeat5(page: Page, clock: ReturnType<typeof createSceneClock>) {
  // Navigate to Command Overview (Signal Feed visible)
  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(2_000);
  await injectCursorOverlay(page);

  // Shot 1: Signal Feed with toll entry visible
  // "An ally jumps through. A thousand Lux — the rate you set."
  await clock.atSec(4);

  // Shot 2: Hover over a tx digest link for DigestHoverLink proof card
  const digestLink = page.locator("[class*='digest'], [class*='Digest'], a[href*='suiscan']").first();
  if (await digestLink.isVisible().catch(() => false)) {
    await hoverWithCursor(page, digestLink, 2000);
  }

  await clock.atSec(8);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "beat-05-revenue.png") });

  // Shot 3-4: "Revenue to the operator. The gate pays for itself."
  // Hold on metric card area
  await clock.finish();
}

/** Beat 6 — Defense Mode: posture switch + cascade (30s) */
async function runBeat6(page: Page, clock: ReturnType<typeof createSceneClock>) {
  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(2_000);
  await injectCursorOverlay(page);

  // Shot 2: Command Overview on screen. PostureControl visible.
  // "Threat inbound." (1.567s)
  await clock.atSec(0);
  console.log("    'Threat inbound.' — Command Overview on screen");

  // Silence 1s
  await clock.atSec(VO["b06-defense-a"] + SIL[1000]);

  // Shot 3: "One click." — Click Defensive NOW
  console.log("    'One click.' — CLICKING Defensive");
  const defenseBtn = page.locator("button:has-text('Defensive')").first();
  if (await defenseBtn.isVisible().catch(() => false)) {
    await clickWithCursor(page, defenseBtn, { preDelay: 100, postDelay: 0 });
  } else {
    console.log("    ⚠ 'Defensive' button not found!");
  }

  const clickTime = Date.now();

  // Shot 4: "Executing…" → wallet popup → approve
  console.log("    Wallet popup should appear. APPROVE THE TRANSACTION.");
  console.log("    (Script will auto-detect cascade completion)");

  // Poll for cascade completion (posture chip changes to destructive styling)
  const MIN_ELAPSED_MS = 2000;
  let cascadeCompleted = false;

  for (let i = 0; i < 60; i++) {
    await sleep(500);
    const elapsed = Date.now() - clickTime;
    if (elapsed < MIN_ELAPSED_MS) continue;

    const defenseActive = await page
      .locator("button:has-text('Defensive')")
      .first().evaluate((el) => el.className.includes("text-destructive"))
      .catch(() => false);

    if (defenseActive) {
      cascadeCompleted = true;
      console.log(`    ✓ Cascade complete: ${(elapsed / 1000).toFixed(1)}s from click`);
      break;
    }

    if (elapsed > 30_000) {
      console.log("    ✗ Cascade timeout (30s)");
      break;
    }
  }

  // Shot 5-6: Hold on confirmed amber state (2s silence)
  if (cascadeCompleted) {
    await sleep(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "beat-06-cascade.png") });
  }

  // Shot 7: "Gates locked. Turrets armed. One transaction."
  // Signal Feed: PostureChangedEvent visible
  await clock.atSec(18);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "beat-06-signal-feed.png") });

  // Shot 8: Hold 2s on transformed Command Overview
  await clock.finish();
}

/** Beat 7 — Commerce: trade post → buy → Signal Feed (22s) */
async function runBeat7(page: Page, clock: ReturnType<typeof createSceneClock>) {
  // Navigate directly to the SSU trade post page
  await page.goto(`${BASE_URL}/ssu/${SSU_ID}`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(2_000);
  await injectCursorOverlay(page);

  await clock.atSec(1);

  // Shot 1: Trade post storefront showing listing
  await clock.atSec(4);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "beat-07-storefront.png") });

  // Shot 2: Narrate amounts. If Buy button exists, click it
  await clock.atSec(8);
  const buyBtn = page.locator("button:has-text('Buy'), button:has-text('Purchase')").first();
  if (await buyBtn.isVisible().catch(() => false)) {
    await clickWithCursor(page, buyBtn);
    console.log("    Clicked Buy. Approve wallet popup.");
    await waitForEnter("    Press ENTER after approving the wallet popup...");
  }

  // Shot 3: Signal Feed shows trade settlement
  await clock.atSec(14);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "beat-07-trade-settled.png") });

  // Shot 4: Hold on updated listing state
  await clock.finish();
}

/** Beat 8 — Command: full Command Overview wide shot (15s) */
async function runBeat8(page: Page, clock: ReturnType<typeof createSceneClock>) {
  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(2_000);
  await injectCursorOverlay(page);

  // Pull back to full Command Overview. All metrics visible.
  // Posture: Defensive (from Beat 6). Revenue. Signal Feed scrolling.
  await clock.atSec(4);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "beat-08-command.png") });

  // "Your infrastructure. Under your command."
  // Static hold — the accumulated state IS the proof
  await clock.finish();
}

// ══════════════════════════════════════════════════════════════════
// SHARED BROWSER SESSION APPROACH
// ══════════════════════════════════════════════════════════════════

/**
 * Launch a persistent browser context with recordVideo enabled,
 * guide wallet connection, then run beats sequentially.
 * Each beat is a separate recording created by navigating + timing.
 */
async function launchAndRecord(beats: number[]) {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║  Demo Video Capture — Per-Beat Scene Recorder         ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Ensure directories exist
  fs.mkdirSync(SEGMENTS_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  // Check which beats need ffmpeg vs browser
  const ffmpegBeats = beats.filter(b => b === 1 || b === 9);
  const browserBeats = beats.filter(b => b !== 1 && b !== 9 && b !== 4);
  const skippedBeats = beats.filter(b => b === 4);

  // Generate ffmpeg beats first (no browser needed)
  for (const b of ffmpegBeats) {
    if (b === 1) generateBeat1();
    if (b === 9) generateBeat9();
  }

  if (skippedBeats.length > 0) {
    console.log("\n  ⚠ Beat 4 (Denial) requires separate hostile wallet capture. Skipping.");
  }

  if (browserBeats.length === 0) {
    console.log("\n  No browser beats to record. Done.");
    return;
  }

  // Validate extension
  if (!fs.existsSync(path.join(EVE_VAULT_PATH, "manifest.json"))) {
    console.error("✗ Eve Vault extension not found at", EVE_VAULT_PATH);
    process.exit(1);
  }

  // Start dev server
  console.log("\n─── Starting Vite dev server ───");
  let devServer: ChildProcess;
  try {
    devServer = await startDevServer();
    console.log(`✓ Dev server on ${BASE_URL}\n`);
  } catch (e) {
    console.error("✗ Dev server failed:", (e as Error).message);
    process.exit(1);
  }

  // For each browser beat, launch a fresh recording context
  for (const beatNum of browserBeats) {
    const beatId = String(beatNum).padStart(2, "0");
    const beatSegDir = path.join(SEGMENTS_DIR, `beat-${beatId}`);
    fs.mkdirSync(beatSegDir, { recursive: true });

    console.log(`\n╔══════════════════════════════════════════════════════╗`);
    console.log(`║  Recording Beat ${beatNum}                                     ║`);
    console.log(`╚══════════════════════════════════════════════════════╝`);

    // Launch persistent context with recordVideo for this beat
    let context: BrowserContext;
    try {
      context = await chromium.launchPersistentContext(PROFILE_DIR, {
        headless: false,
        viewport: { width: WIDTH, height: HEIGHT },
        deviceScaleFactor: 1,
        colorScheme: "dark",
        recordVideo: {
          dir: beatSegDir,
          size: { width: WIDTH, height: HEIGHT },
        },
        args: [
          `--window-size=${WIDTH},${HEIGHT}`,
          `--disable-extensions-except=${EVE_VAULT_PATH}`,
          `--load-extension=${EVE_VAULT_PATH}`,
          "--disable-gpu",
        ],
      });
    } catch (e) {
      console.error(`  ✗ Browser launch failed:`, (e as Error).message);
      continue;
    }

    const page = context.pages()[0] || await context.newPage();

    // Check wallet connection
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(3_000);

    const needsConnect = await page
      .locator("text=/connect.*wallet/i")
      .first().isVisible().catch(() => false);

    if (needsConnect) {
      console.log("  ⚠ Wallet not connected. Connect manually:");
      console.log("    1. Click Eve Vault extension icon");
      console.log("    2. Unlock vault → Connect wallet → Approve");
      const connected = await pollUntil("wallet connected", async () => {
        const ready = await page.locator("text=/\\d+ Gates/i").first().isVisible().catch(() => false);
        return ready;
      }, 120_000, 3_000);
      if (!connected) {
        console.log("  ✗ Wallet timeout. Skipping beat.");
        await context.close();
        continue;
      }
      console.log("  ✓ Wallet connected.");
      await page.waitForTimeout(2_000);
    } else {
      console.log("  ✓ Wallet connected (profile reuse)");
    }

    // Determine beat duration and runner
    const beatConfig: Record<number, { dur: number; runner: typeof runBeat2 }> = {
      2: { dur: 20, runner: runBeat2 },
      3: { dur: 26, runner: runBeat3 },
      5: { dur: 18, runner: runBeat5 },
      6: { dur: 30, runner: runBeat6 },
      7: { dur: 22, runner: runBeat7 },
      8: { dur: 15, runner: runBeat8 },
    };

    const config = beatConfig[beatNum];
    if (!config) {
      console.log(`  ⚠ No runner for Beat ${beatNum}. Skipping.`);
      await context.close();
      continue;
    }

    // Prompt before recording
    await waitForEnter(`\n  Press ENTER to start recording Beat ${beatNum} (${config.dur}s)...`);

    const clock = createSceneClock(config.dur);
    try {
      await config.runner(page, clock);
      await clock.finish();
    } catch (e) {
      console.error(`  ✗ Scene error:`, (e as Error).message);
    }

    // Finalize video
    try {
      const video = page.video();
      if (video) {
        const vPath = await video.path();
        console.log(`  ✓ Video saved: ${path.relative(PROJECT_DIR, vPath)}`);
      }
    } catch (e) {
      console.log(`  ⚠ Video path not available yet — file is in ${path.relative(PROJECT_DIR, beatSegDir)}/`);
    }

    // Close context to finalize video file
    console.log("  Finalizing video (closing browser)...");
    try {
      await context.close();
      console.log("  ✓ Context closed. Video finalized.");
    } catch (e) {
      console.error("  ⚠ Context close issue:", (e as Error).message);
    }

    // Check if we need to continue
    const remaining = browserBeats.slice(browserBeats.indexOf(beatNum) + 1);
    if (remaining.length > 0) {
      console.log(`\n  Next beats: ${remaining.join(", ")}`);
      await waitForEnter("  Press ENTER to continue to next beat (or Ctrl+C to stop)...");
    }
  }

  // Cleanup
  devServer!.kill();

  // List generated segments
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║  CAPTURE COMPLETE                                     ║");
  console.log("╠════════════════════════════════════════════════════════╣");

  const segmentFiles = fs.readdirSync(SEGMENTS_DIR, { recursive: true })
    .filter((f) => String(f).endsWith(".webm") || String(f).endsWith(".mp4"));
  for (const f of segmentFiles) {
    console.log(`  ✓ ${f}`);
  }
  console.log("╚════════════════════════════════════════════════════════╝\n");
}

// ══════════════════════════════════════════════════════════════════
// CLI ENTRY POINT
// ══════════════════════════════════════════════════════════════════

const arg = process.argv[2]?.toLowerCase() ?? "all";

// Risk-ordered capture sequence from capture-readiness checklist
const RISK_ORDER = [6, 3, 5, 7, 2, 8, 1, 9];

let beats: number[];
if (arg === "all") {
  beats = RISK_ORDER;
} else if (arg === "titles") {
  beats = [1, 9];
} else {
  const num = parseInt(arg, 10);
  if (isNaN(num) || num < 1 || num > 9) {
    console.error("Usage: npx tsx scripts/record-demo-scenes.mts [beat|all|titles]");
    console.error("  beat: 1-9 (single beat)");
    console.error("  all:  all beats in risk order (6,3,5,7,2,8,1,9)");
    console.error("  titles: generate Beat 1 + Beat 9 title cards only");
    process.exit(1);
  }
  beats = [num];
}

console.log(`\n  Capture plan: Beat ${beats.join(" → ")}`);
launchAndRecord(beats).catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});

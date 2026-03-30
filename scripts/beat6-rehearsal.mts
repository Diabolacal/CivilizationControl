/**
 * Beat 6 — Defense Mode Timed Rehearsal
 *
 * Launches headed Chromium with stable profile + Eve Vault,
 * navigates to Command Overview, runs pre-rehearsal checks,
 * then orchestrates the posture switch with timing measurement.
 *
 * Flow:
 *   1. Verify pre-conditions (posture=Commercial, PostureControl visible)
 *   2. Click "Defense Mode" button, start timer
 *   3. Pause for manual wallet approval
 *   4. Measure cascade completion + Signal Feed confirmation
 *   5. Report timing results
 *   6. Reset: switch back to Commercial for capture readiness
 *
 * Usage:
 *   npx tsx scripts/beat6-rehearsal.mts
 */

import { chromium, type BrowserContext, type Page } from "playwright";
import { spawn, type ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.resolve(__dirname, "..");

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;
const WIDTH = 2560;
const HEIGHT = 1440;

const EVE_VAULT_PATH = String.raw`C:\Users\micha\Downloads\eve-vault-chrome\eve-vault-chrome`;
const PROFILE_DIR = path.join(PROJECT_DIR, "recordings", ".chromium-profile");

// ── Helpers ───────────────────────────────────────────────────────

/** Poll until a condition function returns true, with timeout. */
async function pollUntil(
  label: string,
  conditionFn: () => Promise<boolean>,
  timeoutMs = 120_000,
  intervalMs = 2_000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await conditionFn()) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  console.log(`  ✗ Timed out waiting for: ${label} (${(timeoutMs / 1000).toFixed(0)}s)`);
  return false;
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

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║  Beat 6 — Defense Mode Timed Rehearsal                ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Validate extension
  if (!fs.existsSync(path.join(EVE_VAULT_PATH, "manifest.json"))) {
    console.error("✗ Eve Vault extension not found"); process.exit(1);
  }
  fs.mkdirSync(PROFILE_DIR, { recursive: true });

  // ── Dev server ──────────────────────────────────────────────────
  console.log("─── Starting Vite dev server ───");
  let devServer: ChildProcess;
  try {
    devServer = await startDevServer();
    console.log(`✓ Dev server on ${BASE_URL}\n`);
  } catch (e) {
    console.error("✗ Dev server failed:", (e as Error).message);
    process.exit(1);
  }

  // ── Launch browser ──────────────────────────────────────────────
  console.log("─── Launching headed Chromium (stable profile) ───");
  let context: BrowserContext;
  try {
    context = await chromium.launchPersistentContext(PROFILE_DIR, {
      headless: false,
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      colorScheme: "dark",
      args: [
        `--window-size=${WIDTH},${HEIGHT}`,
        `--disable-extensions-except=${EVE_VAULT_PATH}`,
        `--load-extension=${EVE_VAULT_PATH}`,
        "--disable-gpu",
      ],
    });
    console.log("✓ Browser launched\n");
  } catch (e) {
    console.error("✗ Browser launch failed:", (e as Error).message);
    devServer!.kill();
    process.exit(1);
  }

  const page = await context.newPage();

  // ══════════════════════════════════════════════════════════════
  // PRE-REHEARSAL CHECKS
  // ══════════════════════════════════════════════════════════════
  console.log("═══ PRE-REHEARSAL CHECKS ═══\n");

  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(3_000);

  // Check wallet connection
  const connectBtnVisible = await page
    .locator("text=/connect.*wallet/i")
    .first().isVisible().catch(() => false);

  if (connectBtnVisible) {
    console.log("  ⚠ Wallet NOT connected. Waiting for manual connection...\n");
    console.log("  ┌─────────────────────────────────────────────────┐");
    console.log("  │ 1. Click Eve Vault extension icon (puzzle piece)│");
    console.log("  │ 2. Unlock vault if prompted                     │");
    console.log("  │ 3. Click 'Connect Wallet' in the CC app         │");
    console.log("  │ 4. Select 'Eve Vault' → Approve connection      │");
    console.log("  │ 5. Wait for dashboard to populate               │");
    console.log("  └─────────────────────────────────────────────────┘\n");
    console.log("  Polling for wallet connection (up to 2 min)...");

    const walletConnected = await pollUntil(
      "wallet connected",
      async () => {
        // Check if topology SVG or structure counts appeared
        const topology = await page.locator("svg circle, svg line").first().isVisible().catch(() => false);
        const structures = await page.locator("text=/\\d+ Gates/i").first().isVisible().catch(() => false);
        return topology || structures;
      },
      120_000,
      3_000,
    );

    if (!walletConnected) {
      console.log("  ✗ Wallet connection timed out. Aborting.");
      await stayAlive(context, devServer!);
      return;
    }
    console.log("  ✓ Wallet connected!\n");
    await page.waitForTimeout(3_000);
  } else {
    console.log("  ✓ Wallet connected (profile reuse)\n");
  }

  // Check PostureControl is visible
  // In inline mode (dashboard), the buttons say "Commercial" and "Defensive"
  const postureControlVisible = await page
    .locator("button:has-text('Commercial'), button:has-text('Defensive')")
    .first().isVisible().catch(() => false);

  // Determine current posture by checking which chip has the active styling
  // Active Commercial chip has 'text-primary bg-primary/10' class
  // Active Defensive chip has 'text-destructive bg-destructive/10' class
  const defensiveChipActive = await page
    .locator("button:has-text('Defensive')")
    .first().evaluate((el) => el.className.includes("text-destructive"))
    .catch(() => false);
  const commercialChipVisible = await page
    .locator("button:has-text('Commercial')")
    .first().isVisible().catch(() => false);
  const defensiveChipVisible = await page
    .locator("button:has-text('Defensive')")
    .first().isVisible().catch(() => false);

  const currentPosture = defensiveChipActive ? "Defense" : (commercialChipVisible && defensiveChipVisible) ? "Commercial" : "Unknown";

  // Check Signal Feed visibility
  const signalFeedVisible = await page
    .locator("text=/Signal Feed/i, text=/Recent Events/i, text=/PostureChanged/i, text=/Network Posture/i")
    .first().isVisible().catch(() => false);

  // Check topology
  const topologyOk = await page
    .locator("svg circle, svg line, svg path")
    .first().isVisible().catch(() => false);

  console.log(`  PostureControl visible : ${postureControlVisible ? "✓" : "✗"}`);
  console.log(`  Current posture        : ${currentPosture}`);
  console.log(`  Signal Feed visible    : ${signalFeedVisible ? "✓" : "✗"}`);
  console.log(`  Topology rendered      : ${topologyOk ? "✓" : "✗"}`);

  if (currentPosture === "Defense") {
    console.log("\n  ⚠ Posture is already Defensive. Switching back to Commercial first.");
    console.log("  Clicking 'Commercial' chip...\n");
    await performPostureSwitch(page, "Commercial", "Commercial");
    console.log("  ✓ Reset to Commercial. Ready for rehearsal.\n");
  } else if (currentPosture === "Unknown") {
    console.log("\n  ✗ Could not determine posture. PostureControl button not found.");
    console.log("  Check: Is the dashboard fully loaded? Are structures visible?");
    console.log("  Waiting 15s for PostureControl to appear...");
    const appeared = await pollUntil(
      "PostureControl button",
      async () => {
        const comm = await page.locator("button:has-text('Commercial')").first().isVisible().catch(() => false);
        const def = await page.locator("button:has-text('Defensive')").first().isVisible().catch(() => false);
        return comm || def;
      },
      15_000,
      2_000,
    );
    if (!appeared) {
      console.log("  ✗ PostureControl still not found. Aborting rehearsal.");
      await stayAlive(context, devServer!);
      return;
    }
    // Re-check which button is visible
    const isNowDefense = await page.locator("button:has-text('Defensive')").first()
      .evaluate((el) => el.className.includes("text-destructive")).catch(() => false);
    if (isNowDefense) {
      console.log("  Posture is Defensive. Resetting to Commercial...");
      await performPostureSwitch(page, "Commercial", "Commercial");
    }
  }

  if (!postureControlVisible && currentPosture !== "Unknown") {
    console.log("\n  ✗ Pre-rehearsal checks failed (PostureControl not visible). Aborting.");
    await stayAlive(context, devServer!);
    return;
  }

  if (!topologyOk) {
    console.log("\n  ✗ Pre-rehearsal checks failed (topology not rendered). Aborting.");
    await stayAlive(context, devServer!);
    return;
  }

  // ══════════════════════════════════════════════════════════════
  // BEAT 6 REHEARSAL — TIMED POSTURE SWITCH
  // ══════════════════════════════════════════════════════════════
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║  BEAT 6 REHEARSAL — Timed Defense Mode Switch         ║");
  console.log("╠════════════════════════════════════════════════════════╣");
  console.log("║  Rehearsal protocol from capture-readiness-checklist  ║");
  console.log("║                                                        ║");
  console.log("║  SEQUENCE:                                             ║");
  console.log("║   0:00  'Threat inbound.' (1.4s)                      ║");
  console.log("║   0:01.4  silence 1s                                   ║");
  console.log("║   0:02.4  'One click.' — CLICK Defense Mode            ║");
  console.log("║   0:03.8  silence 2s — wallet popup → approve         ║");
  console.log("║   0:05.8  'Gates locked.' — cascade completing        ║");
  console.log("║   0:07.6  'Turrets armed.' — full amber visible       ║");
  console.log("║   0:09.4  'One transaction.' — Signal Feed confirms   ║");
  console.log("║                                                        ║");
  console.log("║  Total audio: ~11s. Visual buffer: ~19s of 30s beat   ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  console.log("  Starting rehearsal in 5 seconds — watch the browser...\n");
  await page.waitForTimeout(5_000);

  // Scroll to ensure PostureControl and Signal Feed are both visible
  // First, ensure we're on the root dashboard
  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15_000 });
  await page.waitForTimeout(2_000);

  console.log("\n─── REHEARSAL RUNNING ───\n");
  console.log("  [T+0.0s]  'Threat inbound.' — Command Overview on screen");

  // Small delay simulating the "Threat inbound" + 1s silence
  await page.waitForTimeout(2_400);

  console.log("  [T+2.4s]  'One click.' — CLICKING 'Defense Mode' NOW");

  // ── Click Defense Mode + start timer ──
  const clickTime = Date.now();

  const defenseBtn = page.locator("button:has-text('Defensive')").first();
  const btnVisible = await defenseBtn.isVisible().catch(() => false);
  if (!btnVisible) {
    console.log("  ✗ 'Defensive' button not found! Aborting.");
    await stayAlive(context, devServer!);
    return;
  }

  await defenseBtn.click();
  const afterClickMs = Date.now() - clickTime;
  console.log(`  [T+2.4s + ${afterClickMs}ms] Button clicked. Wallet popup should appear.`);

  // ── PAUSE: Wait for manual wallet approval (poll-based) ──
  console.log("\n  ┌─────────────────────────────────────────────────┐");
  console.log("  │ WALLET APPROVAL REQUIRED                        │");
  console.log("  │                                                  │");
  console.log("  │ A wallet popup window should have appeared.     │");
  console.log("  │ Approve the transaction in Eve Vault.           │");
  console.log("  │                                                  │");
  console.log("  │ The script will automatically detect when the   │");
  console.log("  │ posture switch completes (up to 60s timeout).   │");
  console.log("  └─────────────────────────────────────────────────┘\n");

  // ── Measure cascade completion (poll-based) ──
  console.log("  Watching for cascade completion...");

  // Wait for PostureControl to show transition states then settle
  // Look for: "Executing…" → "Confirming…" → "Defense Mode" label
  const cascadeStart = Date.now();

  // Poll for the posture label to settle on "Defense Mode" or "Stand Down" button
  let cascadeCompleted = false;
  let signalFeedConfirmed = false;
  let cascadeDurationMs = 0;
  let signalFeedDurationMs = 0;

  // Snapshot Signal Feed event count BEFORE the click so we can detect NEW events
  const preClickFeedCount = await page
    .locator("[class*='SignalFeed'], [data-testid='signal-feed'] >> li, [class*='feed'] >> [class*='event'], [class*='ActivityFeed'] >> li")
    .count().catch(() => -1);
  console.log(`  Pre-click Signal Feed items: ${preClickFeedCount}`);

  // Minimum 2s guard: no wallet approval + chain confirmation can complete in <2s
  const MIN_ELAPSED_MS = 2000;

  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(500);
    const elapsed = Date.now() - clickTime;

    // Skip detection during the first 2s — wallet approval cannot complete that fast
    if (elapsed < MIN_ELAPSED_MS) {
      if (i === 0) console.log(`  (Skipping first ${MIN_ELAPSED_MS / 1000}s — wallet approval window)`);
      continue;
    }

    // Check if Defensive chip has active styling (means Defense Mode is active)
    const defenseActive = await page
      .locator("button:has-text('Defensive')")
      .first().evaluate((el) => el.className.includes("text-destructive"))
      .catch(() => false);

    if (defenseActive && !cascadeCompleted) {
      cascadeCompleted = true;
      cascadeDurationMs = elapsed;
      console.log(`  ✓ Cascade complete: ${(cascadeDurationMs / 1000).toFixed(1)}s from click`);
    }

    // Check Signal Feed for PostureChanged confirmation
    // Only count as confirmed if there's a NEW event (more items than pre-click snapshot)
    const postureEvent = await page
      .locator("text=/Network Posture Set|PostureChanged|Defense posture/i")
      .first().isVisible().catch(() => false);

    // Guard against stale feed: require new feed items since click
    const currentFeedCount = await page
      .locator("[class*='SignalFeed'], [data-testid='signal-feed'] >> li, [class*='feed'] >> [class*='event'], [class*='ActivityFeed'] >> li")
      .count().catch(() => -1);
    const hasNewFeedItems = preClickFeedCount >= 0 && currentFeedCount > preClickFeedCount;

    if (postureEvent && hasNewFeedItems && !signalFeedConfirmed) {
      signalFeedConfirmed = true;
      signalFeedDurationMs = elapsed;
      console.log(`  ✓ Signal Feed confirmed: ${(signalFeedDurationMs / 1000).toFixed(1)}s from click (${currentFeedCount - preClickFeedCount} new events)`);
    }

    if (cascadeCompleted && signalFeedConfirmed) break;

    // Timeout after 30s
    if (elapsed > 30_000) {
      console.log(`  ✗ Timeout after 30s.`);
      break;
    }
  }

  // ── Check topology color state ──
  // Amber state: look for amber-colored elements in the topology
  const amberElements = await page.locator("[class*='amber'], [style*='amber'], [stroke*='amber']").count().catch(() => 0);

  // ══════════════════════════════════════════════════════════════
  // TIMING REPORT
  // ══════════════════════════════════════════════════════════════
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║  BEAT 6 REHEARSAL — TIMING REPORT                     ║");
  console.log("╠════════════════════════════════════════════════════════╣");
  console.log(`║  Click → cascade complete  : ${cascadeCompleted ? (cascadeDurationMs / 1000).toFixed(1) + "s" : "FAILED"}`);
  console.log(`║  Click → Signal Feed       : ${signalFeedConfirmed ? (signalFeedDurationMs / 1000).toFixed(1) + "s" : "NOT SEEN"}`);
  console.log("╠════════════════════════════════════════════════════════╣");

  // Evaluate against beat timing
  // Beat window: click happens at ~2.4s, cascade needs to complete before ~5.8s (c1 narration)
  // That gives ~3.4s from click to cascade completion
  const cascadeBudget = 3400; // ms
  const cascadeOnTime = cascadeCompleted && cascadeDurationMs <= cascadeBudget;

  // Signal Feed needs to be visible by ~9.4s from beat start = ~7.0s from click  
  const signalBudget = 7000;
  const signalOnTime = signalFeedConfirmed && signalFeedDurationMs <= signalBudget;

  console.log(`║  Cascade budget (≤3.4s)   : ${cascadeOnTime ? "✓ ON TIME" : cascadeCompleted ? "⚠ LATE" : "✗ FAILED"}`);
  console.log(`║  Signal Feed budget (≤7s) : ${signalOnTime ? "✓ ON TIME" : signalFeedConfirmed ? "⚠ LATE" : "✗ NOT SEEN"}`);
  console.log("╠════════════════════════════════════════════════════════╣");

  const captureReady = cascadeOnTime && signalFeedConfirmed;
  console.log(`║  VERDICT: ${captureReady ? "CAPTURE-READY ✓" : "NEEDS ADJUSTMENT ⚠"}`);
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // ── Detailed observations ──
  console.log("─── OBSERVATIONS ───\n");

  if (!cascadeCompleted) {
    console.log("  ✗ Cascade did NOT complete. Posture may not have switched.");
    console.log("    Check: Did wallet approval succeed? Any error in PostureControl?");
  } else {
    console.log(`  ✓ Posture switch confirmed (click → cascade: ${(cascadeDurationMs / 1000).toFixed(1)}s)`);
    if (cascadeDurationMs <= cascadeBudget) {
      console.log("    Fits within the 2s silence window after 'One click.'");
    } else {
      console.log("    ⚠ Exceeds the 2s silence window. May overlap with 'Gates locked.' narration.");
      console.log("    Options: (a) extend silence, (b) accept overlap, (c) rehearse for faster approval.");
    }
  }

  if (!signalFeedConfirmed) {
    console.log("  ⚠ PostureChangedEvent not detected in Signal Feed text.");
    console.log("    This may be a locator issue — check Signal Feed visually.");
  } else {
    console.log(`  ✓ Signal Feed shows posture event (click → feed: ${(signalFeedDurationMs / 1000).toFixed(1)}s)`);
  }

  console.log(`\n  Amber topology elements detected: ${amberElements}`);

  // ══════════════════════════════════════════════════════════════
  // DONE — Leave browser in Defensive for operator inspection.
  // Recovery (Defensive → Commercial) is a separate manual action.
  // ══════════════════════════════════════════════════════════════

  if (cascadeCompleted) {
    console.log("\n─── POST-REHEARSAL NOTE ───\n");
    console.log("  Posture is now Defensive. Browser stays open.");
    console.log("  To reset to Commercial before capture:");
    console.log("    1. Click the 'Commercial' chip in the UI");
    console.log("    2. Approve wallet popup");
    console.log("    3. Wait for chip to show Commercial as active\n");
  }

  // ── Stay alive ──
  await stayAlive(context, devServer!);
}

// ── Posture switch helper ─────────────────────────────────────────

async function performPostureSwitch(page: Page, buttonText: string, targetLabel: string) {
  const btn = page.locator(`button:has-text('${buttonText}')`).first();
  const visible = await btn.isVisible().catch(() => false);
  if (!visible) {
    console.log(`  ✗ '${buttonText}' button not found.`);
    return;
  }
  await btn.click();
  console.log(`  Clicked '${buttonText}'. Approve in wallet popup.\n`);

  console.log("  ┌─────────────────────────────────────────────────┐");
  console.log("  │ WALLET APPROVAL REQUIRED                        │");
  console.log("  │ Approve the transaction in Eve Vault.           │");
  console.log("  │ Script will detect completion automatically.    │");
  console.log("  └─────────────────────────────────────────────────┘\n");

  const expectedBtn = targetLabel === "Commercial" ? "Commercial" : "Defensive";
  const expectedClass = targetLabel === "Commercial" ? "text-primary" : "text-destructive";
  const switched = await pollUntil(
    `posture → ${targetLabel}`,
    async () => {
      const hasActiveClass = await page.locator(`button:has-text('${expectedBtn}')`)
        .first().evaluate((el) => el.className.includes(expectedClass)).catch(() => false);
      return hasActiveClass;
    },
    60_000,
    2_000,
  );
  console.log(`  ${switched ? "✓" : "✗"} Posture ${switched ? "confirmed" : "not confirmed"}: ${targetLabel}`);
}

// ── Keep browser alive ────────────────────────────────────────────

async function stayAlive(context: BrowserContext, devServer: ChildProcess) {
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Browser remains open. Interact freely.");
  console.log("  Press Ctrl+C to close and exit.");
  console.log("═══════════════════════════════════════════════════════\n");

  await new Promise<void>((resolve) => {
    process.on("SIGINT", async () => {
      console.log("\n  Closing browser...");
      await context.close().catch(() => {});
      devServer.kill();
      resolve();
    });
    process.on("SIGTERM", async () => {
      await context.close().catch(() => {});
      devServer.kill();
      resolve();
    });
  });
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });

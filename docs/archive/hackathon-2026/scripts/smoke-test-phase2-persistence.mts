/**
 * Phase 2 — Persistence & Signed-Transaction Validation
 *
 * Semi-automated headed Playwright flow with manual pause points.
 *
 * Phases:
 *  A. Reconnect — launch with Eve Vault, manual unlock/connect, verify populated
 *  B. Solar system assignment persistence — configure, verify, reload, verify again
 *  C. Map framing + lock persistence — position, lock, reload, verify again
 *  D. Signed transaction — posture switch with wallet approval, capture analysis
 *
 * Profile: Uses a STABLE profile directory to test cross-launch persistence.
 *          Pass --clean to start fresh. Default: reuse existing profile.
 *
 * Usage:
 *   npx tsx scripts/smoke-test-phase2-persistence.mts          # reuse profile
 *   npx tsx scripts/smoke-test-phase2-persistence.mts --clean  # fresh profile
 */

import { chromium, type BrowserContext, type Page } from "playwright";
import { spawn, type ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.resolve(__dirname, "..");
const SCREENSHOT_DIR = path.join(PROJECT_DIR, "recordings", "phase2");
const VIDEO_DIR = path.join(PROJECT_DIR, "recordings", "phase2", "video");
const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;
const WIDTH = 2560;
const HEIGHT = 1440;

const EVE_VAULT_PATH = String.raw`C:\Users\micha\Downloads\eve-vault-chrome\eve-vault-chrome`;

// Stable profile directory — persists across runs
const PROFILE_DIR = path.join(PROJECT_DIR, "recordings", ".chromium-profile");

const CLEAN_MODE = process.argv.includes("--clean");

// localStorage keys we care about
const LS_KEYS = {
  spatialPins: "cc_spatial_pins",
  camera: "cc:strategic-map:camera",
  starfield: "cc:strategic-map:starfield",
};

// ── Helpers ───────────────────────────────────────────────────────

function waitForEnter(prompt: string): Promise<void> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, () => { rl.close(); resolve(); });
  });
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

async function screenshotPage(page: Page, name: string): Promise<string> {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`  📷 Screenshot: ${name}.png`);
  return filePath;
}

async function readLocalStorage(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => localStorage.getItem(k), key);
}

async function readAllLocalStorage(page: Page): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  for (const [label, key] of Object.entries(LS_KEYS)) {
    result[label] = await readLocalStorage(page, key);
  }
  return result;
}

function printBox(lines: string[]) {
  const maxLen = Math.max(...lines.map(l => l.length));
  const border = "═".repeat(maxLen + 4);
  console.log(`╔${border}╗`);
  for (const line of lines) {
    console.log(`║  ${line.padEnd(maxLen + 2)}║`);
  }
  console.log(`╚${border}╝`);
}

interface PhaseResult {
  area: string;
  attempted: string;
  succeeded: string;
  failed: string;
  consequence: string;
}

const results: PhaseResult[] = [];

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  Phase 2: Persistence & Signed-Transaction Validation    ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  console.log(`Resolution:    ${WIDTH}×${HEIGHT}`);
  console.log(`Eve Vault:     ${EVE_VAULT_PATH}`);
  console.log(`Profile dir:   ${PROFILE_DIR}`);
  console.log(`Profile mode:  ${CLEAN_MODE ? "CLEAN (fresh)" : "REUSE (persistent)"}`);
  console.log(`Output:        ${SCREENSHOT_DIR}\n`);

  // Validate extension
  const manifestPath = path.join(EVE_VAULT_PATH, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error(`✗ manifest.json not found at ${manifestPath}`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  console.log(`Extension:     ${manifest.name} v${manifest.version}\n`);

  // Prepare directories
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  if (CLEAN_MODE && fs.existsSync(PROFILE_DIR)) {
    console.log("Cleaning profile directory...");
    fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(PROFILE_DIR, { recursive: true });

  // ── Dev server ──────────────────────────────────────────────────
  console.log("─── Starting Vite dev server ───");
  let devServer: ChildProcess | undefined;
  try { devServer = await startDevServer(); console.log(`✓ Dev server on ${BASE_URL}\n`); }
  catch (e) { console.error("✗", (e as Error).message); process.exit(1); }

  // ── Browser launch ──────────────────────────────────────────────
  console.log("─── Launching headed Chromium ───");
  let context: BrowserContext;
  try {
    context = await chromium.launchPersistentContext(PROFILE_DIR, {
      headless: false,
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      colorScheme: "dark",
      recordVideo: { dir: VIDEO_DIR, size: { width: WIDTH, height: HEIGHT } },
      args: [
        `--window-size=${WIDTH},${HEIGHT}`,
        `--disable-extensions-except=${EVE_VAULT_PATH}`,
        `--load-extension=${EVE_VAULT_PATH}`,
        "--disable-gpu",
      ],
    });
    console.log("✓ Browser launched\n");
  } catch (e) {
    console.error("✗", (e as Error).message); devServer?.kill(); process.exit(1);
  }

  const page = await context.newPage();

  // ═══════════════════════════════════════════════════════════════
  // PHASE A — RECONNECT / RESUME
  // ═══════════════════════════════════════════════════════════════
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  PHASE A — CONNECT WALLET & VERIFY POPULATED STATE  ");
  console.log("═══════════════════════════════════════════════════════\n");

  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(3_000);

  // Check if already connected (reuse profile case)
  const connectBtnVisible = await page.locator("text=/connect.*wallet/i").first().isVisible().catch(() => false);

  if (connectBtnVisible) {
    printBox([
      "MANUAL STEP — CONNECT WALLET",
      "",
      "1. Click the Eve Vault extension icon (puzzle piece",
      "   in the browser toolbar).",
      "2. Unlock Eve Vault if prompted for a password.",
      "3. In the CC app, click the orange 'Connect Wallet'",
      "   button (top-right).",
      "4. Choose 'Eve Vault' in the wallet-selection modal.",
      "5. Approve the connection in the Eve Vault popup.",
      "6. Wait until the dashboard shows your structures",
      "   (topology map populated, structure count visible).",
    ]);
    await waitForEnter("\n>>> Press ENTER once the wallet is connected and dashboard is populated...\n");
    await page.waitForTimeout(2_000);
    // Reload to settle
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(4_000);
  } else {
    console.log("✓ Wallet appears already connected (reuse profile).");
    console.log("  Verifying surfaces...");
    await page.waitForTimeout(2_000);
  }

  // Verify populated state
  const topologyOk = await page.locator("svg circle, svg line, svg path").first().isVisible().catch(() => false);
  const structureText = await page.locator("text=/\\d+ Gates/i").first().textContent().catch(() => null);
  const postureBtns = await page.locator("text=/Commercial|Defensive|Open for Business|Defense Mode/i").first().isVisible().catch(() => false);

  console.log(`\n  Topology SVG elements: ${topologyOk ? "YES" : "NO"}`);
  console.log(`  Structure counts:      ${structureText ?? "(not found)"}`);
  console.log(`  Posture controls:      ${postureBtns ? "YES" : "NO"}`);

  const phaseAOk = topologyOk && structureText !== null;
  results.push({
    area: "Phase A: Reconnect",
    attempted: "Wallet connection, dashboard population",
    succeeded: phaseAOk ? "All surfaces populated" : "Partial",
    failed: phaseAOk ? "—" : "Topology or structure counts missing",
    consequence: phaseAOk ? "Wallet-dependent demo capture viable" : "May need page reload",
  });

  await screenshotPage(page, "A-dashboard-connected");

  if (!phaseAOk) {
    console.log("\n⚠ Dashboard not fully populated. Continuing anyway for remaining phases.\n");
  }

  // Read baseline localStorage
  console.log("\n  Baseline localStorage:");
  const baseline = await readAllLocalStorage(page);
  for (const [k, v] of Object.entries(baseline)) {
    console.log(`    ${k}: ${v ? `${v.substring(0, 80)}${v.length > 80 ? "..." : ""}` : "(empty)"}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE B — SOLAR SYSTEM ASSIGNMENT PERSISTENCE
  // ═══════════════════════════════════════════════════════════════
  console.log("\n\n═══════════════════════════════════════════════════════");
  console.log("  PHASE B — SOLAR SYSTEM ASSIGNMENT PERSISTENCE       ");
  console.log("═══════════════════════════════════════════════════════\n");

  // Navigate to settings
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle", timeout: 15_000 });
  await page.waitForTimeout(2_000);
  await screenshotPage(page, "B1-settings-before-assignment");

  printBox([
    "MANUAL STEP — ASSIGN SOLAR SYSTEMS",
    "",
    "You should now see the Configuration screen with",
    "a 'Network Node Locations' section.",
    "",
    "For each network node listed:",
    "  1. Click the solar system field / picker",
    "  2. Type a system name (e.g. 'Jita') and select it",
    "  3. Repeat for all nodes (or at least 2-3)",
    "",
    "This assigns a solar system label to each node.",
    "If nodes already have assignments, you can skip this.",
  ]);
  await waitForEnter("\n>>> Press ENTER once you have assigned solar systems to nodes...\n");
  await page.waitForTimeout(1_000);

  // Verify: check localStorage for spatial pins
  const pinsAfterAssign = await readLocalStorage(page, LS_KEYS.spatialPins);
  const pinsParsed = pinsAfterAssign ? JSON.parse(pinsAfterAssign) : [];
  const pinCount = Array.isArray(pinsParsed) ? pinsParsed.length : 0;

  console.log(`\n  Spatial pins in localStorage: ${pinCount}`);
  if (pinCount > 0) {
    console.log("  Sample entry:", JSON.stringify(pinsParsed[0]).substring(0, 120));
  }

  await screenshotPage(page, "B2-settings-after-assignment");

  // Test 1: Page reload persistence
  console.log("\n  Testing reload persistence...");
  await page.reload({ waitUntil: "networkidle", timeout: 15_000 });
  await page.waitForTimeout(2_000);

  const pinsAfterReload = await readLocalStorage(page, LS_KEYS.spatialPins);
  const pinsReloadParsed = pinsAfterReload ? JSON.parse(pinsAfterReload) : [];
  const pinsReloadCount = Array.isArray(pinsReloadParsed) ? pinsReloadParsed.length : 0;
  const reloadPersisted = pinsReloadCount === pinCount && pinCount > 0;

  console.log(`  After reload: ${pinsReloadCount} pins (${reloadPersisted ? "PERSISTED ✓" : "LOST ✗"})`);
  await screenshotPage(page, "B3-settings-after-reload");

  // Test 2: Navigate away and back
  console.log("  Testing navigate-away persistence...");
  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15_000 });
  await page.waitForTimeout(1_500);
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle", timeout: 15_000 });
  await page.waitForTimeout(2_000);

  const pinsAfterNav = await readLocalStorage(page, LS_KEYS.spatialPins);
  const pinsNavParsed = pinsAfterNav ? JSON.parse(pinsAfterNav) : [];
  const navPersisted = (Array.isArray(pinsNavParsed) ? pinsNavParsed.length : 0) === pinCount && pinCount > 0;
  console.log(`  After navigate-away/back: ${navPersisted ? "PERSISTED ✓" : "LOST ✗"}`);

  // Check that solar systems appear in gate list
  console.log("  Verifying solar system labels in gates list...");
  await page.goto(`${BASE_URL}/gates`, { waitUntil: "networkidle", timeout: 15_000 });
  await page.waitForTimeout(2_000);

  await screenshotPage(page, "B4-gates-with-solar-systems");

  results.push({
    area: "Phase B: Solar system persistence",
    attempted: `${pinCount} solar system assignments, reload + navigate persistence`,
    succeeded: reloadPersisted && navPersisted ? "localStorage persists across reload and navigation" : reloadPersisted ? "Reload only" : "None verified",
    failed: !reloadPersisted ? "Reload lost data" : !navPersisted ? "Navigation lost data" : "—",
    consequence: reloadPersisted ? "One-time setup, survives session" : "Must re-assign each session",
  });

  // ═══════════════════════════════════════════════════════════════
  // PHASE C — MAP FRAMING + LOCK PERSISTENCE
  // ═══════════════════════════════════════════════════════════════
  console.log("\n\n═══════════════════════════════════════════════════════");
  console.log("  PHASE C — MAP FRAMING + LOCK PERSISTENCE            ");
  console.log("═══════════════════════════════════════════════════════\n");

  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15_000 });
  await page.waitForTimeout(3_000);

  // Read current camera state
  const cameraBefore = await readLocalStorage(page, LS_KEYS.camera);
  console.log(`  Camera state before: ${cameraBefore ? cameraBefore.substring(0, 100) : "(none)"}`);
  await screenshotPage(page, "C1-map-before-framing");

  printBox([
    "MANUAL STEP — FRAME AND LOCK THE MAP",
    "",
    "In the Strategic Network map on the dashboard:",
    "",
    "1. Use mouse-drag to orbit the 3D map to your",
    "   preferred viewing angle. Left-drag = orbit.",
    "2. Use scroll wheel to zoom to a good level.",
    "3. Right-drag (or shift+drag) to pan the map",
    "   so structures are well-composed on screen.",
    "4. Click the small 'lock' label in the top-right",
    "   corner of the map panel to freeze the view.",
    "   (It is a tiny text button near 'stars' and 'reset'.)",
    "5. Verify the map no longer responds to drag/scroll.",
  ]);
  await waitForEnter("\n>>> Press ENTER once the map is framed and locked...\n");
  await page.waitForTimeout(500);

  // Read camera state after lock
  const cameraAfterLock = await readLocalStorage(page, LS_KEYS.camera);
  let cameraObj: Record<string, unknown> = {};
  try { cameraObj = JSON.parse(cameraAfterLock ?? "{}"); } catch { /* ignore */ }
  const isLocked = cameraObj.locked === true;

  console.log(`\n  Camera state after lock:`);
  console.log(`    locked:  ${cameraObj.locked}`);
  console.log(`    azimuth: ${cameraObj.azimuth}`);
  console.log(`    polar:   ${cameraObj.polar}`);
  console.log(`    zoom:    ${cameraObj.zoom}`);
  console.log(`    panX:    ${cameraObj.panX}`);
  console.log(`    panY:    ${cameraObj.panY}`);

  await screenshotPage(page, "C2-map-after-lock");

  // Test: Reload persistence for camera + lock
  console.log("\n  Testing reload persistence for camera + lock...");
  await page.reload({ waitUntil: "networkidle", timeout: 15_000 });
  await page.waitForTimeout(4_000);

  const cameraAfterReload = await readLocalStorage(page, LS_KEYS.camera);
  let cameraReloadObj: Record<string, unknown> = {};
  try { cameraReloadObj = JSON.parse(cameraAfterReload ?? "{}"); } catch { /* ignore */ }
  const lockSurvived = cameraReloadObj.locked === true;
  const cameraSurvived = cameraReloadObj.azimuth === cameraObj.azimuth &&
                         cameraReloadObj.zoom === cameraObj.zoom;

  console.log(`  After reload:`);
  console.log(`    locked:  ${cameraReloadObj.locked} ${lockSurvived ? "✓" : "✗"}`);
  console.log(`    camera:  ${cameraSurvived ? "SAME ✓" : "CHANGED ✗"}`);

  await screenshotPage(page, "C3-map-after-reload");

  results.push({
    area: "Phase C: Map framing + lock",
    attempted: "Frame map, lock, reload persistence",
    succeeded: isLocked && lockSurvived && cameraSurvived
      ? "Camera + lock persist across reload via localStorage"
      : isLocked ? "Lock set but persistence unclear" : "Lock not detected",
    failed: !isLocked ? "Lock not written to localStorage" : !lockSurvived ? "Lock lost on reload" : !cameraSurvived ? "Camera position shifted" : "—",
    consequence: lockSurvived && cameraSurvived ? "Frame once, lock, capture anytime" : "Must re-frame per session",
  });

  // ═══════════════════════════════════════════════════════════════
  // PHASE D — SIGNED TRANSACTION (POSTURE SWITCH)
  // ═══════════════════════════════════════════════════════════════
  console.log("\n\n═══════════════════════════════════════════════════════");
  console.log("  PHASE D — SIGNED TRANSACTION (POSTURE SWITCH)       ");
  console.log("═══════════════════════════════════════════════════════\n");

  // Navigate to dashboard where PostureControl lives
  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15_000 });
  await page.waitForTimeout(3_000);

  // Detect current posture from the PostureControl buttons
  // The inline PostureControl shows two buttons: "Commercial" and "Defensive"
  // The ACTIVE posture has a filled/highlighted button style
  const defensiveBtn = page.locator("button", { hasText: /^Defensive$/i }).first();
  const commercialBtn = page.locator("button", { hasText: /^Commercial$/i }).first();
  const defBtnVisible = await defensiveBtn.isVisible().catch(() => false);
  const comBtnVisible = await commercialBtn.isVisible().catch(() => false);

  // Determine which is active by checking for the active/filled style class
  // The active button has a distinct background (e.g. bg-orange-700 or similar)
  let currentPosture = "Unknown";
  if (defBtnVisible && comBtnVisible) {
    // Check aria-pressed or active styling — fall back to checking the button's classes
    const defClasses = await defensiveBtn.getAttribute("class").catch(() => "") ?? "";
    const comClasses = await commercialBtn.getAttribute("class").catch(() => "") ?? "";
    // Active button typically has a filled background (bg-*-700, bg-*-600) vs outline style
    if (defClasses.includes("bg-") && !comClasses.includes("bg-")) {
      currentPosture = "Defensive";
    } else if (comClasses.includes("bg-") && !defClasses.includes("bg-")) {
      currentPosture = "Commercial";
    } else {
      // Both or neither have bg- classes; use a broader heuristic
      // The active one usually has a brighter/filled appearance
      currentPosture = "Unknown (both buttons visible, style ambiguous)";
    }
  }
  const targetPosture = currentPosture.includes("Defensive") ? "Commercial" : "Defensive";

  console.log(`  Current posture: ${currentPosture}`);
  console.log(`  Target posture:  ${targetPosture}\n`);

  await screenshotPage(page, "D1-before-posture-switch");

  // Start video recording context info
  console.log("  Video recording is active for this session.");
  console.log("  We will observe whether the wallet popup appears in the video.\n");

  printBox([
    "MANUAL STEP — POSTURE SWITCH (SIGNED TRANSACTION)",
    "",
    `Current posture: ${currentPosture}`,
    `Target posture:  ${targetPosture}`,
    "",
    "In the Strategic Network map header, you should see",
    "the posture control with a button to switch mode.",
    "",
    "1. Click the posture switch button.",
    `Button label: '${targetPosture}'`,
    "",
    "2. A wallet approval popup will appear.",
    "   It may be LARGE (browser-sized at this resolution).",
    "   Click 'Approve' in the wallet popup.",
    "",
    "3. Wait for the transaction to complete.",
    "   You should see the posture indicator change",
    "   and possibly a success banner.",
    "",
    "4. NOTE what happens visually:",
    "   - Did the popup cover the entire browser window?",
    "   - Did it appear as a separate window?",
    "   - Could you see the main app behind it?",
  ]);
  await waitForEnter("\n>>> Press ENTER after the posture switch completes (or fails)...\n");
  await page.waitForTimeout(3_000);

  // Verify posture changed by re-checking button styles
  let afterPosture = "Unknown";
  if (defBtnVisible && comBtnVisible) {
    const defClassesAfter = await defensiveBtn.getAttribute("class").catch(() => "") ?? "";
    const comClassesAfter = await commercialBtn.getAttribute("class").catch(() => "") ?? "";
    if (defClassesAfter.includes("bg-") && !comClassesAfter.includes("bg-")) {
      afterPosture = "Defensive";
    } else if (comClassesAfter.includes("bg-") && !defClassesAfter.includes("bg-")) {
      afterPosture = "Commercial";
    }
  }
  // Also check the signal feed for "Network Posture Set" as a confirmation
  const postureEventVisible = await page.locator("text=/Network Posture Set/i").first().isVisible().catch(() => false);
  const postureChanged = (afterPosture !== currentPosture && afterPosture !== "Unknown") || postureEventVisible;

  console.log(`\n  Posture after switch: ${afterPosture}`);
  console.log(`  Posture changed:     ${postureChanged ? "YES ✓" : "NO ✗"}`);

  // Check for success banner
  const successBanner = await page.locator("text=/posture.*set|transition.*complete|success/i").first().isVisible().catch(() => false);
  console.log(`  Success feedback:    ${successBanner ? "visible" : "not visible (may have auto-dismissed)"}`);

  await screenshotPage(page, "D2-after-posture-switch");

  // Check map overlay change (defence = red tint, commercial = no tint)
  const defenseOverlay = await page.locator("[class*='defense'], [class*='Defence']").first().isVisible().catch(() => false);
  console.log(`  Defense overlay:     ${defenseOverlay ? "visible" : "not visible"}`);

  // Ask operator about popup behavior
  console.log("\n");
  printBox([
    "OPERATOR OBSERVATION — WALLET POPUP BEHAVIOR",
    "",
    "Please answer these questions in your head",
    "(the script will continue, but your observations",
    "are critical for the demo production plan):",
    "",
    "Q1. Was the Approve popup a separate browser window",
    "    or a tab/panel within the same window?",
    "Q2. Did it cover the entire viewport or part of it?",
    "Q3. Could you see the CC app behind the popup?",
    "Q4. After approving, did the popup close automatically?",
  ]);
  await waitForEnter("\n>>> Press ENTER to continue to popup capture analysis...\n");

  // Detect open windows / pages in the browser context
  const allPages = context.pages();
  console.log(`\n  Browser pages open: ${allPages.length}`);
  for (let i = 0; i < allPages.length; i++) {
    const p = allPages[i];
    const url = p.url();
    const title = await p.title().catch(() => "(untitled)");
    console.log(`    [${i}] ${url.substring(0, 80)} — "${title}"`);
  }

  // Check if any page looks like a wallet popup
  const walletPages = allPages.filter(p =>
    p.url().includes("chrome-extension://") || p.url().includes("wallet") || p.url().includes("vault")
  );
  console.log(`  Wallet-related pages detected: ${walletPages.length}`);
  if (walletPages.length > 0) {
    console.log("    NOTE: Wallet popups are SEPARATE pages/windows — they should NOT");
    console.log("    appear in viewport-only video recording of the main app page.");
  }

  results.push({
    area: "Phase D: Signed transaction",
    attempted: `Posture switch: ${currentPosture} → ${targetPosture}`,
    succeeded: postureChanged ? `Posture changed to ${afterPosture}` : "Transaction may have failed",
    failed: !postureChanged ? "Posture did not change — check chain/wallet" : "—",
    consequence: postureChanged
      ? "Signed actions work; wallet popup is a separate surface"
      : "Posture switch needs investigation before demo",
  });

  // ═══════════════════════════════════════════════════════════════
  // PERSISTENCE CROSS-LAUNCH TEST (Optional, if not --clean)
  // ═══════════════════════════════════════════════════════════════
  console.log("\n\n═══════════════════════════════════════════════════════");
  console.log("  PERSISTENCE CROSS-LAUNCH TEST                        ");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("  To test cross-launch persistence (fresh browser, same profile),");
  console.log("  we will now close and relaunch the browser.\n");

  // Save the current state for comparison
  const preCloseLS = await readAllLocalStorage(page);
  console.log("  State before close:");
  for (const [k, v] of Object.entries(preCloseLS)) {
    console.log(`    ${k}: ${v ? "SET" : "EMPTY"}`);
  }

  // Close browser
  const videoPath = await page.video()?.path();
  await page.close();
  await context.close();
  console.log("\n  Browser closed.");

  if (videoPath) {
    console.log(`  Video recorded: ${path.relative(PROJECT_DIR, videoPath)}`);
  }

  // Relaunch with same profile
  console.log("  Relaunching with same profile...\n");
  const context2 = await chromium.launchPersistentContext(PROFILE_DIR, {
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

  const page2 = await context2.newPage();

  // Check if wallet still connected
  await page2.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
  await page2.waitForTimeout(4_000);

  const connectBtnRelaunch = await page2.locator("text=/connect.*wallet/i").first().isVisible().catch(() => false);
  const topologyRelaunch = await page2.locator("svg circle, svg line, svg path").first().isVisible().catch(() => false);

  console.log("  After relaunch (same profile):");
  console.log(`    Wallet still connected:  ${!connectBtnRelaunch ? "YES ✓" : "NO — needs reconnect"}`);
  console.log(`    Topology populated:      ${topologyRelaunch ? "YES ✓" : "NO ✗"}`);

  // Check localStorage survived
  const postRelaunchLS = await readAllLocalStorage(page2);
  console.log("    localStorage state:");
  for (const [k, v] of Object.entries(postRelaunchLS)) {
    const prev = preCloseLS[k];
    const match = (prev === null && v === null) || (prev !== null && v !== null && prev === v);
    console.log(`      ${k}: ${v ? "SET" : "EMPTY"} ${match ? "✓ (same)" : "⚠ (changed)"}`);
  }

  const walletSurvived = !connectBtnRelaunch;
  const lsSurvived = Object.entries(postRelaunchLS).every(([k, v]) => {
    const prev = preCloseLS[k as keyof typeof preCloseLS];
    return (prev === null && v === null) || (prev !== null && v !== null);
  });

  await screenshotPage(page2, "E-relaunch-state");

  if (connectBtnRelaunch) {
    printBox([
      "WALLET RECONNECT NEEDED",
      "",
      "The wallet connection did not survive relaunch.",
      "This is expected — Eve Vault session is browser-scoped.",
      "",
      "1. Click the Eve Vault extension icon and unlock.",
      "2. Click 'Connect Wallet' and reconnect.",
      "3. Wait for dashboard to populate.",
    ]);
    await waitForEnter("\n>>> Press ENTER after reconnecting (or press ENTER to skip)...\n");
    await page2.waitForTimeout(3_000);
  }

  // Verify critical persistence items after relaunch
  console.log("\n  Post-relaunch verification:");
  const pinsRelaunch = await readLocalStorage(page2, LS_KEYS.spatialPins);
  const pinsParsedRelaunch = pinsRelaunch ? JSON.parse(pinsRelaunch) : [];
  const pinsCountRelaunch = Array.isArray(pinsParsedRelaunch) ? pinsParsedRelaunch.length : 0;
  console.log(`    Solar system pins:  ${pinsCountRelaunch} (was ${pinCount}): ${pinsCountRelaunch === pinCount ? "✓ PERSISTED" : "✗ CHANGED"}`);

  const cameraRelaunch = await readLocalStorage(page2, LS_KEYS.camera);
  let cameraRelaunchObj: Record<string, unknown> = {};
  try { cameraRelaunchObj = JSON.parse(cameraRelaunch ?? "{}"); } catch { /* ignore */ }
  const lockRelaunch = cameraRelaunchObj.locked === true;
  console.log(`    Map locked:         ${lockRelaunch ? "YES ✓" : "NO ✗"}`);
  console.log(`    Camera zoom:        ${cameraRelaunchObj.zoom} (was ${cameraObj.zoom}): ${cameraRelaunchObj.zoom === cameraObj.zoom ? "✓ SAME" : "⚠ DIFFER"}`);

  await screenshotPage(page2, "E-relaunch-verified");

  results.push({
    area: "Cross-launch persistence",
    attempted: "Close browser, relaunch with same profile directory",
    succeeded: lsSurvived ? "localStorage survives relaunch" : "Partial",
    failed: walletSurvived ? "—" : "Wallet connection requires re-auth (expected)",
    consequence: lsSurvived
      ? "One-time setup (solar systems, map frame) persists across relaunches. Wallet needs one manual reconnect per session."
      : "Setup may need repeating per session",
  });

  // ═══════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log("\n\n═══════════════════════════════════════════════════════");
  console.log("  FINAL RESULTS                                        ");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("┌─────────────────────────────────┬───────────────────────────────────────────────────┬─────────────────────────────────────┬──────────────────────────────┬──────────────────────────────────────────┐");
  console.log("│ Area                            │ Attempted                                         │ Succeeded                           │ Failed                       │ Consequence                              │");
  console.log("├─────────────────────────────────┼───────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────┼──────────────────────────────────────────┤");
  for (const r of results) {
    console.log(`│ ${r.area.padEnd(31)} │ ${r.attempted.padEnd(49)} │ ${r.succeeded.padEnd(35)} │ ${r.failed.padEnd(28)} │ ${r.consequence.padEnd(40)} │`);
  }
  console.log("└─────────────────────────────────┴───────────────────────────────────────────────────┴─────────────────────────────────────┴──────────────────────────────┴──────────────────────────────────────────┘");

  console.log("\n───── PERSISTENCE SUMMARY ─────");
  console.log(`  Solar system pins:   ${pinsCountRelaunch === pinCount && pinCount > 0 ? "PERSIST across reload + relaunch ✓" : "Needs verification"}`);
  console.log(`  Camera position:     ${cameraSurvived ? "PERSIST across reload ✓" : "Needs verification"} ${cameraRelaunchObj.zoom === cameraObj.zoom ? "+ relaunch ✓" : ""}`);
  console.log(`  Map lock state:      ${lockRelaunch ? "PERSIST across relaunch ✓" : "Needs verification"}`);
  console.log(`  Storage mechanism:   localStorage (domain-scoped, origin: localhost:${PORT})`);
  console.log(`  Wallet session:      ${walletSurvived ? "PERSIST (unexpected)" : "Per-launch (needs reconnect each session)"}`);

  console.log("\n───── SESSION STRATEGY DATA POINTS ─────");
  console.log(`  Profile reuse:       ${lsSurvived ? "localStorage survives ✓" : "localStorage lost ✗"}`);
  console.log(`  Wallet reuse:        ${walletSurvived ? "YES" : "NO — manual reconnect needed per launch"}`);
  console.log(`  Setup overhead:      Solar systems + map frame are ONE-TIME if localStorage persists`);
  console.log(`  Wallet overhead:     ~15s manual unlock + connect per launch`);
  console.log(`  State drift risk:    Low — localStorage is deterministic, no time-based expiry`);

  console.log("\n───── RECORDING CAPTURE DATA POINTS ─────");
  console.log(`  Browser pages at end of session: ${context2.pages().length}`);
  console.log(`  Video recorded:      ${videoPath ? "YES" : "NO"}`);
  console.log("  Wallet popup type:   Needs operator observation (see questions above)");
  console.log("  Playwright video captures ONLY the page viewport, not browser chrome or popups.");
  console.log("  If wallet popup is a separate window/page: it will NOT contaminate viewport recording.");
  console.log("  If wallet popup is an overlay within the page: it WILL appear in recording.");

  // Cleanup
  await page2.close();
  await context2.close();
  devServer?.kill();

  console.log("\n✓ Phase 2 validation complete.");
  console.log(`  Screenshots: recordings/phase2/`);
  if (videoPath) console.log(`  Video: ${path.relative(PROJECT_DIR, videoPath)}`);
  console.log(`  Profile preserved at: ${path.relative(PROJECT_DIR, PROFILE_DIR)}`);
  console.log("  Rerun without --clean to test profile reuse.\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

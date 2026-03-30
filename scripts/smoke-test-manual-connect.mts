/**
 * Phase 1c — Semi-automated smoke test with manual wallet connection
 *
 * Flow:
 *  1. Launch Vite dev server
 *  2. Open headed Chromium at 2560×1440 with Eve Vault extension
 *  3. Navigate to dashboard
 *  4. PAUSE — operator manually unlocks Eve Vault and connects wallet
 *  5. On Enter, verify wallet-dependent surfaces (topology, gates, structures)
 *  6. Capture screenshots of connected state
 *
 * Usage: npx tsx scripts/smoke-test-manual-connect.mts
 */

import { chromium, type BrowserContext, type Page } from "playwright";
import { spawn, type ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import os from "os";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.resolve(__dirname, "..");
const SCREENSHOT_DIR = path.join(PROJECT_DIR, "recordings", "screenshots");
const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

const WIDTH = 2560;
const HEIGHT = 1440;

const EVE_VAULT_PATH = String.raw`C:\Users\micha\Downloads\eve-vault-chrome\eve-vault-chrome`;

// ── Helpers ───────────────────────────────────────────────────────

function waitForEnter(prompt: string): Promise<void> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, () => {
      rl.close();
      resolve();
    });
  });
}

function startDevServer(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const proc = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
      cwd: PROJECT_DIR,
      stdio: "pipe",
      shell: true,
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        proc.kill();
        reject(new Error("Dev server did not start within 30s"));
      }
    }, 30_000);

    proc.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      if (text.includes("Local:") || text.includes("localhost")) {
        if (!started) {
          started = true;
          clearTimeout(timeout);
          setTimeout(() => resolve(proc), 1_500);
        }
      }
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      if (text.includes("EADDRINUSE")) {
        clearTimeout(timeout);
        reject(new Error(`Port ${PORT} already in use`));
      }
    });

    proc.on("error", (err) => { clearTimeout(timeout); reject(err); });
    proc.on("exit", (code) => {
      if (!started) { clearTimeout(timeout); reject(new Error(`Dev server exited with code ${code}`)); }
    });
  });
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  Phase 1c: Semi-Automated Smoke Test (Manual Connect)  ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log(`Resolution:  ${WIDTH}×${HEIGHT}`);
  console.log(`Eve Vault:   ${EVE_VAULT_PATH}`);
  console.log(`Output:      ${SCREENSHOT_DIR}\n`);

  const manifestPath = path.join(EVE_VAULT_PATH, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error(`✗ manifest.json not found at ${manifestPath}`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  console.log(`Extension:   ${manifest.name} v${manifest.version}\n`);

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // ── Step 1: Dev server ──────────────────────────────────────────
  console.log("─── Step 1: Starting Vite dev server ───");
  let devServer: ChildProcess | undefined;
  try {
    devServer = await startDevServer();
    console.log(`✓ Dev server running on ${BASE_URL}\n`);
  } catch (err) {
    console.error("✗ Failed:", (err as Error).message);
    process.exit(1);
  }

  // ── Step 2: Launch browser ──────────────────────────────────────
  console.log("─── Step 2: Launching headed Chromium with Eve Vault ───");
  const userDataDir = path.join(os.tmpdir(), `pw-eve-vault-manual-${Date.now()}`);
  let context: BrowserContext;

  try {
    context = await chromium.launchPersistentContext(userDataDir, {
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
  } catch (err) {
    console.error("✗ Failed:", (err as Error).message);
    devServer?.kill();
    process.exit(1);
  }

  // ── Step 3: Navigate to dashboard ───────────────────────────────
  console.log("─── Step 3: Loading dashboard ───");
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(3_000);
  console.log("✓ Dashboard loaded\n");

  // ── Step 4: MANUAL WALLET CONNECTION ────────────────────────────
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║              MANUAL STEP — CONNECT WALLET               ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║                                                          ║");
  console.log("║  Look at the Chromium window that just opened.           ║");
  console.log("║                                                          ║");
  console.log("║  1. Click the Eve Vault extension icon (puzzle piece     ║");
  console.log("║     in the browser toolbar → Eve Vault).                 ║");
  console.log("║                                                          ║");
  console.log("║  2. Unlock Eve Vault if it asks for a password.          ║");
  console.log("║                                                          ║");
  console.log("║  3. In the CC app, click the orange 'Connect Wallet'    ║");
  console.log("║     button in the top-right corner.                      ║");
  console.log("║                                                          ║");
  console.log("║  4. In the wallet-selection modal, choose 'Eve Vault'.  ║");
  console.log("║                                                          ║");
  console.log("║  5. Approve the connection in the Eve Vault popup.       ║");
  console.log("║                                                          ║");
  console.log("║  6. Wait until the dashboard shows your structures       ║");
  console.log("║     (topology map populates, structure count > 0).       ║");
  console.log("║                                                          ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  await waitForEnter(">>> Press ENTER here once the wallet is connected and the dashboard shows your structures...\n");

  console.log("\n─── Step 5: Verifying wallet-dependent surfaces ───\n");

  // Give the page a moment to settle after connection
  await page.waitForTimeout(2_000);

  // ── Verification: Dashboard ─────────────────────────────────────
  console.log("Checking dashboard (/)...");

  // Reload to ensure clean state after connection
  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(4_000);

  const dashChecks = {
    "Connect Wallet button": await page.locator("text=/connect.*wallet/i").first().isVisible().catch(() => false),
    "Topology empty-state msg": await page.locator("text=/connect.*wallet.*to.*view/i").first().isVisible().catch(() => false),
    "SVG topology elements": await page.locator("svg circle, svg line, svg path").first().isVisible().catch(() => false),
    "Active Structures card": await page.locator("text=/Active Structures/i").first().isVisible().catch(() => false),
    "Gross Network Yield": await page.locator("text=/Gross Network/i").first().isVisible().catch(() => false),
    "Posture buttons": await page.locator("text=/Commercial|Defensive/i").first().isVisible().catch(() => false),
    "Signal Feed rows": await page.locator("text=/Toll Collected|Transit Authorized/i").first().isVisible().catch(() => false),
  };

  // Derive connection status from checks
  const isConnected = !dashChecks["Connect Wallet button"] || !dashChecks["Topology empty-state msg"];
  const topologyPopulated = dashChecks["SVG topology elements"] && !dashChecks["Topology empty-state msg"];

  console.log("\n  Dashboard element checks:");
  for (const [label, visible] of Object.entries(dashChecks)) {
    const icon = visible ? "✓" : "✗";
    console.log(`    ${icon} ${label}: ${visible}`);
  }
  console.log(`\n  Wallet connected:      ${isConnected ? "YES" : "NO"}`);
  console.log(`  Topology populated:    ${topologyPopulated ? "YES" : "NO"}`);

  // Screenshot connected dashboard
  const dashPath = path.join(SCREENSHOT_DIR, "connected-dashboard-2560x1440.png");
  await page.screenshot({ path: dashPath, fullPage: false });
  console.log(`  ✓ Screenshot: ${path.basename(dashPath)}\n`);

  // ── Verification: Gates ─────────────────────────────────────────
  console.log("Checking gates (/gates)...");
  await page.goto(`${BASE_URL}/gates`, { waitUntil: "networkidle", timeout: 15_000 });
  await page.waitForTimeout(3_000);

  const gatesEmpty = await page.locator("text=/no gates discovered/i").first().isVisible().catch(() => false);
  const gateCards = await page.locator("text=/gate/i").count();

  console.log(`  "No gates discovered" visible: ${gatesEmpty}`);
  console.log(`  Gate-related elements found:   ${gateCards}`);

  const gatesPath = path.join(SCREENSHOT_DIR, "connected-gates-2560x1440.png");
  await page.screenshot({ path: gatesPath, fullPage: false });
  console.log(`  ✓ Screenshot: ${path.basename(gatesPath)}\n`);

  // ── Verification: TradePosts ────────────────────────────────────
  console.log("Checking trade posts (/tradeposts)...");
  await page.goto(`${BASE_URL}/tradeposts`, { waitUntil: "networkidle", timeout: 15_000 });
  await page.waitForTimeout(3_000);

  const tradesEmpty = await page.locator("text=/no trade posts/i, text=/no posts/i").first().isVisible().catch(() => false);

  console.log(`  Empty-state visible: ${tradesEmpty}`);

  const tradesPath = path.join(SCREENSHOT_DIR, "connected-tradeposts-2560x1440.png");
  await page.screenshot({ path: tradesPath, fullPage: false });
  console.log(`  ✓ Screenshot: ${path.basename(tradesPath)}\n`);

  // ── Verification: Turrets ───────────────────────────────────────
  console.log("Checking turrets (/turrets)...");
  await page.goto(`${BASE_URL}/turrets`, { waitUntil: "networkidle", timeout: 15_000 });
  await page.waitForTimeout(3_000);

  const turretsPath = path.join(SCREENSHOT_DIR, "connected-turrets-2560x1440.png");
  await page.screenshot({ path: turretsPath, fullPage: false });
  console.log(`  ✓ Screenshot: ${path.basename(turretsPath)}\n`);

  // ── Verification: Activity feed ─────────────────────────────────
  console.log("Checking activity feed (/activity)...");
  await page.goto(`${BASE_URL}/activity`, { waitUntil: "networkidle", timeout: 15_000 });
  await page.waitForTimeout(3_000);

  const signalRows = await page.locator("text=/Toll Collected|Transit Authorized|Posture Set|Policy|Trade Post/i").count();
  console.log(`  Signal Feed event rows found: ${signalRows}`);

  const activityPath = path.join(SCREENSHOT_DIR, "connected-activity-2560x1440.png");
  await page.screenshot({ path: activityPath, fullPage: false });
  console.log(`  ✓ Screenshot: ${path.basename(activityPath)}\n`);

  // ── Verification: Return to dashboard for final topology check ──
  console.log("Final dashboard pass...");
  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15_000 });
  await page.waitForTimeout(4_000);

  // Check structure counts in the Active Structures card
  const structureCountText = await page.locator("text=/\\d+ Gates|\\d+ Governed|\\d+ Posts|\\d+ Nodes/i").first().textContent().catch(() => null);
  console.log(`  Structure count text: ${structureCountText ?? "(not found)"}`);

  const finalPath = path.join(SCREENSHOT_DIR, "connected-dashboard-final-2560x1440.png");
  await page.screenshot({ path: finalPath, fullPage: false });
  console.log(`  ✓ Screenshot: ${path.basename(finalPath)}\n`);

  // ── Summary ─────────────────────────────────────────────────────
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║                     TEST SUMMARY                         ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  Resolution:           ${WIDTH}×${HEIGHT}                       ║`);
  console.log(`║  Extension:            ${manifest.name} v${manifest.version}                  ║`);
  console.log(`║  Wallet connected:     ${isConnected ? "YES ✓" : "NO ✗ "}                            ║`);
  console.log(`║  Topology populated:   ${topologyPopulated ? "YES ✓" : "NO ✗ "}                            ║`);
  console.log(`║  Gates discovered:     ${!gatesEmpty ? "YES ✓" : "NO ✗ "}                            ║`);
  console.log(`║  Signal Feed rows:     ${String(signalRows).padEnd(4)}                            ║`);
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  if (isConnected && topologyPopulated && !gatesEmpty) {
    console.log("VERDICT: ✓ Real-wallet headed recording path is VIABLE.");
    console.log("The only manual step is unlocking Eve Vault + approving connection once.");
    console.log("After that, Playwright automation can handle all navigation and capture.\n");
  } else if (isConnected && !topologyPopulated) {
    console.log("VERDICT: ⚠ Wallet connected but topology did not populate.");
    console.log("Structure discovery may need additional time or a page reload.\n");
  } else {
    console.log("VERDICT: ✗ Wallet did not connect successfully.");
    console.log("Fixture injection (Option 2) is needed for wallet-dependent surfaces.\n");
  }

  console.log(`Screenshots saved to: recordings/screenshots/ (connected-*.png)`);

  // Cleanup
  await page.close();
  await context.close();
  devServer?.kill();

  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch { /* non-fatal */ }

  console.log("\nDone.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

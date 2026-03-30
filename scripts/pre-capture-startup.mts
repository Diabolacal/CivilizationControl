/**
 * Pre-Capture Startup — Readiness verification pass.
 *
 * Launches headed Chromium with stable profile + Eve Vault,
 * guides manual wallet connect if needed, then verifies all
 * capture-ready conditions:
 *   - Wallet connected
 *   - Structures populated (topology, gate counts)
 *   - Solar system assignments (localStorage)
 *   - Map framed + locked (localStorage)
 *   - Posture is Commercial
 *   - Trade listing present (1,000 Eupraxite / 100,000 Lux)
 *
 * Does NOT close the browser at the end — leaves the session
 * running for capture use. Press Ctrl+C in the terminal when done.
 *
 * Usage:
 *   npx tsx scripts/pre-capture-startup.mts
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

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;
const WIDTH = 2560;
const HEIGHT = 1440;

const EVE_VAULT_PATH = String.raw`C:\Users\micha\Downloads\eve-vault-chrome\eve-vault-chrome`;
const PROFILE_DIR = path.join(PROJECT_DIR, "recordings", ".chromium-profile");

const LS_KEYS = {
  spatialPins: "cc_spatial_pins",
  camera: "cc:strategic-map:camera",
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

async function readLocalStorage(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => localStorage.getItem(k), key);
}

interface CheckResult { label: string; ok: boolean; detail: string }
const checks: CheckResult[] = [];

function check(label: string, ok: boolean, detail: string) {
  checks.push({ label, ok, detail });
  console.log(`  ${ok ? "✓" : "✗"} ${label}: ${detail}`);
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║  Pre-Capture Startup — Readiness Verification         ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Validate extension
  const manifestPath = path.join(EVE_VAULT_PATH, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error(`✗ Eve Vault manifest.json not found at ${manifestPath}`);
    process.exit(1);
  }
  fs.mkdirSync(PROFILE_DIR, { recursive: true });

  // ── Dev server ──────────────────────────────────────────────────
  console.log("─── Starting Vite dev server ───");
  let devServer: ChildProcess;
  try {
    devServer = await startDevServer();
    console.log(`✓ Dev server running on ${BASE_URL}\n`);
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
  // STEP 1 — WALLET CONNECT
  // ══════════════════════════════════════════════════════════════
  console.log("═══ STEP 1: WALLET CONNECTION ═══\n");

  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(3_000);

  const connectBtnVisible = await page
    .locator("text=/connect.*wallet/i")
    .first().isVisible().catch(() => false);

  if (connectBtnVisible) {
    console.log("  Wallet is NOT connected. Manual action required.\n");
    console.log("  ┌─────────────────────────────────────────────────┐");
    console.log("  │ 1. Click Eve Vault extension icon (puzzle piece)│");
    console.log("  │ 2. Unlock vault if prompted                     │");
    console.log("  │ 3. Click 'Connect Wallet' in the CC app         │");
    console.log("  │ 4. Select 'Eve Vault' → Approve connection      │");
    console.log("  │ 5. Wait for dashboard to populate               │");
    console.log("  └─────────────────────────────────────────────────┘");
    await waitForEnter("\n>>> Press ENTER once wallet is connected and dashboard shows structures...\n");
    await page.waitForTimeout(2_000);
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(4_000);
  } else {
    console.log("  Wallet appears already connected (profile reuse).");
    await page.waitForTimeout(2_000);
  }

  // Verify wallet-dependent content
  const topologyOk = await page.locator("svg circle, svg line, svg path").first().isVisible().catch(() => false);
  const structureText = await page.locator("text=/\\d+ Gates/i").first().textContent().catch(() => null);
  check("Wallet connected", !connectBtnVisible || topologyOk, topologyOk ? "Dashboard populated" : "NOT populated");
  check("Structures visible", !!structureText, structureText ?? "No structure counts found");
  check("Topology rendered", topologyOk, topologyOk ? "SVG elements present" : "No topology SVG found");

  // ══════════════════════════════════════════════════════════════
  // STEP 2 — SOLAR SYSTEM ASSIGNMENTS
  // ══════════════════════════════════════════════════════════════
  console.log("\n═══ STEP 2: SOLAR SYSTEM ASSIGNMENTS ═══\n");

  const pinsRaw = await readLocalStorage(page, LS_KEYS.spatialPins);
  const pins = pinsRaw ? JSON.parse(pinsRaw) : [];
  const pinCount = Array.isArray(pins) ? pins.length : 0;

  if (pinCount > 0) {
    check("Solar systems assigned", true, `${pinCount} systems in localStorage (persisted)`);
  } else {
    console.log("  ⚠ No solar system assignments found.\n");
    console.log("  ┌─────────────────────────────────────────────────┐");
    console.log("  │ Navigate to /settings in the app.               │");
    console.log("  │ Under 'Network Node Locations', assign solar    │");
    console.log("  │ systems to each node, then come back to the     │");
    console.log("  │ dashboard (/).                                   │");
    console.log("  └─────────────────────────────────────────────────┘");
    await waitForEnter("\n>>> Press ENTER once solar systems are assigned...\n");
    await page.waitForTimeout(1_000);
    // Re-read from current page (may need nav back to /)
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15_000 });
    await page.waitForTimeout(2_000);
    const pinsRetry = await readLocalStorage(page, LS_KEYS.spatialPins);
    const retryParsed = pinsRetry ? JSON.parse(pinsRetry) : [];
    const retryCount = Array.isArray(retryParsed) ? retryParsed.length : 0;
    check("Solar systems assigned", retryCount > 0, `${retryCount} systems after manual assignment`);
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 3 — MAP FRAMING + LOCK
  // ══════════════════════════════════════════════════════════════
  console.log("\n═══ STEP 3: MAP FRAMING & LOCK ═══\n");

  const cameraRaw = await readLocalStorage(page, LS_KEYS.camera);
  let cameraObj: Record<string, unknown> = {};
  try { cameraObj = JSON.parse(cameraRaw ?? "{}"); } catch { /* empty */ }
  const isLocked = cameraObj.locked === true;

  if (isLocked) {
    check("Map locked", true, `azimuth=${cameraObj.azimuth}, zoom=${cameraObj.zoom}, locked=true`);
  } else {
    console.log(`  Map is ${cameraRaw ? "framed but NOT locked" : "not framed yet"}.\n`);
    console.log("  ┌─────────────────────────────────────────────────┐");
    console.log("  │ On the dashboard, position the strategic map:   │");
    console.log("  │  - Left-drag to orbit                           │");
    console.log("  │  - Scroll to zoom                               │");
    console.log("  │  - Right-drag to pan                            │");
    console.log("  │ Then click the 'lock' label (top-right of map)  │");
    console.log("  │ to freeze the camera.                           │");
    console.log("  └─────────────────────────────────────────────────┘");
    await waitForEnter("\n>>> Press ENTER once the map is framed and locked...\n");
    const cameraRetry = await readLocalStorage(page, LS_KEYS.camera);
    let retryObj: Record<string, unknown> = {};
    try { retryObj = JSON.parse(cameraRetry ?? "{}"); } catch { /* empty */ }
    check("Map locked", retryObj.locked === true, retryObj.locked === true ? "locked=true confirmed" : "Lock NOT detected");
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 4 — POSTURE STATE
  // ══════════════════════════════════════════════════════════════
  console.log("\n═══ STEP 4: POSTURE VERIFICATION ═══\n");

  // Look for posture indicators in the dashboard
  const postureText = await page.locator("text=/Commercial|Open for Business/i").first().isVisible().catch(() => false);
  const defenseText = await page.locator("text=/Defensive|Defense Mode/i").first().isVisible().catch(() => false);

  // Try to read posture button active states
  const defensiveBtn = page.locator("button", { hasText: /Defensive/i }).first();
  const commercialBtn = page.locator("button", { hasText: /Commercial/i }).first();
  const defBtnVisible = await defensiveBtn.isVisible().catch(() => false);
  const comBtnVisible = await commercialBtn.isVisible().catch(() => false);

  let currentPosture = "Unknown";
  if (defBtnVisible && comBtnVisible) {
    const defClasses = await defensiveBtn.getAttribute("class").catch(() => "") ?? "";
    const comClasses = await commercialBtn.getAttribute("class").catch(() => "") ?? "";
    if (defClasses.includes("bg-") && !comClasses.includes("bg-")) {
      currentPosture = "Defensive";
    } else if (comClasses.includes("bg-") && !defClasses.includes("bg-")) {
      currentPosture = "Commercial";
    }
  }

  const isCommercial = currentPosture === "Commercial";
  check("Posture is Commercial", isCommercial, currentPosture);

  if (!isCommercial && currentPosture !== "Unknown") {
    console.log("\n  ⚠ Posture is Defensive. Switch to Commercial is needed for Beat 6.\n");
    console.log("  ┌─────────────────────────────────────────────────┐");
    console.log("  │ Click the 'Commercial' posture button on the    │");
    console.log("  │ dashboard. Approve the wallet transaction.       │");
    console.log("  │ Wait for the posture to change.                 │");
    console.log("  └─────────────────────────────────────────────────┘");
    await waitForEnter("\n>>> Press ENTER once posture is switched to Commercial...\n");
    await page.waitForTimeout(3_000);
    // Re-check
    const defClassesAfter = await defensiveBtn.getAttribute("class").catch(() => "") ?? "";
    const comClassesAfter = await commercialBtn.getAttribute("class").catch(() => "") ?? "";
    let afterPosture = "Unknown";
    if (comClassesAfter.includes("bg-") && !defClassesAfter.includes("bg-")) {
      afterPosture = "Commercial";
    } else if (defClassesAfter.includes("bg-") && !comClassesAfter.includes("bg-")) {
      afterPosture = "Defensive";
    }
    check("Posture after switch", afterPosture === "Commercial", afterPosture);
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 5 — TRADE LISTING
  // ══════════════════════════════════════════════════════════════
  console.log("\n═══ STEP 5: TRADE LISTING VERIFICATION ═══\n");

  // Navigate to Trade Posts section
  await page.goto(`${BASE_URL}/tradeposts`, { waitUntil: "networkidle", timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(3_000);

  // Find SSU detail links and check each for the listing
  const ssuLinks = await page.locator("a[href*='/tradeposts/0x']").all();
  const ssuHrefs: string[] = [];
  for (const link of ssuLinks) {
    const href = await link.getAttribute("href");
    if (href) ssuHrefs.push(href);
  }
  let eupraxiteFound = false;
  let quantityFound = false;
  let priceFound = false;

  if (ssuHrefs.length > 0) {
    console.log(`  Found ${ssuHrefs.length} trade post(s). Checking each for listings...\n`);
    for (let i = 0; i < ssuHrefs.length; i++) {
      const href = ssuHrefs[i];
      console.log(`  Checking trade post ${i + 1}/${ssuHrefs.length}: ${href}`);
      await page.goto(`${BASE_URL}${href}`, { waitUntil: "networkidle", timeout: 15_000 });
      await page.waitForTimeout(3_000);

      const hasEupraxite = await page.locator("text=/Eupraxite/i").first().isVisible().catch(() => false);
      const hasQty = await page.locator("text=/1[,.]?000\\b/").first().isVisible().catch(() => false);
      const hasPrice = await page.locator("text=/100[,.]?000/").first().isVisible().catch(() => false);

      if (hasEupraxite) eupraxiteFound = true;
      if (hasQty) quantityFound = true;
      if (hasPrice) priceFound = true;

      console.log(`    Eupraxite: ${hasEupraxite ? "YES" : "no"}  Qty: ${hasQty ? "YES" : "no"}  Price: ${hasPrice ? "YES" : "no"}`);
      if (eupraxiteFound) break;
    }
  } else {
    console.log("  No trade post links found on /tradeposts.\n");
  }

  check("Trade listing — item", eupraxiteFound, eupraxiteFound ? "Eupraxite visible on SSU detail" : "Eupraxite NOT found on any SSU");
  check("Trade listing — quantity", quantityFound, quantityFound ? "1,000 qty visible" : "Not confirmed");
  check("Trade listing — price", priceFound, priceFound ? "100,000 Lux visible" : "Not confirmed");

  // ══════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════
  console.log("\n\n╔════════════════════════════════════════════════════════╗");
  console.log("║  READINESS SUMMARY                                     ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const passed = checks.filter(c => c.ok).length;
  const failed = checks.filter(c => !c.ok).length;

  for (const c of checks) {
    console.log(`  ${c.ok ? "✓" : "✗"} ${c.label.padEnd(30)} ${c.detail}`);
  }

  console.log(`\n  Result: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log("  ✓ SESSION IS CAPTURE-READY");
    console.log("    The browser will remain open for use.");
    console.log("    Press Ctrl+C in this terminal when done.\n");
  } else {
    console.log("  ⚠ SESSION HAS BLOCKERS — see failed checks above.");
    console.log("    Fix blockers, then re-run this script or proceed manually.\n");
  }

  // Keep the session alive — don't close browser
  console.log("  Browser session is live. Use it for capture or manual verification.");
  console.log("  Press Ctrl+C to shut down.\n");

  // Block forever until Ctrl+C
  await new Promise(() => {});
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});

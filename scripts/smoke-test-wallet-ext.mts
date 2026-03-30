/**
 * Phase 1b — Recording-environment smoke test WITH Eve Vault extension
 *
 * Goals:
 *  1. Launch Vite dev server
 *  2. Open headed Chromium at 2560×1440 with Eve Vault extension loaded
 *  3. Wait for extension to initialize, check if wallet connects
 *  4. Screenshot wallet-dependent surfaces: dashboard (topology), gates, posture
 *  5. Report viability findings for wallet-dependent capture
 *
 * Usage: npx tsx scripts/smoke-test-wallet-ext.mts
 */

import { chromium, type BrowserContext } from "playwright";
import { spawn, type ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.resolve(__dirname, "..");
const SCREENSHOT_DIR = path.join(PROJECT_DIR, "recordings", "screenshots");
const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

const WIDTH = 2560;
const HEIGHT = 1440;

const EVE_VAULT_PATH = String.raw`C:\Users\micha\Downloads\eve-vault-chrome\eve-vault-chrome`;

// ── Dev server management ────────────────────────────────────────

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

    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    proc.on("exit", (code) => {
      if (!started) {
        clearTimeout(timeout);
        reject(new Error(`Dev server exited with code ${code}`));
      }
    });
  });
}

// ── Helpers ───────────────────────────────────────────────────────

async function screenshotPage(
  context: BrowserContext,
  url: string,
  name: string,
  waitMs = 3_000,
): Promise<string | null> {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(waitMs);
    const filePath = path.join(SCREENSHOT_DIR, `wallet-${name}-2560x1440.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`   ✓ ${name} screenshot saved`);
    return filePath;
  } catch (err) {
    console.error(`   ✗ ${name} failed:`, (err as Error).message);
    return null;
  } finally {
    await page.close();
  }
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("=== Phase 1b: Smoke Test with Eve Vault Extension ===\n");
  console.log(`Target resolution: ${WIDTH}×${HEIGHT}`);
  console.log(`Eve Vault path:    ${EVE_VAULT_PATH}`);
  console.log(`Output dir:        ${SCREENSHOT_DIR}\n`);

  // Verify extension exists
  const manifestPath = path.join(EVE_VAULT_PATH, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error(`✗ manifest.json not found at ${manifestPath}`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  console.log(`Extension:         ${manifest.name} v${manifest.version}\n`);

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // 1. Start dev server
  console.log("1. Starting Vite dev server...");
  let devServer: ChildProcess | undefined;
  try {
    devServer = await startDevServer();
    console.log(`   ✓ Dev server running on ${BASE_URL}\n`);
  } catch (err) {
    console.error("   ✗ Failed to start dev server:", (err as Error).message);
    process.exit(1);
  }

  // 2. Launch headed Chromium with Eve Vault extension
  console.log("2. Launching headed Chromium with Eve Vault extension...");

  // Use a temp user data dir for persistent context (extension loading requires it)
  const userDataDir = path.join(os.tmpdir(), `pw-eve-vault-${Date.now()}`);
  let context: BrowserContext | undefined;

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

    console.log("   ✓ Browser launched with Eve Vault extension\n");
  } catch (err) {
    console.error("   ✗ Failed to launch browser:", (err as Error).message);
    devServer?.kill();
    process.exit(1);
  }

  // 3. Navigate to dashboard — give extension time to initialize
  console.log("3. Navigating to dashboard (/) — waiting for extension init...");
  const dashPage = await context.newPage();
  try {
    await dashPage.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
    // Give the Eve Vault extension extra time to inject its provider
    console.log("   Waiting 8s for extension to inject wallet provider...");
    await dashPage.waitForTimeout(8_000);

    // Check for wallet-related UI state
    const connectBtn = dashPage.locator("text=/connect.*wallet/i").first();
    const connectBtnVisible = await connectBtn.isVisible().catch(() => false);

    // Check if wallet auto-connected (look for absence of connect button or presence of address)
    const hasAddress = await dashPage.locator("[class*='address'], [class*='truncat']").first().isVisible().catch(() => false);

    console.log(`   Connect Wallet button visible: ${connectBtnVisible}`);
    console.log(`   Address / connected indicator:  ${hasAddress}`);

    // If the Connect Wallet button is visible, try clicking it
    if (connectBtnVisible) {
      console.log("   → Clicking Connect Wallet button...");
      await connectBtn.click();
      await dashPage.waitForTimeout(5_000);

      // Check if a wallet selection modal appeared
      const vaultOptionVisible = await dashPage.locator("text=/vault/i, text=/eve/i").first().isVisible().catch(() => false);
      console.log(`   Wallet-selection modal / Vault option visible: ${vaultOptionVisible}`);

      if (vaultOptionVisible) {
        // Try to select the Eve Vault option
        const vaultBtn = dashPage.locator("text=/vault/i, text=/eve/i").first();
        await vaultBtn.click().catch(() => {});
        await dashPage.waitForTimeout(5_000);
      }
    }

    // Screenshot whatever state we're in now
    const dashPath = path.join(SCREENSHOT_DIR, "wallet-dashboard-2560x1440.png");
    await dashPage.screenshot({ path: dashPath, fullPage: false });
    console.log(`   ✓ Dashboard screenshot saved → ${dashPath}`);

    // Check for topology map rendering
    const hasTopology = await dashPage.locator("svg").first().isVisible().catch(() => false);
    const topologyEmpty = await dashPage.locator("text=/connect.*wallet.*to.*view/i").first().isVisible().catch(() => false);
    const hasMetrics = await dashPage.locator("text=/Gross Network/i, text=/Active Structures/i").first().isVisible().catch(() => false);

    console.log(`   SVG (topology) visible:         ${hasTopology}`);
    console.log(`   Topology empty-state message:    ${topologyEmpty}`);
    console.log(`   Metrics banner visible:          ${hasMetrics}`);
    console.log("");
  } catch (err) {
    console.error("   ✗ Dashboard load failed:", (err as Error).message);
  }
  await dashPage.close();

  // 4. Gates page
  console.log("4. Navigating to gates (/gates)...");
  await screenshotPage(context, `${BASE_URL}/gates`, "gates", 4_000);
  console.log("");

  // 5. Activity feed
  console.log("5. Navigating to activity feed (/activity)...");
  await screenshotPage(context, `${BASE_URL}/activity`, "activity", 3_000);
  console.log("");

  // 6. TradePosts page
  console.log("6. Navigating to trade posts (/tradeposts)...");
  await screenshotPage(context, `${BASE_URL}/tradeposts`, "tradeposts", 4_000);
  console.log("");

  // 7. Turrets page
  console.log("7. Navigating to turrets (/turrets)...");
  await screenshotPage(context, `${BASE_URL}/turrets`, "turrets", 4_000);
  console.log("");

  // 8. Come back to dashboard for a final screenshot after pages warmed up
  console.log("8. Final dashboard pass (post-warmup)...");
  const finalPage = await context.newPage();
  try {
    await finalPage.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15_000 });
    await finalPage.waitForTimeout(5_000);

    const finalPath = path.join(SCREENSHOT_DIR, "wallet-dashboard-final-2560x1440.png");
    await finalPage.screenshot({ path: finalPath, fullPage: false });
    console.log(`   ✓ Final dashboard screenshot saved → ${finalPath}`);

    // Comprehensive check of what rendered
    const checks = {
      "Nav sidebar": "nav, [class*='sidebar'], [class*='Shell']",
      "SVG elements": "svg",
      "Topology empty msg": "text=/connect.*wallet.*to.*view/i",
      "Active Structures card": "text=/Active Structures/i",
      "Grid Status card": "text=/Grid Status/i",
      "Signal Feed rows": "text=/Toll Collected|Transit Authorized|Posture Set/i",
      "Posture buttons": "text=/Commercial|Defensive/i",
    };

    console.log("\n   Element visibility check:");
    for (const [label, selector] of Object.entries(checks)) {
      const visible = await finalPage.locator(selector).first().isVisible().catch(() => false);
      console.log(`     ${visible ? "✓" : "✗"} ${label}`);
    }
  } catch (err) {
    console.error("   ✗ Final dashboard pass failed:", (err as Error).message);
  }
  await finalPage.close();

  // 9. Summary
  console.log("\n=== Wallet Extension Smoke Test Summary ===\n");
  console.log(`Resolution:      ${WIDTH}×${HEIGHT}`);
  console.log(`Browser:         Headed Chromium (Playwright)`);
  console.log(`Extension:       ${manifest.name} v${manifest.version}`);
  console.log(`Extension load:  launchPersistentContext + --load-extension`);
  console.log("");
  console.log("Review screenshots in recordings/screenshots/ (wallet-*.png)");
  console.log("Compare with non-wallet screenshots (smoke-*.png) to assess difference.\n");

  // Cleanup
  await context?.close();
  devServer?.kill();

  // Try to clean up the temp user data dir
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {
    // May fail if browser process hasn't fully exited; non-fatal
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

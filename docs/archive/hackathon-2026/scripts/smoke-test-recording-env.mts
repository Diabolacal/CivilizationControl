/**
 * Phase 1 — Recording-environment smoke test
 *
 * Goals:
 *  1. Launch Vite dev server
 *  2. Open headed Chromium at 2560×1440 via Playwright
 *  3. Screenshot the dashboard (wallet-dependent operator screen)
 *  4. Screenshot a player-facing route (no wallet needed)
 *  5. Report viability findings
 */

import { chromium, type Browser, type BrowserContext } from "playwright";
import { spawn, type ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.resolve(__dirname, "..");
const SCREENSHOT_DIR = path.join(PROJECT_DIR, "recordings", "screenshots");
const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

const WIDTH = 2560;
const HEIGHT = 1440;

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
          // Give Vite a moment to stabilize
          setTimeout(() => resolve(proc), 1_500);
        }
      }
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      // Vite prints some info to stderr; only reject on fatal
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

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("=== Phase 1: Recording-Environment Smoke Test ===\n");
  console.log(`Target resolution: ${WIDTH}×${HEIGHT}`);
  console.log(`Output dir: ${SCREENSHOT_DIR}\n`);

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

  // 2. Launch headed Chromium
  console.log("2. Launching headed Chromium at 2560×1440...");
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    browser = await chromium.launch({
      headless: false,
      args: [
        `--window-size=${WIDTH},${HEIGHT}`,
        "--disable-extensions",
        "--disable-gpu",
      ],
    });

    context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      colorScheme: "dark",
    });

    console.log("   ✓ Browser launched (headed, dark color scheme)\n");
  } catch (err) {
    console.error("   ✗ Failed to launch browser:", (err as Error).message);
    devServer?.kill();
    process.exit(1);
  }

  const page = await context.newPage();

  // 3. Navigate to dashboard (operator screen — wallet-dependent)
  console.log("3. Navigating to dashboard (/)...");
  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
    // Wait for the app to render
    await page.waitForTimeout(3_000);

    const dashboardPath = path.join(SCREENSHOT_DIR, "smoke-dashboard-2560x1440.png");
    await page.screenshot({ path: dashboardPath, fullPage: false });
    console.log(`   ✓ Dashboard screenshot saved`);
    console.log(`     ${dashboardPath}\n`);

    // Check viewport size
    const viewportSize = page.viewportSize();
    console.log(`   Viewport: ${viewportSize?.width}×${viewportSize?.height}`);

    // Check what rendered (look for key elements)
    const hasTopology = await page.locator("[class*='topology'], [class*='StrategicMap'], svg").first().isVisible().catch(() => false);
    const hasNavSidebar = await page.locator("nav, [class*='sidebar'], [class*='Shell']").first().isVisible().catch(() => false);
    const hasWalletPrompt = await page.locator("text=/connect.*wallet/i, text=/vault/i").first().isVisible().catch(() => false);
    const hasMetrics = await page.locator("[class*='metric'], [class*='MetricCard']").first().isVisible().catch(() => false);

    console.log(`   NavSidebar visible: ${hasNavSidebar}`);
    console.log(`   Topology/Map visible: ${hasTopology}`);
    console.log(`   Metrics visible: ${hasMetrics}`);
    console.log(`   Wallet prompt visible: ${hasWalletPrompt}`);
    console.log("");
  } catch (err) {
    console.error("   ✗ Dashboard load failed:", (err as Error).message);
  }

  // 4. Navigate to a known gate detail page (may show empty without wallet)
  console.log("4. Navigating to gate detail (/gates)...");
  try {
    await page.goto(`${BASE_URL}/gates`, { waitUntil: "networkidle", timeout: 15_000 });
    await page.waitForTimeout(2_000);

    const gatesPath = path.join(SCREENSHOT_DIR, "smoke-gates-2560x1440.png");
    await page.screenshot({ path: gatesPath, fullPage: false });
    console.log(`   ✓ Gates page screenshot saved`);
    console.log(`     ${gatesPath}\n`);
  } catch (err) {
    console.error("   ✗ Gates page failed:", (err as Error).message);
  }

  // 5. Navigate to activity feed
  console.log("5. Navigating to activity feed (/activity)...");
  try {
    await page.goto(`${BASE_URL}/activity`, { waitUntil: "networkidle", timeout: 15_000 });
    await page.waitForTimeout(2_000);

    const activityPath = path.join(SCREENSHOT_DIR, "smoke-activity-2560x1440.png");
    await page.screenshot({ path: activityPath, fullPage: false });
    console.log(`   ✓ Activity page screenshot saved`);
    console.log(`     ${activityPath}\n`);
  } catch (err) {
    console.error("   ✗ Activity page failed:", (err as Error).message);
  }

  // 6. Test video recording capability (2s clip)
  console.log("6. Testing video recording capability...");
  try {
    const videoContext = await browser!.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      colorScheme: "dark",
      recordVideo: {
        dir: SCREENSHOT_DIR,
        size: { width: WIDTH, height: HEIGHT },
      },
    });

    const videoPage = await videoContext.newPage();
    await videoPage.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15_000 });
    await videoPage.waitForTimeout(3_000);
    await videoPage.close();

    const videoPath = await videoPage.video()?.path();
    if (videoPath) {
      const targetPath = path.join(SCREENSHOT_DIR, "smoke-recording-2560x1440.webm");
      // Video is saved after page closes, wait a bit
      await new Promise((r) => setTimeout(r, 2_000));
      if (fs.existsSync(videoPath)) {
        fs.renameSync(videoPath, targetPath);
        const stats = fs.statSync(targetPath);
        console.log(`   ✓ Video recording works!`);
        console.log(`     ${targetPath} (${(stats.size / 1024).toFixed(0)} KB)\n`);
      } else {
        console.log(`   ⚠ Video file not found at expected path: ${videoPath}\n`);
      }
    }

    await videoContext.close();
  } catch (err) {
    console.error("   ✗ Video recording failed:", (err as Error).message, "\n");
  }

  // 7. Summary
  console.log("=== Smoke Test Summary ===\n");
  console.log(`Resolution:      ${WIDTH}×${HEIGHT} — ✓ confirmed`);
  console.log(`Browser:         Headed Chromium (Playwright)`);
  console.log(`Dev server:      Vite on port ${PORT}`);
  console.log(`Color scheme:    Dark`);
  console.log("");
  console.log("Wallet/Eve Vault: NOT loaded (--disable-extensions)");
  console.log("  → Operator screens render in empty/disconnected state");
  console.log("  → To test with Eve Vault, re-run with extension path");
  console.log("  → Fallback: thin data injection at hook level");
  console.log("");
  console.log("Screenshots saved to: recordings/screenshots/");
  console.log("Check them to verify layout renders correctly at 1440p.\n");

  // Cleanup
  await context?.close();
  await browser?.close();
  devServer?.kill();

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

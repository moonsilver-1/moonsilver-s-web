import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Find playwright-core from npx cache
import { execSync } from "child_process";
import path from "path";
import os from "os";

const home = os.homedir();
const npmCache = execSync("npm config get cache", { encoding: "utf8" }).trim();

// Try to find playwright in npx cache
let pwPath = null;
const { readdirSync, existsSync } = await import("fs");

// Check common npx locations
const npxDir = path.join(npmCache, "_npx");
if (existsSync(npxDir)) {
  const dirs = readdirSync(npxDir);
  for (const d of dirs) {
    const candidate = path.join(npxDir, d, "node_modules", "playwright");
    if (existsSync(candidate)) {
      pwPath = candidate;
      break;
    }
    const candidate2 = path.join(npxDir, d, "node_modules", "playwright-core");
    if (existsSync(candidate2)) {
      pwPath = candidate2;
      break;
    }
  }
}

if (!pwPath) {
  console.error("Cannot find playwright package");
  process.exit(1);
}

console.log("Found playwright at:", pwPath);
const { chromium } = await import("file://" + pwPath + "/index.mjs");

const browser = await chromium.launch({
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// 1. Navigate to mahjong lobby
await page.goto("http://localhost:3456/fun/mahjong", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: "test-01-lobby.png" });
console.log("1. Lobby loaded");

// 2. Click local game
await page.click('button:has-text("单机对局")');
await page.waitForTimeout(500);
await page.screenshot({ path: "test-02-local-config.png" });
console.log("2. Local config shown");

// 3. Start game
await page.click('button:has-text("开始对局")');
await page.waitForTimeout(2000);
await page.screenshot({ path: "test-03-game-started.png" });
console.log("3. Game started");

// 4. Check tile counts
const hudTexts = await page.locator(".mahjong-hud-tiles").allTextContents();
console.log("4. Tile counts visible:", hudTexts);

const hudNames = await page.locator(".mahjong-hud-name").allTextContents();
console.log("   Player names:", hudNames);

// 5. Select and discard a tile
const tileWraps = await page.locator(".mahjong-tile-wrap").all();
if (tileWraps.length > 0) {
  await tileWraps[0].click();
  await page.waitForTimeout(300);

  const discardBtn = page.locator('.mahjong-ab:has-text("出牌")');
  if (await discardBtn.isVisible()) {
    await discardBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-04-after-discard.png" });
    console.log("5. Discarded tile");
  }
}

// 6. Play several rounds
for (let round = 0; round < 8; round++) {
  await page.waitForTimeout(1500);
  const discardBtn = page.locator('.mahjong-ab:has-text("出牌")');
  if (await discardBtn.isVisible()) {
    const tileWraps = await page.locator(".mahjong-tile-wrap").all();
    if (tileWraps.length > 0) {
      await tileWraps[Math.min(2, tileWraps.length - 1)].click();
      await page.waitForTimeout(200);
      await discardBtn.click();
    }
  }
}

await page.waitForTimeout(1500);
await page.screenshot({ path: "test-05-after-rounds.png" });
const hudTexts2 = await page.locator(".mahjong-hud-tiles").allTextContents();
console.log("6. Tile counts after plays:", hudTexts2);

// Check for peng/chi/hu buttons that appeared
const allBtns = await page.locator(".mahjong-ab").allTextContents();
console.log("   Current action buttons:", allBtns);

console.log("\nDone! Screenshots saved.");
await browser.close();

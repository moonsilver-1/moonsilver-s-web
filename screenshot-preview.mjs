import { chromium } from "@playwright/test";

const pages = [
  { name: "contest-page", url: "http://localhost:3000/contest" },
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  for (const { name, url } of pages) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `preview-${name}.png`, fullPage: false });
    console.log(`Screenshot: preview-${name}.png`);
  }

  await browser.close();
})();

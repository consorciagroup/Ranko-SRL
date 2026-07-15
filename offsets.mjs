import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox"], executablePath: "/home/estu/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const [url, sel] of [
  ["/trabajos-cerrados", "div.sticky.top-8"],
  ["/rutas", "div.sticky.top-8"],
  ["/catalogo", "div.sticky.top-8"],
  ["/direcciones", "div.sticky.top-8"],
]) {
  await page.goto(`http://localhost:3000${url}`, { waitUntil: "networkidle" });
  const top = await page.evaluate((s) => document.querySelector(s)?.getBoundingClientRect().top, sel);
  console.log(url, "top offset:", top);
}
await browser.close();

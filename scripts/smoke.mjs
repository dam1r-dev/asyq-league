import { chromium } from "playwright";
const SP = process.env.SP ?? ".";
const base = process.env.BASE_URL ?? "http://localhost:3100";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" }).catch(async () => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
for (const [name, path] of [["home", "/"], ["levels", "/levels"], ["rules", "/rules"]]) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${SP}/${name}.png`, fullPage: name !== "home" ? false : true });
}
await page.goto(base + "/play/l1", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: `${SP}/play0.png` });
// Aim: drag down from canvas center
const box = await page.locator("canvas").boundingBox();
const x = box.x + box.width / 2, y = box.y + box.height * 0.6;
await page.mouse.move(x, y); await page.mouse.down();
await page.mouse.move(x - 2, y + 120, { steps: 8 });
await page.screenshot({ path: `${SP}/aim.png` });
await page.mouse.up();
await page.waitForTimeout(250);
await page.screenshot({ path: `${SP}/fly.png` });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${SP}/after.png` });
console.log("errors:", errors);
await browser.close();

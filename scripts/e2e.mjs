// Сквозная проверка в браузере: регистрация → раунд → сохранение на сервере.
// Запуск: BASE_URL=http://localhost:3100 node scripts/e2e.mjs
import { chromium } from "playwright";
const base = process.env.BASE_URL ?? "http://localhost:3100";
const SP = process.env.SP ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? undefined });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
await ctx.addCookies([{ name: "lang", value: "ru", url: base }]);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

const user = "e2e" + Date.now().toString(36);
await page.goto(base + "/auth");
await page.getByRole("button", { name: "Регистрация" }).click();
await page.getByLabel("Логин").fill(user);
await page.getByLabel("Пароль").fill("secret123");
await page.getByLabel("Имя в рейтинге").fill("E2E Тест");
await page.getByLabel("Университет (для лиги)").selectOption("Narxoz");
await page.getByRole("button", { name: "Создать аккаунт" }).click();
await page.waitForURL("**/profile");
console.log("registered", user);

await page.goto(base + "/play/l1");
await page.waitForTimeout(700);
const targets = [{ x: 200, y: 250 }, { x: 176, y: 250 }, { x: 224, y: 250 }, { x: 200, y: 250 }, { x: 180, y: 250 }];
for (const t of targets) {
  if (await page.getByRole("dialog").count()) break;
  const box = await page.locator("canvas").boundingBox();
  const k = box.width / 400;
  const sx = 200, sy = 560 + 19;
  const dx = t.x - sx, dy = t.y - sy, len = Math.hypot(dx, dy);
  const px = box.x + sx * k, py = box.y + sy * k;
  const pull = 160 * k; // полная сила
  await page.mouse.move(px, py);
  await page.mouse.down();
  await page.mouse.move(px - (dx / len) * pull, py - (dy / len) * pull, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(7000);
}
await page.getByRole("dialog").waitFor({ timeout: 15000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${SP}/e2e-result.png` });
const text = await page.getByRole("dialog").innerText();
console.log(text.replace(/\n+/g, " | "));
await page.goto(base + "/profile");
await page.waitForTimeout(1500);
await page.screenshot({ path: `${SP}/e2e-profile.png`, fullPage: true });
console.log("errors:", errors);
await browser.close();

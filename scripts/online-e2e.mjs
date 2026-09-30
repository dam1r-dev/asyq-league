// Проверка онлайн-дуэли: два независимых браузера играют матч по ссылке.
// Запуск: BASE_URL=http://localhost:3100 node scripts/online-e2e.mjs
import { chromium } from "playwright";
const base = process.env.BASE_URL ?? "http://localhost:3100";
const SP = process.env.SP ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? undefined });
const mk = async (name) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.addCookies([{ name: "lang", value: "ru", url: base }]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(name, "PAGEERROR", e.message));
  page.on("dialog", (d) => d.accept());
  return page;
};
const host = await mk("host");
const guest = await mk("guest");

await host.goto(base + "/duel");
await host.getByRole("tab", { name: /Онлайн/ }).click();
await host.getByPlaceholder("Игрок 1").fill("Аян");
await host.getByRole("button", { name: /Создать матч/ }).click();
await host.waitForURL("**/m/**");
const link = (await host.locator(".break-all").innerText()).trim();
console.log("link:", link);

await guest.goto(link);
await guest.getByPlaceholder("Игрок 2").fill("Дана");
await guest.getByRole("button", { name: "Войти" }).click();
await host.getByText("Твой ход").waitFor({ timeout: 15000 });
console.log("match started");

const scores = async (p) => (await p.locator("aside .font-display.text-xl").allInnerTexts()).map(Number);
const myTurn = async (p) => (await p.getByText("Твой ход").count()) > 0;

let throws = 0;
for (let i = 0; i < 8; i++) {
  const p = (await myTurn(host)) ? host : (await myTurn(guest)) ? guest : null;
  if (!p) { await host.waitForTimeout(1500); continue; }
  const who = p === host ? "host" : "guest";
  const box = await p.locator("canvas").boundingBox();
  const sx = box.x + box.width * (0.35 + 0.3 * ((i * 37) % 10) / 10);
  const sy = box.y + box.height * 0.62;
  await p.mouse.move(sx, sy); await p.mouse.down();
  await p.mouse.move(sx + (i % 3 - 1) * 8, sy + 135, { steps: 6 }); await p.mouse.up();
  throws++;
  if (i === 0) { await (p === host ? guest : host).waitForTimeout(700); await (p === host ? guest : host).screenshot({ path: `${SP}/online-midflight.png` }); }
  await host.waitForTimeout(7500);
  const [a, b] = [await scores(host), await scores(guest)];
  console.log(`throw ${throws} by ${who}: host sees ${a}, guest sees ${b}`, JSON.stringify(a) === JSON.stringify(b) ? "SYNC OK" : "MISMATCH");
}
await host.screenshot({ path: `${SP}/online-host.png` });
await guest.screenshot({ path: `${SP}/online-guest.png` });

// Сдача: у соперника появляется победа
await host.getByRole("button", { name: /Сдаться/ }).click();
await guest.getByText("Ты победил!").waitFor({ timeout: 10000 });
await host.getByText("Ты проиграл").waitFor({ timeout: 10000 });
console.log("resign flow OK");
await guest.screenshot({ path: `${SP}/online-result.png` });
await browser.close();

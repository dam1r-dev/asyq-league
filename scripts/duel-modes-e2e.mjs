// Проверка режимов дуэли: своё поле из редактора + «Пятёрки» (строгая очередность).
// Запуск: BASE_URL=http://localhost:3100 node scripts/duel-modes-e2e.mjs
import { chromium } from "playwright";
const base = process.env.BASE_URL ?? "http://localhost:3100";
const SP = process.env.SP ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? undefined });
const mk = async (name) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.addCookies([{ name: "lang", value: "ru", url: base }]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(name, "PAGEERROR", e.message));
  page.on("console", (m) => m.type() === "error" && console.log(name, "CONSOLE", m.text()));
  page.on("dialog", (d) => d.accept());
  return page;
};
const host = await mk("host");
const guest = await mk("guest");

// Редактор → «В дуэль»
await host.goto(base + "/editor");
const box0 = await host.locator("canvas").boundingBox();
await host.mouse.click(box0.x + box0.width * 0.5, box0.y + box0.height * 0.2); // лишний асык (может не встать — ок)
await host.getByRole("button", { name: /В дуэль/ }).click();
await host.waitForURL("**/duel");
await host.getByText(/Своё поле · асыков: \d+/).waitFor();
console.log("round 1 custom:", await host.getByText(/Своё поле · асыков: \d+/).innerText());
await host.getByRole("button", { name: /Стандартный раунд/ }).click();
await host.getByRole("radio", { name: "2", exact: true }).click(); // 2 броска за ход
await host.getByRole("radio", { name: /Пятёрки/ }).click();
await host.getByRole("tab", { name: /Онлайн/ }).click();
await host.getByPlaceholder("Игрок 1").fill("Аян");
await host.getByRole("button", { name: /Создать матч/ }).click();
await host.waitForURL("**/m/**");
const link = (await host.locator(".break-all").innerText()).trim();
await guest.goto(link);
await guest.getByText(/Пятёрки/).waitFor();
console.log("guest sees mode:", await guest.getByText(/Пятёрки · /).innerText());
await guest.getByPlaceholder("Игрок 2").fill("Дана");
await guest.getByRole("button", { name: "Войти" }).click();
await host.getByText("Твой ход").waitFor({ timeout: 15000 });

const myTurn = async (p) => (await p.getByText("Твой ход").count()) > 0;
const seq = [];
for (let i = 0; i < 12; i++) {
  let p = null;
  for (let k = 0; k < 20 && !p; k++) {
    p = (await myTurn(host)) ? host : (await myTurn(guest)) ? guest : null;
    if (!p) await host.waitForTimeout(500);
  }
  if (!p) { console.log("NO TURN at throw", i + 1); break; }
  seq.push(p === host ? "H" : "G");
  const box = await p.locator("canvas").boundingBox();
  const sx = box.x + box.width * 0.5;
  const sy = box.y + box.height * 0.62;
  await p.mouse.move(sx, sy); await p.mouse.down();
  await p.mouse.move(sx, sy + 135, { steps: 6 }); await p.mouse.up();
  await host.waitForTimeout(5500);
}
console.log("turn order:", seq.join(" "));
const expected = "H H G G H H G G H G G G".split(" ").join(" ");
console.log(seq.join(" ") === expected ? "ORDER OK (2 per turn, round 2 starts with guest)" : "ORDER DIFFERS, expected " + expected);
console.log("banner:", await host.getByText(/Раунд \d из 2/).first().innerText().catch(() => "none"));
await host.screenshot({ path: `${SP}/duel-five-host.png` });
await host.getByRole("button", { name: /Сдаться/ }).click();
await guest.getByText("Ты победил!").waitFor({ timeout: 10000 });
console.log("done");
await browser.close();

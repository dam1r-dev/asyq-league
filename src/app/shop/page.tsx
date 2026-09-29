"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import ItemPreview from "@/components/ItemPreview";
import { CATALOG, type ShopItem } from "@/lib/catalog";

const SECTIONS: { kind: ShopItem["kind"]; title: string; text: string }[] = [
  { kind: "saqa", title: "Сақа", text: "Цвет твоей битки. Вес и физика у всех одинаковые." },
  { kind: "field", title: "Площадки", text: "Где проходит игра: двор, ауыл, степь или войлочный киіз." },
  { kind: "pack", title: "Наборы испытаний", text: "Новые расстановки. Не входят в рейтинг и не дают преимущества." },
];

export default function ShopPage() {
  const { me, owns, equip, saqaSkin, fieldSkin } = useAccount();
  const [buying, setBuying] = useState<ShopItem | null>(null);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-6 pb-16">
      <h1 className="font-display text-2xl font-bold">Магазин</h1>
      <div className="card mt-4 border-sky/40 bg-sky/5 p-4 text-sm leading-relaxed">
        <b className="text-sky">Тестовый режим оплаты.</b> Реальные деньги не списываются — используется тестовая карта{" "}
        <code>4242 4242 4242 4242</code>, а покупка по-настоящему открывает предмет в профиле. Мы продаём только
        внешний вид и дополнительные испытания: <b>ничего из магазина не влияет на физику, очки и рейтинг.</b>
      </div>

      {SECTIONS.map((s) => (
        <section key={s.kind} className="mt-8">
          <h2 className="font-display text-lg font-bold">{s.title}</h2>
          <p className="text-sm text-muted">{s.text}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CATALOG.filter((i) => i.kind === s.kind).map((item) => {
              const owned = owns(item.id);
              const equipped = item.id === saqaSkin || item.id === fieldSkin;
              return (
                <div key={item.id} className={`card flex flex-col gap-2 p-2.5 ${equipped ? "border-gold/60" : ""}`}>
                  <ItemPreview item={item} fieldSkin={fieldSkin} />
                  <div className="px-0.5">
                    <div className="font-display text-sm font-bold">{item.name}</div>
                    <div className="mt-0.5 text-xs leading-snug text-muted">{item.description}</div>
                  </div>
                  <div className="mt-auto">
                    {item.kind === "pack" ? (
                      owned ? (
                        <Link href="/levels" className="btn btn-ghost w-full !py-2 text-sm">
                          Открыт · играть
                        </Link>
                      ) : (
                        <BuyButton item={item} me={!!me} onBuy={() => setBuying(item)} />
                      )
                    ) : equipped ? (
                      <div className="btn btn-ghost w-full !py-2 text-sm text-gold">✓ Надето</div>
                    ) : owned ? (
                      <button className="btn btn-ghost w-full !py-2 text-sm" onClick={() => equip(item.id, item.kind as "saqa" | "field")}>
                        Надеть
                      </button>
                    ) : (
                      <BuyButton item={item} me={!!me} onBuy={() => setBuying(item)} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="card mt-10 p-5">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-bold">Для организаторов</h2>
          <span className="chip">в планах</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Турнирный пакет для студсоветов, клубов и школ: приватная лига со своими расстановками, расписанием и
          таблицей — платит организатор, а игроки участвуют бесплатно. Подробнее — в README проекта.
        </p>
      </section>

      {buying && <TestPayment item={buying} onClose={() => setBuying(null)} />}
    </div>
  );
}

function BuyButton({ item, me, onBuy }: { item: ShopItem; me: boolean; onBuy: () => void }) {
  if (!me)
    return (
      <Link href="/auth" className="btn btn-ghost w-full !py-2 text-xs">
        Войти, чтобы купить
      </Link>
    );
  return (
    <button className="btn btn-primary w-full !py-2 text-sm" onClick={onBuy}>
      {item.priceKzt} ₸
    </button>
  );
}

function TestPayment({ item, onClose }: { item: ShopItem; onClose: () => void }) {
  const { refresh } = useAccount();
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [state, setState] = useState<"form" | "paying" | "done">("form");
  const [error, setError] = useState<string | null>(null);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("paying");
    setError(null);
    // Небольшая пауза, чтобы было видно «обработку платежа».
    await new Promise((r) => setTimeout(r, 900));
    const res = await fetch("/api/shop/purchase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId: item.id, card }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Ошибка оплаты");
      setState("form");
      return;
    }
    await refresh();
    setState("done");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="pop-in card w-full max-w-[380px] p-5" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {state === "done" ? (
          <div className="text-center">
            <div className="text-5xl">✅</div>
            <h2 className="mt-3 font-display text-xl font-bold">Готово!</h2>
            <p className="mt-2 text-sm text-muted">
              «{item.name}» теперь твой{item.kind === "pack" ? " — новые испытания открыты." : " и уже надет."} Это была
              тестовая оплата — деньги не списаны.
            </p>
            <div className="mt-5 grid gap-2">
              <Link href={item.kind === "pack" ? "/play/p1" : "/levels"} className="btn btn-primary">
                {item.kind === "pack" ? "Играть «Қорған»" : "Попробовать в игре"}
              </Link>
              <button className="btn btn-ghost" onClick={onClose}>
                Закрыть
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={pay}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Оплата</h2>
              <span className="chip !border-sky/40 !text-sky">ТЕСТ</span>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm">
              <span>{item.name}</span>
              <b>{item.priceKzt} ₸</b>
            </div>
            <label className="mt-4 grid gap-1 text-sm">
              <span className="text-muted">Номер карты</span>
              <input className="input font-mono" inputMode="numeric" value={card} onChange={(e) => setCard(e.target.value)} />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <label className="grid gap-1">
                <span className="text-muted">Срок</span>
                <input className="input font-mono" defaultValue="12/30" />
              </label>
              <label className="grid gap-1">
                <span className="text-muted">CVC</span>
                <input className="input font-mono" defaultValue="123" />
              </label>
            </div>
            {error && <p className="mt-3 text-sm text-bad">{error}</p>}
            <p className="mt-3 text-xs text-muted">Тестовый режим: реальные деньги не списываются. Работает только карта 4242 4242 4242 4242.</p>
            <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Отмена
              </button>
              <button className="btn btn-primary" disabled={state === "paying"}>
                {state === "paying" ? "Обработка…" : `Оплатить ${item.priceKzt} ₸`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import ItemPreview from "@/components/ItemPreview";
import Avatar from "@/avatar/Avatar";
import type { AvatarConfig } from "@/avatar/config";
import { CATALOG, type ShopItem } from "@/lib/catalog";
import { useT } from "@/i18n/provider";
import { errorText } from "@/i18n/game";

const SECTIONS: { kind: ShopItem["kind"]; title: string; text: string }[] = [
  { kind: "outfit", title: "shop.outfit", text: "shop.outfitText" },
  { kind: "hat", title: "shop.hat", text: "shop.hatText" },
  { kind: "saqa", title: "shop.saqa", text: "shop.saqaText" },
  { kind: "field", title: "shop.field", text: "shop.fieldText" },
  { kind: "color", title: "shop.colors", text: "shop.colorsText" },
  { kind: "pack", title: "shop.pack", text: "shop.packText" },
];

export default function ShopPage() {
  const { me, owns, equip, saqaSkin, fieldSkin, avatar, coins, refresh, toast } = useAccount();
  const t = useT();
  const [busy, setBusy] = useState<string | null>(null);
  const [topup, setTopup] = useState<ShopItem | null>(null);

  const buy = async (item: ShopItem) => {
    setBusy(item.id);
    try {
      const res = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast(errorText(data.error, t, t("shop.payError")));
      await refresh();
      toast(`${t("shop.bought")} ${t("shop.boughtText", { name: displayName(item, t) })}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-6 pb-16">
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">{t("shop.title")}</h1>
        {me && <div className="chip !border-gold/50 !text-base !text-text">🪙 {coins}</div>}
      </div>

      <div className="card mt-4 grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <div className="font-display font-bold">{t("coins.earnTitle")}</div>
          <ul className="mt-2 grid gap-1 text-sm text-muted">
            <li>{t("coins.earn1")}</li>
            <li>{t("coins.earn2")}</li>
            <li>{t("coins.earn3")}</li>
            <li>{t("coins.earn4")}</li>
          </ul>
        </div>
        <div className="flex gap-2 sm:flex-col">
          <Link href="/daily" className="btn btn-primary !py-2 text-sm">
            ☀️ {t("leaderboard.dailyCard")}
          </Link>
          <Link href="/avatar" className="btn btn-ghost !py-2 text-sm">
            {t("avatar.edit")}
          </Link>
        </div>
      </div>

      <div className="card mt-3 border-sky/40 bg-sky/5 p-4 text-sm leading-relaxed">
        <b className="text-sky">{t("shop.testBanner1")}</b> {t("shop.testBanner3")}
      </div>

      {SECTIONS.map((s) => (
        <section key={s.kind} className="mt-8">
          <h2 className="font-display text-lg font-bold">{t(s.title)}</h2>
          <p className="text-sm text-muted">{t(s.text)}</p>
          <div className={`mt-3 grid gap-3 ${s.kind === "color" ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`}>
            {CATALOG.filter((i) => i.kind === s.kind && i.id !== "hat-none").map((item) => {
              const owned = owns(item.id);
              const equipped = item.id === saqaSkin || item.id === fieldSkin;
              const isAvatarPart = item.kind === "outfit" || item.kind === "hat" || item.kind === "color";
              const wearing = isAvatarPart && [avatar.outfit, avatar.hat, avatar.color].includes(item.id as never);
              return (
                <div key={item.id} className={`card flex flex-col gap-2 p-2.5 ${equipped || wearing ? "border-gold/60" : ""}`}>
                  {isAvatarPart ? (
                    <div className="flex h-[110px] items-center justify-center rounded-xl bg-surface-2">
                      <Avatar
                        config={withPart(avatar, item)}
                        variant={item.kind === "hat" ? "head" : "full"}
                        className={item.kind === "hat" ? "h-24 w-24" : "h-[104px] w-auto"}
                      />
                    </div>
                  ) : (
                    <ItemPreview item={item} fieldSkin={fieldSkin} />
                  )}
                  <div className="px-0.5">
                    <div className="font-display text-sm font-bold">{displayName(item, t)}</div>
                    {item.kind !== "color" && (
                      <div className="mt-0.5 text-xs leading-snug text-muted">{t(`item.${item.id}`)}</div>
                    )}
                  </div>
                  <div className="mt-auto">
                    {owned ? (
                      item.kind === "pack" ? (
                        <Link href="/levels" className="btn btn-ghost w-full !py-2 text-sm">
                          {t("shop.packOpen")}
                        </Link>
                      ) : isAvatarPart ? (
                        <Link href="/avatar" className="btn btn-ghost w-full !py-2 text-sm">
                          {wearing ? t("shop.equipped") : t("shop.wear")}
                        </Link>
                      ) : equipped ? (
                        <div className="btn btn-ghost w-full !py-2 text-sm text-gold">{t("shop.equipped")}</div>
                      ) : (
                        <button
                          className="btn btn-ghost w-full !py-2 text-sm"
                          onClick={() => equip(item.id, item.kind as "saqa" | "field")}
                        >
                          {t("shop.equip")}
                        </button>
                      )
                    ) : !me ? (
                      <Link href="/auth" className="btn btn-ghost w-full !py-2 text-xs">
                        {t("shop.loginToBuy")}
                      </Link>
                    ) : coins < item.price ? (
                      <div className="btn btn-ghost w-full !py-2 text-xs text-muted" aria-disabled>
                        {item.price} 🪙 · {t("shop.notEnough", { n: item.price - coins })}
                      </div>
                    ) : (
                      <button className="btn btn-primary w-full !py-2 text-sm" disabled={busy === item.id} onClick={() => buy(item)}>
                        {busy === item.id ? "…" : `${item.price} 🪙`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="mt-10">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-bold">{t("shop.coinsTitle")}</h2>
          <span className="chip !border-sky/40 !text-sky">{t("shop.testChip")}</span>
        </div>
        <p className="text-sm text-muted">
          {t("shop.coinsText")} {t("shop.payNote")}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {CATALOG.filter((i) => i.kind === "coins").map((item) => (
            <div key={item.id} className="card flex flex-col items-center gap-1 p-3 text-center">
              <div className="text-3xl">🪙</div>
              <div className="font-display text-lg font-bold">{item.coins}</div>
              <div className="text-xs text-muted">{t(`item.${item.id}`)}</div>
              {me ? (
                <button className="btn btn-primary mt-1 w-full !px-2 !py-2 text-sm" onClick={() => setTopup(item)}>
                  {item.priceKzt} ₸
                </button>
              ) : (
                <Link href="/auth" className="btn btn-ghost mt-1 w-full !px-2 !py-2 text-xs">
                  {t("nav.login")}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-10 p-5">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-bold">{t("shop.orgTitle")}</h2>
          <span className="chip">{t("shop.orgBadge")}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("shop.orgText")}</p>
      </section>

      {topup && <TestPayment item={topup} onClose={() => setTopup(null)} />}
    </div>
  );
}

function displayName(item: ShopItem, t: ReturnType<typeof useT>) {
  return item.kind === "color" ? t(`color.${item.id}`) : item.name;
}

function withPart(a: AvatarConfig, item: ShopItem): AvatarConfig {
  if (item.kind === "outfit") return { ...a, outfit: item.id as AvatarConfig["outfit"] };
  if (item.kind === "hat") return { ...a, hat: item.id as AvatarConfig["hat"] };
  if (item.kind === "color") return { ...a, color: item.id as AvatarConfig["color"] };
  return a;
}

/** Тестовая оплата пакета тиынов реальными деньгами (деньги не списываются). */
function TestPayment({ item, onClose }: { item: ShopItem; onClose: () => void }) {
  const { refresh } = useAccount();
  const t = useT();
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [state, setState] = useState<"form" | "paying" | "done">("form");
  const [error, setError] = useState<string | null>(null);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("paying");
    setError(null);
    // Небольшая пауза, чтобы было видно «обработку платежа».
    await new Promise((r) => setTimeout(r, 900));
    const res = await fetch("/api/shop/topup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId: item.id, card }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(errorText(data.error, t, t("shop.payError")));
      setState("form");
      return;
    }
    await refresh();
    setState("done");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-3 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="pop-in card w-full max-w-[380px] p-5" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {state === "done" ? (
          <div className="text-center">
            <div className="text-5xl">🪙</div>
            <h2 className="mt-3 font-display text-xl font-bold">{t("shop.doneTitle")}</h2>
            <p className="mt-2 text-sm text-muted">{t("shop.coinsDone", { n: item.coins ?? 0 })}</p>
            <div className="mt-5 grid gap-2">
              <Link href="/avatar" className="btn btn-primary">
                {t("avatar.edit")}
              </Link>
              <button className="btn btn-ghost" onClick={onClose}>
                {t("common.close")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={pay}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{t("shop.payTitle")}</h2>
              <span className="chip !border-sky/40 !text-sky">{t("shop.testChip")}</span>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm">
              <span>🪙 {item.coins}</span>
              <b>{item.priceKzt} ₸</b>
            </div>
            <label className="mt-4 grid gap-1 text-sm">
              <span className="text-muted">{t("shop.card")}</span>
              <input className="input font-mono" inputMode="numeric" value={card} onChange={(e) => setCard(e.target.value)} />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <label className="grid gap-1">
                <span className="text-muted">{t("shop.expiry")}</span>
                <input className="input font-mono" defaultValue="12/30" />
              </label>
              <label className="grid gap-1">
                <span className="text-muted">CVC</span>
                <input className="input font-mono" defaultValue="123" />
              </label>
            </div>
            {error && <p className="mt-3 text-sm text-bad">{error}</p>}
            <p className="mt-3 text-xs text-muted">{t("shop.payNote")}</p>
            <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                {t("common.cancel")}
              </button>
              <button className="btn btn-primary" disabled={state === "paying"}>
                {state === "paying" ? t("shop.paying") : t("shop.pay", { price: item.priceKzt ?? 0 })}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

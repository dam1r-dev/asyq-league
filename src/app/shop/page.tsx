"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import ItemPreview from "@/components/ItemPreview";
import Avatar from "@/avatar/Avatar";
import type { AvatarConfig } from "@/avatar/config";
import { CATALOG, getItem, type ShopItem } from "@/lib/catalog";
import { LEVELS } from "@/game/levels";
import { useT } from "@/i18n/provider";
import { errorText, itemName } from "@/i18n/game";

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

      <PremiumCard busy={busy === "outfit-altyn-adam"} onBuy={() => buy(getItem("outfit-altyn-adam")!)} />

      <div className="card mt-3 border-gold/40 bg-gold/5 p-4 text-sm leading-relaxed">
        <b className="text-gold">{t("shop.freeTitle")}</b> {t("shop.freeText")}
      </div>

      {SECTIONS.map((s) => (
        <section key={s.kind} className="mt-8">
          <h2 className="font-display text-lg font-bold">{t(s.title)}</h2>
          <p className="text-sm text-muted">{t(s.text)}</p>
          <div className={`mt-3 grid gap-3 ${s.kind === "color" ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`}>
            {CATALOG.filter((i) => i.kind === s.kind && i.id !== "hat-none" && !i.requiresStars).map((item) => {
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

    </div>
  );
}

/** Витрина премиального костюма «Алтын адам»: 5000 🪙 и 56 звёзд из 84. */
function PremiumCard({ busy, onBuy }: { busy: boolean; onBuy: () => void }) {
  const { me, owns, avatar, coins } = useAccount();
  const t = useT();
  const item = getItem("outfit-altyn-adam")!;
  const need = item.requiresStars ?? 0;
  const stars = LEVELS.reduce((s, l) => s + (me?.progress[l.id]?.stars ?? 0), 0);
  const owned = owns(item.id);
  const canBuy = !!me && stars >= need && coins >= item.price;
  return (
    <section className="mt-6 overflow-hidden rounded-[22px] border-2 border-gold/70 bg-gradient-to-br from-[#3a1410] via-[#5a1d14] to-[#2a1509] p-4 text-[#fbeed2] shadow-[0_0_40px_-10px_rgba(240,191,60,0.6)]">
      <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
        <div className="flex justify-center">
          <Avatar config={{ ...avatar, outfit: "outfit-altyn-adam" }} className="h-[240px] w-auto" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#f0bf3c]">{t("shop.premiumTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed opacity-90">{t("shop.premiumText")}</p>
          <p className="mt-2 text-xs opacity-80">{t("item.outfit-altyn-adam")}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-[#f0bf3c]/60 px-2.5 py-1">🪙 {item.price}</span>
            <span className="rounded-full border border-[#f0bf3c]/60 px-2.5 py-1">{t("shop.premiumReq", { n: need })}</span>
            {me && <span className="rounded-full bg-black/25 px-2.5 py-1">{t("shop.premiumHave", { n: stars })}</span>}
          </div>
          <div className="mt-4">
            {owned ? (
              <Link href="/avatar" className="btn btn-primary">
                {t("shop.wear")}
              </Link>
            ) : !me ? (
              <Link href="/auth" className="btn btn-primary">
                {t("shop.loginToBuy")}
              </Link>
            ) : (
              <button className="btn btn-primary" disabled={!canBuy || busy} onClick={onBuy}>
                {busy
                  ? "…"
                  : stars < need
                    ? t("shop.premiumReq", { n: need })
                    : coins < item.price
                      ? t("shop.notEnough", { n: item.price - coins })
                      : `${item.price} 🪙`}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function displayName(item: ShopItem, t: ReturnType<typeof useT>) {
  return itemName(item, t);
}

function withPart(a: AvatarConfig, item: ShopItem): AvatarConfig {
  if (item.kind === "outfit") return { ...a, outfit: item.id as AvatarConfig["outfit"] };
  if (item.kind === "hat") return { ...a, hat: item.id as AvatarConfig["hat"] };
  if (item.kind === "color") return { ...a, color: item.id as AvatarConfig["color"] };
  return a;
}

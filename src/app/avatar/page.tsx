"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import Avatar from "@/avatar/Avatar";
import {
  COLOR_HEX,
  COLORS,
  EYE_COLORS,
  HAIR_COLORS,
  GENDERS,
  genderPreset,
  HAIR_STYLES,
  HATS,
  OUTFITS,
  SKIN_TONES,
  isFullSet,
  paidParts,
  type AvatarConfig,
} from "@/avatar/config";
import { getItem, isFree } from "@/lib/catalog";
import { useT } from "@/i18n/provider";
import { errorText, itemName } from "@/i18n/game";
import { LEVELS } from "@/game/levels";

export default function AvatarPage() {
  const { avatar, me, owns, coins, saveAvatar, refresh, toast } = useAccount();
  const t = useT();
  // Черновик: примерять можно всё, сохранить — только купленное.
  const [draft, setDraft] = useState<AvatarConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const a = draft ?? avatar;
  const set = (patch: Partial<AvatarConfig>) => setDraft({ ...a, ...patch });

  const missing = paidParts(a).filter((id) => !owns(id));
  const missingCost = missing.reduce((s, id) => s + (getItem(id)?.price ?? 0), 0);
  // Премиальные вещи требуют ещё и звёзд.
  const stars = LEVELS.reduce((sum, l) => sum + (me?.progress[l.id]?.stars ?? 0), 0);
  const starsNeeded = Math.max(0, ...missing.map((id) => getItem(id)?.requiresStars ?? 0));
  const starsOk = stars >= starsNeeded;
  const changed = draft !== null && JSON.stringify(draft) !== JSON.stringify(avatar);

  const save = async () => {
    setBusy(true);
    try {
      // Сначала докупаем недостающие вещи за тиыны, потом сохраняем.
      for (const id of missing) {
        const res = await fetch("/api/shop/purchase", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ itemId: id }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          toast(errorText(d.error, t, t("shop.payError")));
          return;
        }
      }
      if (missing.length) await refresh();
      if (await saveAvatar(a)) {
        setDraft(null);
        toast(t("avatar.saved"));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-6 pb-32">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("avatar.title")}</h1>
          <p className="mt-1 max-w-lg text-sm text-muted">{t("avatar.lead")}</p>
        </div>
        {me && <div className="chip shrink-0 !text-sm">🪙 {coins}</div>}
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[280px_1fr]">
        <div className="card flex items-center justify-center p-4 md:sticky md:top-20 md:self-start">
          <Avatar config={a} className="h-[300px] w-auto md:h-[400px]" title={me?.displayName} />
        </div>

        <div className="grid gap-4">
          <Section title={t("avatar.gender")}>
            <div className="grid grid-cols-2 gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  onClick={() => set(genderPreset(g))}
                  aria-pressed={a.gender === g}
                  className={`flex items-center gap-3 rounded-xl border p-2 text-left text-sm font-semibold ${
                    a.gender === g ? "border-gold bg-surface-2" : "border-line"
                  }`}
                >
                  <Avatar config={{ ...a, ...genderPreset(g), hat: "hat-none" }} variant="head" className="h-12 w-12 shrink-0" />
                  {g === "f" ? t("avatar.girl") : t("avatar.boy")}
                </button>
              ))}
            </div>
          </Section>
          <Section title={t("avatar.skin")}>
            <Swatches colors={SKIN_TONES} value={a.skin} onChange={(skin) => set({ skin })} />
          </Section>
          <Section title={t("avatar.eyes")}>
            <Swatches colors={EYE_COLORS} value={a.eyes} onChange={(eyes) => set({ eyes })} />
          </Section>
          <Section title={t("avatar.hair")}>
            <div className="grid grid-cols-4 gap-2">
              {HAIR_STYLES.map((h) => (
                <button
                  key={h}
                  onClick={() => set({ hair: h })}
                  className={`rounded-xl border p-1 text-xs font-semibold ${a.hair === h ? "border-gold bg-surface-2" : "border-line"}`}
                >
                  <Avatar config={{ ...a, hair: h, hat: "hat-none" }} variant="head" className="mx-auto h-14 w-14" />
                  {t(`avatar.styles.${h}`)}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <Swatches colors={HAIR_COLORS} value={a.hairColor} onChange={(hairColor) => set({ hairColor })} />
            </div>
          </Section>
          <Section title={t("avatar.mustache")}>
            <div className="grid w-40 grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1">
              {[false, true].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => set({ mustache: v })}
                  className={`rounded-lg py-1.5 text-sm font-semibold ${a.mustache === v ? "bg-surface-2 text-text" : "text-muted"}`}
                >
                  {v ? t("avatar.on") : t("avatar.off")}
                </button>
              ))}
            </div>
          </Section>

          <Section title={t("avatar.outfit")}>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {OUTFITS.map((id) => (
                <PartButton key={id} id={id} selected={a.outfit === id} owned={owns(id)} onClick={() => set({ outfit: id })}>
                  <Avatar config={{ ...a, outfit: id }} className="mx-auto h-24 w-auto" />
                </PartButton>
              ))}
            </div>
          </Section>
          {isFullSet(a) && (
            <p className="rounded-xl border border-gold/50 bg-gold/10 px-3 py-2 text-sm font-semibold">👑 {t("avatar.fullSet")}</p>
          )}
          <Section title={t("avatar.hat")} disabled={isFullSet(a)}>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {HATS.map((id) => (
                <PartButton key={id} id={id} selected={a.hat === id} owned={owns(id)} onClick={() => set({ hat: id })}>
                  <Avatar config={{ ...a, hat: id }} variant="head" className="mx-auto h-16 w-16" />
                </PartButton>
              ))}
            </div>
          </Section>
          <Section title={t("avatar.color")} disabled={isFullSet(a)}>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((id) => {
                const owned = owns(id);
                const price = getItem(id)?.price ?? 0;
                return (
                  <button
                    key={id}
                    onClick={() => set({ color: id })}
                    title={t(`color.${id}`)}
                    className={`flex items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-1 text-xs font-semibold ${
                      a.color === id ? "border-gold bg-surface-2" : "border-line"
                    }`}
                  >
                    <span className="h-6 w-6 rounded-full border border-black/10" style={{ background: COLOR_HEX[id] }} />
                    {t(`color.${id}`)}
                    {!owned && <span className="text-muted">🔒{price}</span>}
                  </button>
                );
              })}
            </div>
          </Section>
          <p className="text-xs text-muted">{t("avatar.lockedNote")}</p>
        </div>
      </div>

      {/* Нижняя панель сохранения */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3">
          {!me ? (
            <>
              <p className="flex-1 text-xs text-muted">{t("avatar.guestNote")}</p>
              {missing.length ? (
                <Link href="/auth" className="btn btn-primary">
                  {t("nav.login")}
                </Link>
              ) : (
                <button className="btn btn-primary" disabled={!changed || busy} onClick={save}>
                  {t("avatar.save")}
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex-1 text-sm">
                {missing.length > 0 && (
                  <span className={coins >= missingCost && starsOk ? "text-muted" : "text-bad"}>
                    {missing.map((id) => (getItem(id) ? itemName(getItem(id)!, t) : id)).join(", ")}:{" "}
                    {!starsOk
                      ? `${t("shop.premiumReq", { n: starsNeeded })} (${t("shop.premiumHave", { n: stars })})`
                      : coins >= missingCost
                        ? `${missingCost} 🪙`
                        : t("avatar.notEnough", { n: missingCost - coins })}
                  </span>
                )}
              </div>
              <button
                className="btn btn-primary"
                disabled={!changed || busy || (missing.length > 0 && (coins < missingCost || !starsOk))}
                onClick={save}
              >
                {busy ? "…" : missing.length ? t("avatar.buy", { price: missingCost }) : t("avatar.save")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, disabled }: { title: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <section className={`card p-4 ${disabled ? "pointer-events-none opacity-40" : ""}`} inert={disabled}>
      <h2 className="mb-3 text-sm font-bold text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Swatches({ colors, value, onChange }: { colors: string[]; value: number; onChange: (i: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c, i) => (
        <button
          key={c}
          onClick={() => onChange(i)}
          aria-label={c}
          aria-pressed={value === i}
          className={`h-10 w-10 rounded-full border-2 transition-transform ${value === i ? "scale-110 border-gold" : "border-line"}`}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}

function PartButton({
  id,
  selected,
  owned,
  onClick,
  children,
}: {
  id: string;
  selected: boolean;
  owned: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const item = getItem(id);
  const t = useT();
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center rounded-xl border p-1.5 text-center ${selected ? "border-gold bg-surface-2" : "border-line"} ${
        item?.requiresStars ? "ring-2 ring-gold/60" : ""
      }`}
    >
      {children}
      <span className="mt-1 text-[11px] leading-tight font-semibold">{item ? itemName(item, t) : ""}</span>
      {!owned && !isFree(id) && <span className="text-[11px] text-muted">🔒 {item?.price} 🪙</span>}
    </button>
  );
}

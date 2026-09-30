"use client";

import { useState } from "react";
import { toggleMoveControl, toggleSound } from "@/components/AccountProvider";
import { useLocal } from "@/lib/local";
import { useT } from "@/i18n/provider";
import QuickRules from "./QuickRules";

/**
 * Крупная панель управления раундом: у каждой кнопки есть иконка и подпись,
 * поэтому не нужно гадать, что делает «↺» или «━●━».
 */
export default function GameToolbar({
  onRestart,
  restartDisabled,
}: {
  onRestart: () => void;
  restartDisabled?: boolean;
}) {
  const t = useT();
  const local = useLocal();
  const [help, setHelp] = useState(false);
  const slider = local.settings.moveControl === "slider";
  const sound = local.settings.sound;

  return (
    <>
      <div className="grid grid-cols-4 gap-2 pb-2">
        <ToolButton
          icon="↺"
          label={t("play.restartShort")}
          title={t("play.restart")}
          onClick={onRestart}
          disabled={restartDisabled}
          emphasis
        />
        <ToolButton
          icon={slider ? "━●━" : "◀ ▶"}
          label={slider ? t("play.ctrlSlider") : t("play.ctrlArrows")}
          title={slider ? t("play.moveButtons") : t("play.moveSlider")}
          onClick={toggleMoveControl}
          small
        />
        <ToolButton icon="?" label={t("play.help")} title={t("play.helpTitle")} onClick={() => setHelp(true)} />
        <ToolButton
          icon={sound ? "🔊" : "🔇"}
          label={sound ? t("play.soundOn") : t("play.soundOff")}
          title={sound ? t("common.soundOff") : t("common.soundOn")}
          onClick={toggleSound}
        />
      </div>
      {help && <QuickRules onClose={() => setHelp(false)} />}
    </>
  );
}

function ToolButton({
  icon,
  label,
  title,
  onClick,
  disabled,
  emphasis,
  small,
}: {
  icon: string;
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  emphasis?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`flex h-[60px] flex-col items-center justify-center gap-0.5 rounded-2xl border px-1 leading-none font-semibold transition-transform active:scale-95 disabled:opacity-40 ${
        emphasis && !disabled
          ? "border-gold/70 bg-gold/20 text-text shadow-[0_4px_16px_-8px_rgba(242,180,65,0.8)]"
          : "border-line bg-surface-2 text-text"
      }`}
    >
      <span className={`${small ? "text-base tracking-tighter" : "text-2xl"} font-bold`} aria-hidden>
        {icon}
      </span>
      <span className="max-w-full truncate text-[11px] text-muted">{label}</span>
    </button>
  );
}

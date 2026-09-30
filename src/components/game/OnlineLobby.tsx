"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { errorText } from "@/i18n/game";
import { useT } from "@/i18n/provider";
import { saveCreds } from "./OnlineDuel";

/** Создать онлайн-матч или войти по коду. */
export default function OnlineLobby() {
  const t = useT();
  const router = useRouter();
  const { me, toast } = useAccount();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() || me?.displayName || t("duel.p1Default") }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(errorText(d.error, t, t("play.netError")));
      saveCreds(d.code, { token: d.token, seat: 0 });
      router.push(`/m/${d.code}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : t("play.netError"));
      setBusy(false);
    }
  };

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    // Принимаем и код, и всю ссылку целиком.
    const raw = code.trim();
    const m = raw.match(/([A-Za-z0-9]{6})\/?$/);
    if (m) router.push(`/m/${m[1].toUpperCase()}`);
  };

  return (
    <div className="mt-4 grid gap-4">
      <form onSubmit={create} className="card grid gap-3 p-5">
        <p className="text-sm text-muted">{t("online.lobbyLead")}</p>
        <label className="grid gap-1 text-sm">
          <span className="text-muted">{t("online.yourName")}</span>
          <input
            className="input"
            maxLength={16}
            placeholder={me?.displayName ?? t("duel.p1Default")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? t("online.creating") : `🌐 ${t("online.create")}`}
        </button>
      </form>

      <form onSubmit={go} className="card grid gap-3 p-5">
        <div className="text-sm font-semibold">{t("online.haveCode")}</div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            className="input font-mono uppercase"
            placeholder={t("online.codePlaceholder")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label={t("online.code")}
          />
          <button className="btn btn-ghost" disabled={code.trim().length < 6}>
            {t("online.joinBtn")}
          </button>
        </div>
      </form>
    </div>
  );
}

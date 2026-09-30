"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { getLocal } from "@/lib/local";
import { UNIVERSITIES } from "@/lib/universities";
import { useT } from "@/i18n/provider";
import { errorText } from "@/i18n/game";

export default function AuthPage() {
  const router = useRouter();
  const { refresh } = useAccount();
  const t = useT();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", password: "", displayName: "", university: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent, demo?: boolean) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = demo
      ? {}
      : (mode === "login"
        ? { username: form.username, password: form.password }
        : { ...form, university: form.university || undefined });
    try {
      const res = await fetch(`/api/auth/${demo ? "demo" : mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errorText(data.error, t, t("auth.serverDown")));
      // Переносим гостевой прогресс в профиль — сервер перепроверит каждый результат.
      const levels = Object.fromEntries(Object.entries(getLocal().levels).map(([id, r]) => [id, r.inputs]));
      if (Object.keys(levels).length)
        await fetch("/api/sync", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ levels }),
        }).catch(() => {});
      await refresh();
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.serverDown"));
    } finally {
      setBusy(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="mx-auto w-full max-w-sm px-4 pt-8 pb-16">
      <h1 className="font-display text-2xl font-bold">{mode === "login" ? t("auth.login") : t("auth.register")}</h1>
      <p className="mt-2 text-sm text-muted">
        {t("auth.lead")}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-xl py-2 text-sm font-semibold ${mode === m ? "bg-surface-2 text-text" : "text-muted"}`}
          >
            {m === "login" ? t("auth.login") : t("auth.register")}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="card mt-4 grid gap-3 p-5">
        <Field label={t("auth.username")}>
          <input className="input" autoComplete="username" required value={form.username} onChange={set("username")} placeholder="aidos_2007" />
        </Field>
        <Field label={t("auth.password")}>
          <input
            className="input"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "register" ? 6 : undefined}
            value={form.password}
            onChange={set("password")}
          />
        </Field>
        {mode === "register" && (
          <>
            <Field label={t("auth.displayName")}>
              <input className="input" required maxLength={20} value={form.displayName} onChange={set("displayName")} placeholder="Aidos" />
            </Field>
            <Field label={t("auth.university")}>
              <select className="input" value={form.university} onChange={set("university")}>
                <option value="">{t("auth.noUniversity")}</option>
                {UNIVERSITIES.map((u) => (
                  <option key={u} value={u}>
                    {u === "Другой" ? t("uni.other") : u}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
        {error && <p className="text-sm text-bad">{error}</p>}
        <button className="btn btn-primary mt-1" disabled={busy}>
          {busy ? "…" : mode === "login" ? t("auth.submitLogin") : t("auth.submitRegister")}
        </button>
      </form>

      <div className="card mt-4 border-sky/30 p-4 text-sm">
        <div className="font-semibold">{t("auth.reviewers")}</div>
        <p className="mt-1 text-muted">
          {t("auth.demo")}
        </p>
        <button
          type="button"
          className="btn btn-ghost mt-3 w-full !py-2"
          disabled={busy}
          onClick={(e) => submit(e, true)}
        >
          {t("auth.demoButton")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}

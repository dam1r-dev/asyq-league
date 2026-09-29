"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "./AccountProvider";
import AsyqMark from "./AsyqMark";

const NAV = [
  { href: "/levels", label: "Испытания", icon: "🎯" },
  { href: "/leaderboard", label: "Лига", icon: "🏆" },
  { href: "/shop", label: "Магазин", icon: "🛍️" },
];

export default function Header() {
  const pathname = usePathname();
  const { me, loading } = useAccount();

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-line/70 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-full max-w-5xl items-center gap-2 px-3">
        <Link href="/" className="flex items-center gap-2 pr-2" aria-label="Asyq League — на главную">
          <AsyqMark className="h-7 w-7" />
          <span className="font-display text-[15px] font-extrabold tracking-tight whitespace-nowrap">
            Asyq<span className="text-gold"> League</span>
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition-colors ${
                  active ? "bg-surface-2 text-text" : "text-muted hover:text-text"
                }`}
              >
                <span aria-hidden>{n.icon}</span>
                <span className="hidden sm:inline">{n.label}</span>
              </Link>
            );
          })}
          <Link
            href={me ? "/profile" : "/auth"}
            className={`ml-1 flex h-9 items-center rounded-xl border border-line px-3 text-sm font-semibold ${
              pathname.startsWith("/profile") || pathname.startsWith("/auth") ? "bg-surface-2" : "bg-surface"
            }`}
          >
            {loading ? "…" : me ? <span className="max-w-[90px] truncate">{me.displayName}</span> : "Войти"}
          </Link>
        </nav>
      </div>
    </header>
  );
}

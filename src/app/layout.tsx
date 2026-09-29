import type { Metadata, Viewport } from "next";
import { Montserrat, Onest } from "next/font/google";
import { AccountProvider } from "@/components/AccountProvider";
import Header from "@/components/Header";
import { I18nProvider } from "@/i18n/provider";
import { getLang, getServerT, getTheme } from "@/i18n/server";
import "./globals.css";

const onest = Onest({ variable: "--font-onest", subsets: ["latin", "cyrillic", "cyrillic-ext"] });
// Montserrat — в нём есть все казахские буквы (ә, ғ, қ, ң, ө, ұ, ү, һ, і).
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: { title: t("meta.title"), description: t("meta.description"), type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#15110d" },
    { media: "(prefers-color-scheme: light)", color: "#f7f0e4" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Язык и тема читаются из cookie на сервере — страница сразу приходит
  // на нужном языке и в нужной теме, без мигания.
  const [lang, theme] = await Promise.all([getLang(), getTheme()]);
  return (
    <html
      lang={lang}
      data-theme={theme ?? undefined}
      className={`${onest.variable} ${montserrat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <I18nProvider initialLang={lang}>
          <AccountProvider>
            <Header />
            <main className="flex flex-1 flex-col">{children}</main>
          </AccountProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

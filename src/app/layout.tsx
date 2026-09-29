import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import { AccountProvider } from "@/components/AccountProvider";
import Header from "@/components/Header";
import "./globals.css";

const onest = Onest({ variable: "--font-onest", subsets: ["latin", "cyrillic", "cyrillic-ext"] });
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Asyq League — асық ату в браузере",
  description:
    "Цифровая версия казахской игры асық ату: прицелься, выбери силу и выбей асыки из кона. Испытания, дуэли, испытание дня и лига университетов.",
  openGraph: {
    title: "Asyq League — асық ату в браузере",
    description: "Прицелься, выбери силу и выбей асыки из кона. Сыграй и брось вызов другу.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#15110d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${onest.variable} ${unbounded.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AccountProvider>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
        </AccountProvider>
      </body>
    </html>
  );
}

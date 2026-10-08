import type { MetadataRoute } from "next";

/** Манифест PWA: игру можно установить на экран телефона и запускать как приложение. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Asyq League — асық ату",
    short_name: "Asyq League",
    description: "Казахская игра асық ату в браузере: испытания, дуэли по ссылке, лига университетов.",
    start_url: "/",
    display: "standalone",
    background_color: "#15110d",
    theme_color: "#15110d",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

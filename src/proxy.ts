import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Защита от CSRF для API: запрос, меняющий данные, должен прийти с нашего же
 * сайта. Браузер сам добавляет Origin и Sec-Fetch-Site — подделать их со
 * стороннего сайта нельзя. Запросы без этих заголовков (curl, тесты) не браузерные
 * и cookie чужого пользователя у них не появится.
 */
export function proxy(request: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return NextResponse.next();

  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return forbidden();

  const origin = request.headers.get("origin");
  if (origin) {
    let host: string | null = null;
    try {
      host = new URL(origin).host;
    } catch {}
    const own = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (!host || host !== own) return forbidden();
  }
  return NextResponse.next();
}

function forbidden() {
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export const config = { matcher: "/api/:path*" };

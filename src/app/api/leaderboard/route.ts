import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { dayBoard, mastersBoard, universityBoard } from "@/lib/leaderboard";

export async function GET(req: Request) {
  const type = new URL(req.url).searchParams.get("type") ?? "day";
  try {
    const rows = type === "uni" ? await universityBoard() : type === "masters" ? await mastersBoard() : await dayBoard();
    const me = await getSessionUserId().catch(() => null);
    // Чужие идентификаторы наружу не отдаём — только пометку «это вы».
    return NextResponse.json({ rows: rows.map(({ userId, ...r }) => ({ ...r, mine: !!me && userId === me })) });
  } catch {
    return NextResponse.json({ rows: [], offline: true });
  }
}

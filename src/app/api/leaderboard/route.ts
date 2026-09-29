import { NextResponse } from "next/server";
import { dayBoard, mastersBoard, universityBoard } from "@/lib/leaderboard";

export async function GET(req: Request) {
  const type = new URL(req.url).searchParams.get("type") ?? "day";
  try {
    const rows = type === "uni" ? await universityBoard() : type === "masters" ? await mastersBoard() : await dayBoard();
    return NextResponse.json({ rows });
  } catch {
    return NextResponse.json({ rows: [], offline: true });
  }
}

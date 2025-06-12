
import { NextResponse } from "next/server";
import { destroySessionCookie } from "@/lib/auth";

export async function POST(req) {
  const res = NextResponse.json({ ok: true });
  destroySessionCookie(res);
  return res;
}

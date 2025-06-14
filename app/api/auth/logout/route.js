
import { NextResponse } from "next/server";
import { destroySessionCookie } from "@/lib/auth";

export async function POST(req) {
  // Redirect to main page ("/") after logout
  const res = NextResponse.redirect("/");
  destroySessionCookie(res);
  return res;
}

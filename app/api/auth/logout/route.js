
import { NextResponse } from "next/server";
import { destroySessionCookie } from "@/lib/auth";

export async function POST(req) {
  // Build an absolute URL to the root of the site
  // Get protocol and host from request headers
  const { headers } = req;
  const protocol = headers.get("x-forwarded-proto") || "https";
  const host = headers.get("host");
  const homeUrl = `${protocol}://${host}/`;

  const res = NextResponse.redirect(homeUrl);
  destroySessionCookie(res);
  return res;
}


import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "CHANGEME_DEVELOPMENT_SECRET_SHOULD_BE_SET";

/**
 * Issue HTTP-only session cookie on login.
 * @param {Response} res response to mutate with Set-Cookie
 * @param {Object} user - user DB object
 */
export function setSessionCookie(res, user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plantelId: user.plantelId,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  res.cookies.set("session-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

/**
 * Read and verify session from cookies.
 * @param {RequestCookies} cookies
 * @returns {null|session}
 */
export function getSessionFromCookies(cookies) {
  const token = cookies.get("session-token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Remove cookie by setting past expiration.
 * @param {Response} res
 */
export function destroySessionCookie(res) {
  res.cookies.set("session-token", "", {
    httpOnly: true,
    maxAge: -1,
    path: "/",
  });
}

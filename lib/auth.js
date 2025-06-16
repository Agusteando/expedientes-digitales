
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

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
 * For admin/superadmin, hydrate plantelesAdminIds from DB.
 * @param {RequestCookies|Cookies} cookies
 * @returns {Promise<null|session>}
 */
export async function getSessionFromCookies(cookies) {
  // Await cookies.get (since dynamic API)
  const sessionTokenCookie = await cookies.get("session-token");
  const token = sessionTokenCookie?.value;
  if (!token) return null;
  let session;
  try {
    session = jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
  // Hydrate extra fields for admin/superadmin
  if (session && (session.role === "admin" || session.role === "superadmin")) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { id: true, role: true, email: true, name: true, picture: true, plantelId: true, plantelesAdmin: { select: { id: true } } }
      });
      if (user) {
        session.plantelesAdminIds = user.plantelesAdmin?.map(p => p.id) || [];
        session.name = user.name;
        session.email = user.email;
        session.picture = user.picture;
        session.plantelId = user.plantelId;
      }
    } catch (e) {
      // Fallback: just return base session
    }
  }
  return session;
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

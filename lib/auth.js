
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "CHANGEME_DEVELOPMENT_SECRET_SHOULD_BE_SET";

export function setSessionCookie(res, userOrSession) {
  const payload = { ...(
    userOrSession.id
      ? {
          id: userOrSession.id,
          email: userOrSession.email,
          name: userOrSession.name,
          role: userOrSession.role,
          plantelId: userOrSession.plantelId,
          ...(userOrSession.plantelesAdminIds ? { plantelesAdminIds: userOrSession.plantelesAdminIds } : {}),
          ...(userOrSession.picture ? { picture: userOrSession.picture } : {}),
          ...(userOrSession._impersonatedBy ? { _impersonatedBy: userOrSession._impersonatedBy } : {}),
          ...(userOrSession._impersonatorId ? { _impersonatorId: userOrSession._impersonatorId } : {})
        }
      : userOrSession
  ) };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  res.cookies.set("session-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

export async function getSessionFromCookies(cookies) {
  const sessionTokenCookie = await cookies.get("session-token");
  const token = sessionTokenCookie?.value;
  if (!token) return null;
  let session;
  try {
    session = jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
  // Hydrate plantelesAdminIds for admin/superadmin (already done above)
  if (
    session &&
    (session.role === "admin" || session.role === "superadmin") &&
    !session.plantelesAdminIds
  ) {
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
        // Debug log
        // eslint-disable-next-line no-console
        console.log("[auth.js][getSessionFromCookies] Hydrated plantelesAdminIds:", {
          userId: user.id, email: user.email, plantelesAdminIds: session.plantelesAdminIds
        });
      }
    } catch (e) {
      // Fallback: just return base session
    }
  }
  // Defensive fallback: for admin, if plantelesAdminIds is empty but they have a plantelId, treat as single plantel admin (optional)
  if (
    session &&
    session.role === "admin" &&
    (!session.plantelesAdminIds || session.plantelesAdminIds.length === 0)
  ) {
    if (session.plantelId) {
      session.plantelesAdminIds = [session.plantelId];
      // Debug log for fallback
      // eslint-disable-next-line no-console
      console.log("[auth.js][getSessionFromCookies] Fallback: using user.plantelId as plantelesAdminIds", {
        userId: session.id, email: session.email, plantelId: session.plantelId
      });
    }
  }
  return session;
}

export function destroySessionCookie(res) {
  res.cookies.set("session-token", "", {
    httpOnly: true,
    maxAge: -1,
    path: "/",
  });
}

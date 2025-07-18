
import ResetPasswordForm from "./ResetPasswordForm";
import prisma from "@/lib/prisma";

/**
 * Server Component: /reset-password/page.jsx
 * - Reads searchParams (token)
 * - Checks token validity on the server (SSR)
 * - Passes result to client form as props
 */
export default async function ResetPasswordPage({ searchParams }) {
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  let tokenValid = false;
  let error = "";
  let userId = null;

  if (!token) {
    error = "El enlace de recuperación es inválido o ha expirado.";
  } else {
    // Validate the token server-side (one DB call)
    try {
      const tokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token },
        select: {
          id: true,
          expiresAt: true,
          used: true,
          userId: true,
        },
      });
      if (!tokenRecord) {
        error = "Este enlace es inválido o ha expirado. Solicita otro.";
      } else if (tokenRecord.used) {
        error = "Este enlace de recuperación ya fue utilizado.";
      } else if (tokenRecord.expiresAt < new Date()) {
        error = "Este enlace ha expirado. Solicita otro.";
      } else {
        tokenValid = true;
        userId = tokenRecord.userId;
      }
    } catch (err) {
      console.error("[RESET PASSWORD TOKEN VALIDATION ERROR]", err);
      error = "Ocurrió un problema al validar el enlace.";
    }
  }

  return (
    <ResetPasswordForm
      token={token}
      tokenValid={tokenValid}
      error={error}
      userId={userId}
    />
  );
}

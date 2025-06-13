
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Canonical NextAuth options for IECS-IEDIS "employee/candidate" login.
 * - Only credentials provider; use GSI/Google login separately for admins.
 * - Enforces account status (isActive) and role restrictions.
 */
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Correo", type: "email", placeholder: "tu@correo.com" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) throw new Error("Faltan datos");

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() }
        });

        if (!user) throw new Error("Usuario o contraseña incorrectos.");
        if (user.role === "admin" || user.role === "superadmin") throw new Error("Acceso solo con Google para administradores.");
        if (!user.passwordHash) throw new Error("No hay contraseña configurada.");
        if (!user.isActive) throw new Error("Cuenta deshabilitada.");
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) throw new Error("Usuario o contraseña incorrectos.");

        return user;
      }
    }),
  ],
  pages: {
    signIn: "/empleado", // User will land on your custom login page
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.picture || null;
        token.plantelId = user.plantelId || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.picture = token.picture;
        session.user.plantelId = token.plantelId;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== "production",
};

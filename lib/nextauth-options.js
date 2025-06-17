
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GSI_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      id: "login",
      name: "Signia Credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials, req) {
        const { email, password } = credentials;
        try {
          console.debug("[CREDENTIALS]", { email, at: new Date() });
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            console.warn("[CREDENTIALS] User not found", { email });
            throw new Error("Usuario o contraseña incorrectos.");
          }
          if (!user.passwordHash) {
            console.warn("[CREDENTIALS] No passwordHash in DB", { email });
            throw new Error("Inicie sesión con Google si es una cuenta administrativa.");
          }
          if (!user.isActive) {
            console.warn("[CREDENTIALS] isActive is false", { email });
            throw new Error("Cuenta deshabilitada.");
          }
          if (user.role === "admin" || user.role === "superadmin") {
            console.warn("[CREDENTIALS] Admin tried non-admin login", { email });
            throw new Error("Administradores ingresan sólo con Google.");
          }
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            console.warn("[CREDENTIALS] Invalid password", { email });
            throw new Error("Usuario o contraseña incorrectos.");
          }
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            picture: user.picture || null,
            plantelId: user.plantelId || null,
          };
        } catch (err) {
          // Ensures NextAuth forwards error message instead of generic one
          throw new Error(err.message || "Error de autenticación");
        }
      }
    })
  ],
  // Keeps admin-only login on /admin/login
  pages: {
    signIn: "/admin/login"
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!user.email.endsWith("@casitaiedis.edu.mx")) {
          console.warn("[GOOGLE SIGNIN] DENIED: not institutional", { email: user.email });
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.picture || null;
        token.plantelId = user.plantelId || null;
        if (["admin", "superadmin"].includes(user.role)) {
          const adminWithPlanteles = await prisma.user.findUnique({
            where: { id: user.id },
            select: { plantelesAdmin: { select: { id: true } } }
          });
          token.plantelesAdminIds = adminWithPlanteles
            ? adminWithPlanteles.plantelesAdmin.map(p => p.id)
            : [];
        }
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
        session.user.plantelesAdminIds = token.plantelesAdminIds || [];
      }
      return session;
    }
  }
};

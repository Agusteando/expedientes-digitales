
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
      async authorize(credentials) {
        const { email, password } = credentials;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        if (!user.passwordHash) return null;
        if (user.role === "admin" || user.role === "superadmin") return null;
        if (!user.isActive) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        // Only allow external users (not admin/superadmin)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          picture: user.picture || null,
          plantelId: user.plantelId || null,
        };
      }
    })
  ],
  pages: {
    signIn: "/admin/login"
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow institutional emails for admin Google SSO
      if (account?.provider === "google") {
        // Only allow @casitaiedis.edu.mx users
        if (!user.email.endsWith("@casitaiedis.edu.mx")) return false;
        // Optionally provisioning—upgrade role to admin/superadmin here as needed
        // (done in jwt callback below)
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

        // For admins—fetch all planteles they manage for session
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

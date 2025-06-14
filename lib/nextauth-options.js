
// (rest of your imports)
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  // ...previous
  callbacks: {
    async jwt({ token, user }) {
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
  },
  // ...rest unchanged
};

import NextAuth from "next-auth";
import { authOptions } from "@/lib/nextauth-options";

/**
 * This is the canonical App Router handler for NextAuth authentication.
 * Required for login, session, and signout workflows in Next.js App Router.
 * 
 * Supports GET and POST (required for sign-in/out and callback endpoints).
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
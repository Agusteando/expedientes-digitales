
"use client";
import { SessionProvider } from "next-auth/react";

/**
 * Wraps children in NextAuth SessionProvider for client-side session access (required for useSession/signOut hooks).
 * You may add other global providers here.
 */
export default function Providers({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}

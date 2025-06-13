
"use client";

import { SessionProvider, useSession } from "next-auth/react";
import LogoutButton from "./LogoutButton";

/**
 * Wraps LogoutButton in a client-only node and only renders if there's a session.
 * Wrapped in SessionProvider (with default session, so SSR is fine).
 */
function Inner() {
  const { data: session } = useSession();
  if (!session?.user) return null;
  return <LogoutButton />;
}

export default function ClientLogout() {
  return (
    <SessionProvider>
      <Inner />
    </SessionProvider>
  );
}

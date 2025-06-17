
"use client";

import Providers from "@/components/Providers";

export default function PortalLayout({ children }) {
  // Consistent with admin: wraps portal in SessionProvider context, add other global providers as needed.
  return <Providers>{children}</Providers>;
}

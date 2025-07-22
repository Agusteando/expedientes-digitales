
"use client";
import { useState } from "react";
import AdminSidebar, { AdminMobileSidebarToggle } from "@/components/admin/AdminSidebar";

/**
 * Flex row: sidebar + main
 * No parent uses overflow-x-hidden/auto/scroll, so sticky works.
 * Sidebar is always sibling (not child) of <main>.
 */
export default function AdminInicioClient({
  children,
  showSidebar
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#faf6fe] via-[#dbf3de] to-[#e2f8fe]">
      {/* Fixed navbar height is assumed 68px. Adjust pt if your navbar changes. */}
      <div className="flex min-h-screen w-full pt-[68px]">
        {showSidebar && (
          <>
            <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
            <AdminMobileSidebarToggle onClick={() => setMobileOpen(true)} />
          </>
        )}
        {/* Main content: grows, doesn't wrap, can't cause overflow */}
        <main className="flex-1 w-full min-w-0 max-w-full flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}

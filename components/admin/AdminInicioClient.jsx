
"use client";
import { useState } from "react";
import AdminSidebar, { AdminMobileSidebarToggle } from "@/components/admin/AdminSidebar";

const NAVBAR_HEIGHT = 68; // px

export default function AdminInicioClient({
  children,
  showSidebar
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Layout: NAVBAR (fixed elsewhere), then below it a flex row (sidebar + main)
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#faf6fe] via-[#dbf3de] to-[#e2f8fe]">
      <div className="flex flex-row w-full min-h-screen pt-[68px] md:pt-[72px]">
        {showSidebar && (
          <>
            <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
            <AdminMobileSidebarToggle onClick={() => setMobileOpen(true)} />
          </>
        )}
        <div className="flex-1 flex flex-col w-full min-w-0 max-w-full">
          {children}
        </div>
      </div>
    </div>
  );
}

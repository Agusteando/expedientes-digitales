
"use client";
import { useState } from "react";
import AdminSidebar, { AdminMobileSidebarToggle } from "@/components/admin/AdminSidebar";
import AdminNav from "@/components/admin/AdminNav";

export default function AdminInicioClient({
  children,
  session,
  showSidebar
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#faf6fe] via-[#dbf3de] to-[#e2f8fe]">
      {showSidebar && (
        <>
          <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
          <AdminMobileSidebarToggle onClick={() => setMobileOpen(true)} />
        </>
      )}
      <div className="flex-1 w-full min-w-0 max-w-full">
        {children}
      </div>
    </div>
  );
}

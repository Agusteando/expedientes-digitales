
"use client";
import { UserGroupIcon, AcademicCapIcon, BuildingLibraryIcon, ClipboardCheckIcon } from "@heroicons/react/24/outline";

export default function AdminDashboardStats({ summary }) {
  // summary = { totalUsers, totalPlanteles, completedExpedientes, percentComplete }
  return (
    <section className="w-full grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4 mb-4">
      <div className="bg-gradient-to-r from-purple-50/90 via-fuchsia-50 to-cyan-50 rounded-2xl p-3 sm:p-4 flex flex-col shadow border border-purple-100 min-w-[120px]">
        <div className="flex flex-row items-center gap-1 text-purple-900 text-base font-bold">
          <UserGroupIcon className="w-6 h-6 mr-1 text-purple-500" />
          Empleados
        </div>
        <div className="font-extrabold text-xl xs:text-2xl tracking-tight text-purple-900">{summary.totalUsers}</div>
      </div>
      <div className="bg-gradient-to-r from-blue-50 via-green-50 to-cyan-100 rounded-2xl p-3 sm:p-4 flex flex-col shadow border border-cyan-100 min-w-[120px]">
        <div className="flex flex-row items-center gap-1 text-cyan-800 text-base font-bold">
          <BuildingLibraryIcon className="w-6 h-6 text-cyan-500 mr-1" />
          Planteles
        </div>
        <div className="font-extrabold text-xl xs:text-2xl tracking-tight text-cyan-900">{summary.totalPlanteles}</div>
      </div>
      <div className="col-span-2 xs:col-span-1 bg-gradient-to-r from-green-50 via-emerald-50 to-cyan-50 rounded-2xl p-3 sm:p-4 flex flex-col shadow border border-emerald-100 min-w-[124px]">
        <div className="flex flex-row items-center gap-1 text-emerald-800 text-base font-bold">
          <ClipboardCheckIcon className="w-6 h-6 text-emerald-600 mr-1" />
          Expedientes completos
        </div>
        <div className="font-extrabold text-xl xs:text-2xl tracking-tight text-emerald-800">
          {summary.completedExpedientes} <span className="ml-1 text-xs font-semibold text-slate-600">({summary.percentComplete}%)</span>
        </div>
      </div>
    </section>
  );
}

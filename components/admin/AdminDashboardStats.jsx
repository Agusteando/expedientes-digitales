
"use client";
import {
  UserGroupIcon,
  BuildingLibraryIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/outline";

export default function AdminDashboardStats({ summary }) {
  // summary shape: {
  //    userDocsCompleted, totalUsers,
  //    totalPlanteles, percentDigitalExpedientes,
  //    percentFinalExpedientes, totalDocuments
  // }
  return (
    <section className="w-full grid grid-cols-2 xs:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 mb-4">
      <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50 to-cyan-50 rounded-2xl p-3 sm:p-4 flex flex-col shadow border border-purple-100 min-w-[100px]">
        <div className="flex flex-row items-center gap-1 text-purple-900 text-base font-bold">
          <UserGroupIcon className="w-6 h-6 mr-1 text-purple-500" />
          Usuarios Signia
        </div>
        <div className="font-extrabold text-xl xs:text-2xl tracking-tight text-purple-900">{summary.userDocsCompleted}</div>
      </div>
      <div className="bg-gradient-to-r from-blue-50 via-green-50 to-cyan-100 rounded-2xl p-3 sm:p-4 flex flex-col shadow border border-cyan-100 min-w-[90px]">
        <div className="flex flex-row items-center gap-1 text-cyan-800 text-base font-bold">
          <BuildingLibraryIcon className="w-6 h-6 text-cyan-500 mr-1" />
          Planteles
        </div>
        <div className="font-extrabold text-xl xs:text-2xl tracking-tight text-cyan-900">{summary.totalPlanteles}</div>
      </div>
      <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 rounded-2xl p-3 sm:p-4 flex flex-col shadow border border-cyan-100 min-w-[120px]">
        <div className="flex flex-row items-center gap-1 text-cyan-800 text-base font-bold">
          <ClipboardDocumentListIcon className="w-6 h-6 text-cyan-600 mr-1" />
          % Expedientes digitales
        </div>
        <div className="font-extrabold text-xl xs:text-2xl tracking-tight text-cyan-900">{summary.percentDigitalExpedientes}%</div>
      </div>
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 via-cyan-50 rounded-2xl p-3 sm:p-4 flex flex-col shadow border border-emerald-100 min-w-[120px]">
        <div className="flex flex-row items-center gap-1 text-emerald-900 text-base font-bold">
          <ShieldCheckIcon className="w-6 h-6 text-emerald-600 mr-1" />
          % Expedientes finales
        </div>
        <div className="font-extrabold text-xl xs:text-2xl tracking-tight text-emerald-900">{summary.percentFinalExpedientes}%</div>
      </div>
      <div className="bg-gradient-to-r from-fuchsia-50 via-purple-50 to-cyan-50 rounded-2xl p-3 sm:p-4 flex flex-col shadow border border-fuchsia-100 min-w-[110px]">
        <div className="flex flex-row items-center gap-1 text-fuchsia-900 text-base font-bold">
          <DocumentPlusIcon className="w-6 h-6 text-fuchsia-500 mr-1" />
          Docs subidos
        </div>
        <div className="font-extrabold text-xl xs:text-2xl tracking-tight text-fuchsia-900">{summary.totalDocuments}</div>
      </div>
    </section>
  );
}

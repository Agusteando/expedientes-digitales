
"use client";
import { useState } from "react";
import { CheckCircleIcon, EyeIcon, ClipboardDocumentListIcon, TrashIcon, PowerIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { getUserChecklistProgress } from "./UserManagementTable";

export default function UserRow({
  user,
  planteles,
  adminsPlanteles,
  role,
  selected,
  canAssignPlantel,
  onSelect,
  onAssignPlantel,
  onDocs,
  onFichaTecnica,
  onSetActive,
  onDelete,
  getUserChecklistProgress: customChecklistProgress // injected function prop for DRY
}) {
  const [confirmAction, setConfirmAction] = useState(null);

  const isActive = !!user.isActive;
  function canAdminAssignTo(pid) {
    return role === "superadmin" || adminsPlanteles.includes(pid);
  }
  const canDelete = role === "superadmin" && typeof onDelete === "function" && user.id !== undefined;

  let statusBadge =
    isActive
      ? <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold">Activo</span>
      : <span className="inline-block px-2 py-0.5 rounded-full bg-gray-200 border border-gray-300 text-gray-700 text-xs font-bold">Baja</span>;

  const canToggleActive = role === "superadmin" ||
    (role === "admin" && user.plantelId && adminsPlanteles.includes(user.plantelId) && user.id !== undefined);

  // Progress bar logic: now always 14 items
  const progress = (customChecklistProgress || getUserChecklistProgress)(user);

  return (
    <tr className={`${selected ? "bg-cyan-50" : ""} ${!isActive ? "opacity-60 bg-gray-100" : ""}`}>
      <td className="text-center px-2 py-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={e => onSelect(e.target.checked)}
          className="accent-cyan-600 w-4 h-4"
          aria-label="Seleccionar usuario"
        />
      </td>
      <td className="px-2 py-2 flex flex-row gap-2 items-center">
        <Image
          src={user.picture || "/IMAGOTIPO-IECS-IEDIS.png"}
          width={34}
          height={34}
          alt=""
          className="rounded-full object-cover bg-white border border-cyan-100"
        />
        <div>
          <div className="font-semibold text-cyan-900">{user.name}</div>
          <div className="text-[11px] text-slate-400">{user.email}</div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ml-0 mt-1 ${
            user.role === "employee"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-cyan-100 text-cyan-700"
          }`}>{user.role === "employee" ? "Empleado" : "Candidato"}</span>
        </div>
      </td>
      <td className="px-2 py-2">
        {canAssignPlantel ? (
          <select
            className="rounded border-cyan-200 px-2 py-1 text-xs bg-white"
            value={user.plantelId || ""}
            onChange={e => onAssignPlantel(user.id, e.target.value)}
            disabled={!isActive || (role === "admin"
              ? !canAdminAssignTo(Number(e.target.value))
              : false)}
          >
            <option value="">Sin plantel</option>
            {planteles.map(p => (
              <option
                key={p.id}
                value={p.id}
                disabled={role === "admin" && !canAdminAssignTo(p.id)}
              >{p.name}</option>
            ))}
          </select>
        ) : (
          <span>
            {planteles.find(p => String(p.id) === String(user.plantelId))?.name ||
              <span className="text-slate-400 italic">Sin plantel</span>}
          </span>
        )}
      </td>
      <td className="px-2 py-2">
        {statusBadge}
      </td>
      {/* --- Progress bar for 14 checklist items --- */}
      <td className="px-2 py-2 min-w-[150px] align-middle">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative min-w-[72px] max-w-[120px]">
            <div className="w-full h-2 rounded-full bg-cyan-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  progress.pct >= 100
                    ? "bg-emerald-400"
                    : progress.pct > 50
                    ? "bg-cyan-400"
                    : "bg-yellow-400"
                }`}
                style={{ width: `${progress.pct}%` }}
              ></div>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700">{progress.done}/{progress.total}</span>
          {progress.pct === 100
            ? <span className="ml-2 text-emerald-800 flex items-center gap-0.5"><CheckCircleIcon className="w-4 h-4" />Listo</span>
            : <span className="ml-2 text-slate-500 text-xs">En progreso</span>
          }
        </div>
      </td>
      <td className="px-2 py-2 flex flex-row gap-2 items-center">
        <button
          className="hover:bg-cyan-100 px-2 py-1 rounded-full transition"
          onClick={() => onDocs(user)}
          aria-label="Ver documentos"
          disabled={!isActive}
        >
          <EyeIcon className="w-5 h-5 text-cyan-700" />
        </button>
        <button
          className="hover:bg-cyan-100 px-2 py-1 rounded-full transition"
          onClick={() => onFichaTecnica(user)}
          aria-label="Abrir ficha técnica"
          disabled={!isActive}
        >
          <ClipboardDocumentListIcon className="w-5 h-5 text-fuchsia-700" />
        </button>
      </td>
      <td className="px-2 py-2 flex flex-row flex-wrap gap-2 items-center justify-center min-w-[148px]">
        {canToggleActive && (
          isActive ? (
            <button
              title="Dar de baja"
              className="inline-flex min-w-[104px] justify-center items-center gap-1 px-2.5 py-1.5 rounded-full bg-gray-200 hover:bg-yellow-300 border border-gray-300 text-gray-800 text-xs font-semibold shadow-xs transition-shadow focus:outline-none"
              onClick={() => setConfirmAction({ type: "toggle", user })}
              aria-label="Dar de baja"
            >
              <PowerIcon className="w-4 h-4 mb-0.5" />
              Dar de baja
            </button>
          ) : (
            <button
              title="Activar"
              className="inline-flex min-w-[104px] justify-center items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs transition-shadow focus:outline-none"
              onClick={() => setConfirmAction({ type: "toggle", user })}
              aria-label="Activar"
            >
              <PowerIcon className="w-4 h-4 mb-0.5" />
              Activar
            </button>
          )
        )}
        {canDelete && (
          <button
            title="Eliminar usuario"
            className="inline-flex min-w-[104px] justify-center items-center gap-1 px-2.5 py-1.5 rounded-full bg-gray-100 hover:bg-red-200 border border-red-200 text-red-700 text-xs font-semibold shadow-xs transition-shadow focus:outline-none"
            onClick={() => setConfirmAction({ type: "delete", user })}
            aria-label="Eliminar usuario"
          >
            <TrashIcon className="w-4 h-4" /> Eliminar
          </button>
        )}
        {confirmAction?.type === "toggle" && confirmAction.user.id === user.id && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className="bg-white shadow-lg rounded-xl p-6 max-w-xs w-full text-center">
              <p className="mb-4 text-black font-semibold">
                {isActive
                  ? "¿Seguro que deseas dar de baja a este usuario? No podrá acceder a la plataforma."
                  : "¿Seguro que deseas activar a este usuario?"}
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  className={"px-4 py-2 rounded bg-gray-200 font-bold"}
                  onClick={() => setConfirmAction(null)}
                >Cancelar</button>
                <button
                  className={`px-4 py-2 rounded ${isActive ? "bg-yellow-400 text-slate-900" : "bg-emerald-700 text-white"} font-bold`}
                  onClick={() => { setConfirmAction(null); onSetActive(user.id, !isActive); }}
                  disabled={false}
                >
                  {isActive ? "Dar de baja" : "Activar"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* SUPERADMIN-ONLY confirmation dialog for delete */}
        {canDelete && confirmAction?.type === "delete" && confirmAction.user.id === user.id && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className="bg-white shadow-xl rounded-xl p-6 max-w-xs w-full text-center">
              <p className="mb-4 text-black font-bold">
                ¿Seguro que deseas eliminar este usuario?<br />
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  className={"px-4 py-2 rounded bg-gray-200 font-bold"}
                  onClick={() => setConfirmAction(null)}
                >Cancelar</button>
                <button
                  className="px-4 py-2 rounded bg-red-700 text-white font-bold"
                  onClick={() => { setConfirmAction(null); if (typeof onDelete === "function") onDelete(user.id); }}
                  disabled={false}
                >Eliminar</button>
              </div>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

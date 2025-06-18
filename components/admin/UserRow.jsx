
"use client";
import { CheckCircleIcon, EyeIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function UserRow({
  user,
  planteles,
  adminsPlanteles,
  role,
  selected,
  canAssignPlantel,
  onSelect,
  onAssignPlantel,
  onApproveCandidate,
  onDocs,
  onFichaTecnica
}) {
  function canAdminAssignTo(pid) {
    return role === "superadmin" || adminsPlanteles.includes(pid);
  }
  const canBeApproved = user.role === "candidate" && user.readyForApproval;

  return (
    <tr className={selected ? "bg-cyan-50" : ""}>
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
            disabled={role === "admin"
              ? !canAdminAssignTo(Number(e.target.value))
              : false}
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
        {user.role === "employee"
          ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 font-bold text-emerald-800 rounded-full text-xs">
              <CheckCircleIcon className="w-4 h-4" />Empleado
            </span>
          )
          : user.readyForApproval
            ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-50 border border-cyan-200 font-bold text-cyan-800 rounded-full text-xs">
              <CheckCircleIcon className="w-4 h-4" />Listo para aprobar
            </span>
          )
            : (
                <span className="inline-block px-2 py-1 bg-yellow-50 border border-yellow-100 text-yellow-700 text-xs rounded-full font-bold">
                  Incompleto
                </span>
              )
        }
      </td>
      <td className="px-2 py-2 flex flex-row gap-1 items-center">
        <button
          className="hover:bg-cyan-100 px-2 py-1 rounded-full"
          onClick={() => onDocs(user)}
          aria-label="Ver documentos"
        >
          <EyeIcon className="w-5 h-5 text-cyan-700" />
        </button>
        <button
          className="hover:bg-cyan-100 px-2 py-1 rounded-full"
          onClick={() => onFichaTecnica(user)}
          aria-label="Abrir ficha técnica"
        >
          <ClipboardDocumentListIcon className="w-5 h-5 text-fuchsia-700" />
        </button>
      </td>
      <td className="px-2 py-2 text-center">
        {canBeApproved ? (
          <button
            className="bg-emerald-700 hover:bg-emerald-900 text-white px-4 py-1 rounded-full text-xs font-bold shadow"
            onClick={() => onApproveCandidate(user.id)}
            aria-label="Aprobar candidato"
          >Aprobar</button>
        ) : (
          <span className="inline-block text-xs text-slate-400">—</span>
        )}
      </td>
    </tr>
  );
}

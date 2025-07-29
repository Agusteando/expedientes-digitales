
"use client";
import { useState } from "react";
import { BuildingLibraryIcon, PowerIcon } from "@heroicons/react/24/outline";

export default function BulkActionBar({
  users,
  planteles,
  adminRole,
  selectedUserIds,
  allSelected,
  canAssignPlantel,
  onBulkAssign,
  onBulkSetActive,
}) {
  const [bulkPlantelId, setBulkPlantelId] = useState("");
  const usersSelected = users.filter(u => selectedUserIds.includes(u.id));

  // For bulk activar: enable only if 1+ selected inactive (baja)
  const eligibleForActivate = usersSelected.filter(u => !u.isActive);
  const canBulkActivate = eligibleForActivate.length > 0;

  // For bulk baja: enable only if 1+ selected active
  const eligibleForBaja = usersSelected.filter(u => u.isActive);
  const canBulkInactivate = eligibleForBaja.length > 0;

  const canBulkAssign = selectedUserIds.length > 0;

  return (
    <div className="sticky bottom-1 w-full py-3 bg-white border-t border-cyan-100 z-20 rounded-b-xl flex flex-wrap items-center gap-4 justify-between mt-2">
      <span className="flex flex-row gap-2 items-center font-semibold text-cyan-900 text-xs">
        {selectedUserIds.length > 0 && (
          <>Seleccionados: <span className="font-bold">{selectedUserIds.length}</span></>
        )}
      </span>
      <div className="flex flex-row flex-wrap gap-2 items-center">
        {canAssignPlantel && (
          <>
            <select
              className="rounded border-cyan-200 px-2 py-1 text-xs bg-white min-w-[160px]"
              value={bulkPlantelId}
              onChange={e => setBulkPlantelId(e.target.value)}
            >
              <option value="">Asignar a plantel...</option>
              {planteles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              type="button"
              className="bg-cyan-700 hover:bg-cyan-900 text-white text-xs rounded-full px-4 py-1 font-bold shadow disabled:opacity-60 flex flex-row gap-2 items-center min-w-[104px]"
              disabled={!canBulkAssign || !bulkPlantelId}
              onClick={() => onBulkAssign(bulkPlantelId)}
            >
              <BuildingLibraryIcon className="w-4 h-4" />Asignar
            </button>
          </>
        )}
        <button
          type="button"
          className="inline-flex items-center min-w-[104px] gap-1 bg-gray-200 hover:bg-yellow-300 border border-gray-300 text-gray-800 text-xs rounded-full px-4 py-1 font-bold shadow disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!canBulkInactivate}
          onClick={() => onBulkSetActive(false)}
        >
          <PowerIcon className="w-4 h-4" />
          Dar de baja
        </button>
        <button
          type="button"
          className="inline-flex items-center min-w-[104px] gap-1 bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 text-emerald-800 text-xs rounded-full px-4 py-1 font-bold shadow disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!canBulkActivate}
          onClick={() => onBulkSetActive(true)}
        >
          <PowerIcon className="w-4 h-4" />
          Activar
        </button>
      </div>
    </div>
  );
}

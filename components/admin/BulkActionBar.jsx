
"use client";
import { useState } from "react";
import { BuildingLibraryIcon, CheckCircleIcon, PowerIcon } from "@heroicons/react/24/outline";

export default function BulkActionBar({
  users,
  planteles,
  adminRole,
  selectedUserIds,
  allSelected,
  canAssignPlantel,
  onBulkAssign,
  onBulkApprove,
  onBulkSetActive,
}) {
  const [bulkPlantelId, setBulkPlantelId] = useState("");
  const canBulkAssign = selectedUserIds.length > 0;
  const usersSelected = users.filter(u => selectedUserIds.includes(u.id));
  const readyToApprove = usersSelected.length > 0 && usersSelected.every(u => u.role === "candidate" && u.readyForApproval && u.isActive);

  const canBulkInactivate = usersSelected.some(u => u.isActive);
  const canBulkActivate = usersSelected.some(u => !u.isActive);

  return (
    <div className="sticky bottom-1 w-full py-3 bg-white border-t border-cyan-100 z-20 rounded-b-xl flex flex-wrap items-center gap-3 justify-between mt-2">
      <span className="flex flex-row gap-2 items-center font-semibold text-cyan-900 text-xs">
        {selectedUserIds.length > 0 && (
          <>Seleccionados: <span className="font-bold">{selectedUserIds.length}</span></>
        )}
      </span>
      <div className="flex flex-row gap-2 items-center">
        {canAssignPlantel && (
          <>
            <select
              className="rounded border-cyan-200 px-2 py-1 text-xs bg-white"
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
              className="bg-cyan-700 hover:bg-cyan-900 text-white text-xs rounded-full px-4 py-1 font-bold shadow disabled:opacity-60 flex flex-row gap-2 items-center"
              disabled={!canBulkAssign || !bulkPlantelId}
              onClick={() => onBulkAssign(bulkPlantelId)}
            >
              <BuildingLibraryIcon className="w-4 h-4" />Asignar
            </button>
          </>
        )}
        <button
          type="button"
          className="bg-emerald-700 hover:bg-emerald-900 text-white text-xs rounded-full px-4 py-1 font-bold shadow disabled:opacity-60 flex flex-row gap-2 items-center"
          disabled={!readyToApprove}
          onClick={onBulkApprove}
        >
          <CheckCircleIcon className="w-4 h-4" />Aprobar seleccionados
        </button>
        <button
          type="button"
          className="bg-gray-400 hover:bg-gray-600 text-white text-xs rounded-full px-4 py-1 font-bold shadow disabled:opacity-60 flex flex-row gap-2 items-center"
          disabled={!canBulkInactivate}
          onClick={() => onBulkSetActive(false)}
        >
          <PowerIcon className="w-4 h-4" />Dar de baja
        </button>
        <button
          type="button"
          className="bg-emerald-600 hover:bg-emerald-900 text-white text-xs rounded-full px-4 py-1 font-bold shadow disabled:opacity-60 flex flex-row gap-2 items-center"
          disabled={!canBulkActivate}
          onClick={() => onBulkSetActive(true)}
        >
          <PowerIcon className="w-4 h-4" />Activar
        </button>
      </div>
    </div>
  );
}

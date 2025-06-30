
"use client";
import UserRow from "./UserRow";

export default function UserManagementTable({
  users,
  planteles,
  adminsPlanteles,
  role,
  selection,
  selectedUserIds,
  allSelected,
  canAssignPlantel,
  onSelectUser,
  onSelectAll,
  onAssignPlantel,
  onApproveCandidate,
  onDocs,
  onFichaTecnica,
  onSetActive,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto mb-3">
      <table className="min-w-full table-auto border text-xs xs:text-sm rounded-lg">
        <thead>
          <tr className="bg-cyan-50 border-b border-cyan-100">
            <th className="min-w-[28px] px-2 py-2 text-center">
              <input
                type="checkbox"
                className="accent-cyan-600 w-4 h-4"
                checked={allSelected}
                onChange={e => onSelectAll(e.target.checked)}
                aria-label="Seleccionar todos"
              />
            </th>
            <th className="px-2 py-2">Usuario</th>
            <th className="px-2 py-2">Plantel</th>
            <th className="px-2 py-2">Estatus</th>
            <th className="px-2 py-2">Status</th>
            <th className="px-2 py-2">Documentos</th>
            <th className="px-2 py-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center text-slate-400 py-3">No se encontraron usuarios.</td>
            </tr>
          )}
          {users.map(u => (
            <UserRow
              key={u.id}
              user={u}
              planteles={planteles}
              adminsPlanteles={adminsPlanteles}
              role={role}
              selected={!!selection[u.id]}
              canAssignPlantel={canAssignPlantel}
              onSelect={checked => onSelectUser(u.id, checked)}
              onAssignPlantel={onAssignPlantel}
              onApproveCandidate={onApproveCandidate}
              onDocs={onDocs}
              onFichaTecnica={onFichaTecnica}
              onSetActive={onSetActive}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

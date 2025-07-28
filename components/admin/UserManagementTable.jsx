
"use client";
import UserRow from "./UserRow";
import { stepsExpediente } from "../stepMetaExpediente";

// List of keys for user-uploaded docs
const DOC_KEYS = stepsExpediente.filter(s => !s.isPlantelSelection && !s.adminUploadOnly).map(s => s.key);

export const CHECKLIST_KEYS = [
  ...DOC_KEYS,         // 11 user upload
  "proyectivos",       // always required, admin uploads
  "evaId",             // now named Evaluatest in UI
  "pathId",            // now named PATH in UI
];

export function getUserChecklistProgress(user) {
  let done = 0;
  let checklist = [];

  for (let k of DOC_KEYS) {
    const fulfilled = (user.checklistByType?.[k] && user.checklistByType[k].fulfilled) || false;
    checklist.push({ key: k, type: "doc", fulfilled });
    if (fulfilled) done++;
  }

  // Always show proyectivos (admin upload), style with type "admin-doc"
  const proyectivosUploaded = !!user.hasProyectivos;
  checklist.push({ key: "proyectivos", type: "admin-doc", fulfilled: proyectivosUploaded });
  if (proyectivosUploaded) done++;

  // "Evaluatest" field (evaId)
  const evaIdDone = !!user.evaId;
  checklist.push({ key: "evaId", type: "field", fulfilled: evaIdDone });
  if (evaIdDone) done++;

  // "PATH" field (pathId)
  const pathIdDone = !!user.pathId;
  checklist.push({ key: "pathId", type: "field", fulfilled: pathIdDone });
  if (pathIdDone) done++;

  const total = CHECKLIST_KEYS.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return { done, total, pct, checklist };
}

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
            <th className="px-2 py-2">Progreso docs</th>
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
              getUserChecklistProgress={getUserChecklistProgress}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

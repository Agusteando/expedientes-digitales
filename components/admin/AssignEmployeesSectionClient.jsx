
"use client";
import AssignEmployeesSection from "./AssignEmployeesSection";

/**
 * Thin client wrapper for AssignEmployeesSection.
 * Calls the assignment API directly from the client (cannot pass functions from server).
 */
export default function AssignEmployeesSectionClient(props) {
  async function assignUsersToPlantel({ userIds, plantelId }) {
    const res = await fetch("/api/admin/users/assign-plantel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ userIds, plantelId })
    });
    if (!res.ok) {
      let msg = "Error asignando empleados";
      try {
        const data = await res.json();
        msg = data.error || msg;
      } catch {
        msg = (await res.text()).slice(0, 240) + "...";
      }
      throw new Error(msg);
    }
  }
  return <AssignEmployeesSection {...props} onAssign={assignUsersToPlantel} />;
}

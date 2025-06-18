
"use client";
import AssignEmployeesSection from "./AssignEmployeesSection";

export default function AssignEmployeesSectionClient(props) {
  // Log what is received as props on the client
  if (typeof window !== "undefined") {
    // Avoid multiple logs on Fast Refresh / HMR etc
    if (!window.__assign_employees_section_client_logged) {
      window.__assign_employees_section_client_logged = true;
      // Only log first ~8 for brevity
      console.log("[DEBUG-client] AssignEmployeesSectionClient received (first 8):",
        Array.isArray(props.unassignedUsers) ? props.unassignedUsers.slice(0, 8) : props.unassignedUsers,
        "total:", Array.isArray(props.unassignedUsers) ? props.unassignedUsers.length : "no array"
      );
    }
  }
  return <AssignEmployeesSection {...props} onAssign={assignUsersToPlantel} />;
  
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
}

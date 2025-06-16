
"use client";

export async function assignAdminToPlantel({ adminId, plantelId, assigned }) {
  const res = await fetch(`/api/admin/planteles/${plantelId}/assign-admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      adminUserId: adminId,
      action: assigned ? "remove" : "add"
    })
  });
  if (!res.ok) {
    let msg = "Error asignando admin";
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {
      msg = (await res.text()).slice(0, 240) + "...";
    }
    throw new Error(msg);
  }
  return await res.json();
}

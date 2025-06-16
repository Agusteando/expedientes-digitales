
"use client";
import PlantelListAdminPanel from "./PlantelListAdminPanel";

/**
 * Client-only wrapper; use in Server Component (page, layout) to render
 * PlantelListAdminPanel with data from server.
 */
export default function PlantelListAdminPanelClient(props) {
  return <PlantelListAdminPanel {...props} />;
}

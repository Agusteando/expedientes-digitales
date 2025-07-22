
"use client";
import dynamic from "next/dynamic";
const PlantelAdminMatrixCrud = dynamic(() => import("./PlantelAdminMatrixCrud"));
export default function PlantelAdminMatrixCrudClient(props) {
  return <PlantelAdminMatrixCrud {...props} />;
}

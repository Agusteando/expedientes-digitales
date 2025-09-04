
"use client";
import dynamic from "next/dynamic";
const PuestoAdminPanel = dynamic(() => import("./PuestoAdminPanel"));
export default function PuestoAdminPanelClient(props) {
  return <PuestoAdminPanel {...props} />;
}

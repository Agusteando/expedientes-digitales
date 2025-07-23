
import { stepsExpediente } from "@/components/stepMetaExpediente";

/**
 * User-only progress: Only required steps that are NOT adminUploadOnly and NOT plantel selector.
 */
export function getUserProgress(checklist) {
  const userKeys = stepsExpediente.filter(
    s => !s.adminUploadOnly && !s.isPlantelSelection
  ).map(s => s.key);
  const items = userKeys.map(key => checklist.find(i => i.type === key));
  const done = items.filter(i => i && i.fulfilled).length;
  return { done, total: userKeys.length, pct: userKeys.length ? done / userKeys.length : 0, complete: done === userKeys.length };
}

/**
 * Admin-only progress: Only proyectivos matters.
 */
export function isProyectivosComplete(documents) {
  // documents: array of doc objects for the user
  const has = documents && documents.some(d => d.type === "proyectivos" && d.status === "ACCEPTED");
  return !!has;
}

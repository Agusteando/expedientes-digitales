
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";

export async function writeFileToPublicUploads(file, meta = {}) {
  // Use stable path: /public/uploads/[userId]/[type]/
  const ext = (file.name || "pdf").split(".").pop() || "pdf";
  const filename = `doc_${Date.now()}.${ext}`;
  const relDir = `uploads/${meta.userId}/${meta.docType}`;
  const absDir = join(process.cwd(), "public", relDir);
  await mkdir(absDir, { recursive: true });
  const arrayBuffer = await file.arrayBuffer();
  await writeFile(join(absDir, filename), Buffer.from(arrayBuffer));
  const url = "/" + [relDir, filename].join("/");
  return { url, metadata: { ...meta, filename } };
}

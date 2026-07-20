import { NextRequest, NextResponse } from "next/server";
import { FileRepository } from "@/repositories/file.repository";
import { uploadFile } from "@/services/s3";
import { getSession } from "@/lib/auth";
import path from "path";

export const config = {
  api: { bodyParser: false },
};

export const maxDuration = 300;

const MAX_SIZE = 10 * 1024 * 1024 * 1024; // 10GB
const ALLOWED_MIME_PREFIXES = ["image/", "video/", "audio/", "application/pdf", "text/", "application/"];

function sanitizeFilename(name: string): string {
  return path.basename(name).replace(/[^a-zA-Z0-9._\-]/g, "_");
}

function getUploadPrefix(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "uploads/images";
  if (mimeType.startsWith("video/")) return "uploads/videos";
  if (mimeType.startsWith("audio/")) return "uploads/audio";
  return "uploads/documents";
}

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folderId = formData.get("folderId") as string | null;

  if (!file || !folderId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large" }, { status: 413 });
  if (!ALLOWED_MIME_PREFIXES.some((p) => file.type.startsWith(p))) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
  }

  const safe = sanitizeFilename(file.name);
  const { nanoid } = await import("@/utils/nanoid");
  const key = `${getUploadPrefix(file.type)}/${nanoid()}_${safe}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadFile(key, buffer, file.type || "application/octet-stream");

  const saved = await FileRepository.create({
    name: safe,
    folderId,
    key,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
  });

  return NextResponse.json({ file: saved }, { status: 201 });
}

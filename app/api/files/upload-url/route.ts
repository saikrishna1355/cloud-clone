import { NextRequest, NextResponse } from "next/server";
import { getUploadPresignedUrl } from "@/services/s3";
import { getSession } from "@/lib/auth";
import { nanoid } from "@/utils/nanoid";
import path from "path";

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

  const { name, mimeType, size, folderId } = await req.json();

  if (!name || !mimeType || !size || !folderId)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  if (!ALLOWED_MIME_PREFIXES.some((p) => mimeType.startsWith(p)))
    return NextResponse.json({ error: "File type not allowed" }, { status: 415 });

  const safe = sanitizeFilename(name);
  const key = `${getUploadPrefix(mimeType)}/${nanoid()}_${safe}`;
  const url = await getUploadPresignedUrl(key, mimeType, 3600);

  return NextResponse.json({ url, key, name: safe });
}

import { NextRequest, NextResponse } from "next/server";
import { FileRepository } from "@/repositories/file.repository";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, name, mimeType, size, folderId } = await req.json();

  if (!key || !name || !mimeType || !size || !folderId)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const saved = await FileRepository.create({ name, folderId, key, size, mimeType });
  return NextResponse.json({ file: saved }, { status: 201 });
}

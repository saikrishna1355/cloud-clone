import { NextRequest, NextResponse } from "next/server";
import { FileRepository } from "@/repositories/file.repository";
import { deleteFile, getPresignedUrl } from "@/services/s3";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const file = await FileRepository.findById(id);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const url = await getPresignedUrl(file.key);
  return NextResponse.json({ file, url });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const patch = await req.json();
  const file = await FileRepository.update(id, patch);
  return NextResponse.json(file);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const file = await FileRepository.findById(id);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteFile(file.key);
  await FileRepository.delete(id);
  return NextResponse.json({ ok: true });
}

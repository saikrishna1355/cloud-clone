import { NextRequest, NextResponse } from "next/server";
import { NoteRepository } from "@/repositories/note.repository";
import { downloadFile, uploadFile, deleteFile } from "@/services/s3";
import { getSession } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const note = await NoteRepository.findById(id);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const buf = await downloadFile(note.file).catch(() => Buffer.from(""));
  return NextResponse.json({ note, content: buf.toString("utf-8") });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { content, ...patch } = await req.json();
  const note = await NoteRepository.findById(id);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (content !== undefined) {
    await uploadFile(note.file, content, "text/markdown");
  }
  const updated = await NoteRepository.update(id, patch);
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const note = await NoteRepository.findById(id);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteFile(note.file).catch(() => {});
  await NoteRepository.delete(id);
  return NextResponse.json({ ok: true });
}

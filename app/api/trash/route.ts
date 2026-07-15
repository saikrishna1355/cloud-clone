import { NextResponse } from "next/server";
import { FileRepository } from "@/repositories/file.repository";
import { NoteRepository } from "@/repositories/note.repository";
import { deleteFile } from "@/services/s3";
import { getSession } from "@/lib/auth";

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [files, notes] = await Promise.all([FileRepository.findTrashed(), NoteRepository.findTrashed()]);
  return NextResponse.json({ files, notes });
}

export async function DELETE() {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [files, notes] = await Promise.all([FileRepository.findTrashed(), NoteRepository.findTrashed()]);
  await Promise.all([
    ...files.map(async (f) => { await deleteFile(f.key); await FileRepository.delete(f.id); }),
    ...notes.map(async (n) => { await deleteFile(n.file).catch(() => {}); await NoteRepository.delete(n.id); }),
  ]);
  return NextResponse.json({ ok: true });
}

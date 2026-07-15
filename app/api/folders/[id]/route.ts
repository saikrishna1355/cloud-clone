import { NextRequest, NextResponse } from "next/server";
import { FolderRepository } from "@/repositories/folder.repository";
import { FileRepository } from "@/repositories/file.repository";
import { NoteRepository } from "@/repositories/note.repository";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const patch = await req.json();
  const folder = await FolderRepository.update(id, patch);
  return NextResponse.json(folder);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (id === "root") return NextResponse.json({ error: "Cannot delete root" }, { status: 400 });

  // Recursively collect all descendant folder ids
  const all = await FolderRepository.findAll();
  const toDelete = new Set<string>();
  const queue = [id];
  while (queue.length) {
    const cur = queue.shift()!;
    toDelete.add(cur);
    all.filter((f) => f.parentId === cur).forEach((f) => queue.push(f.id));
  }

  await Promise.all([...toDelete].map((fid) => FolderRepository.delete(fid)));

  // Trash files and notes in deleted folders
  const [files, notes] = await Promise.all([FileRepository.findAll(), NoteRepository.findAll()]);
  const now = new Date().toISOString();
  await Promise.all([
    ...files.filter((f) => toDelete.has(f.folderId)).map((f) => FileRepository.update(f.id, { trashedAt: now })),
    ...notes.filter((n) => toDelete.has(n.folderId)).map((n) => NoteRepository.update(n.id, { trashedAt: now })),
  ]);

  return NextResponse.json({ ok: true });
}

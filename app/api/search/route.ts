import { NextRequest, NextResponse } from "next/server";
import { FolderRepository } from "@/repositories/folder.repository";
import { FileRepository } from "@/repositories/file.repository";
import { NoteRepository } from "@/repositories/note.repository";
import { getSession } from "@/lib/auth";
import { SearchResult } from "@/types";

export async function GET(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = req.nextUrl.searchParams.get("q")?.toLowerCase().trim();
  if (!q) return NextResponse.json([]);

  const [folders, files, notes] = await Promise.all([
    FolderRepository.findAll(),
    FileRepository.findAll(),
    NoteRepository.findAll(),
  ]);

  const results: SearchResult[] = [
    ...folders.filter((f) => f.name.toLowerCase().includes(q)).map((f) => ({ id: f.id, name: f.name, type: "folder" as const })),
    ...files.filter((f) => !f.trashedAt && f.name.toLowerCase().includes(q)).map((f) => ({ id: f.id, name: f.name, type: "file" as const, folderId: f.folderId })),
    ...notes.filter((n) => !n.trashedAt && n.title.toLowerCase().includes(q)).map((n) => ({ id: n.id, name: n.title, type: "note" as const, folderId: n.folderId })),
  ];

  return NextResponse.json(results);
}

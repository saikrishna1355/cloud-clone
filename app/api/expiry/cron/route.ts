import { NextRequest, NextResponse } from "next/server";
import { FileRepository } from "@/repositories/file.repository";
import { NoteRepository } from "@/repositories/note.repository";
import { FolderRepository } from "@/repositories/folder.repository";

export async function GET(req: NextRequest) {
  // Vercel signs cron requests with this header
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const [files, notes, folders] = await Promise.all([
    FileRepository.findAll(),
    NoteRepository.findAll(),
    FolderRepository.findAll(),
  ]);

  const expiredFiles = files.filter((f) => !f.trashedAt && f.expiresAt && f.expiresAt < now);
  const expiredNotes = notes.filter((n) => !n.trashedAt && n.expiresAt && n.expiresAt < now);
  const expiredFolders = folders.filter((f) => f.id !== "root" && f.expiresAt && f.expiresAt < now);

  await Promise.all([
    ...expiredFiles.map((f) => FileRepository.update(f.id, { trashedAt: now })),
    ...expiredNotes.map((n) => NoteRepository.update(n.id, { trashedAt: now })),
    ...expiredFolders.map((f) => FolderRepository.delete(f.id)),
  ]);

  console.log(`[cron] Expired: ${expiredFiles.length} files, ${expiredNotes.length} notes, ${expiredFolders.length} folders`);

  return NextResponse.json({
    ok: true,
    trashed: expiredFiles.length + expiredNotes.length + expiredFolders.length,
    at: now,
  });
}

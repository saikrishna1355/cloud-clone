import { FolderRepository } from "@/repositories/folder.repository";
import { FileRepository } from "@/repositories/file.repository";
import { NoteRepository } from "@/repositories/note.repository";
import { DriveView } from "@/components/drive/drive-view";

export default async function HomePage() {
  const [allFolders, allFiles, allNotes] = await Promise.all([
    FolderRepository.findAll(),
    FileRepository.findAll(),
    NoteRepository.findAll(),
  ]);

  const folders = allFolders.filter((f) => f.parentId === "root");
  const files = allFiles.filter((f) => f.folderId === "root" && !f.trashedAt);
  const notes = allNotes.filter((n) => n.folderId === "root" && !n.trashedAt);

  return <DriveView folderId="root" folders={folders} files={files} notes={notes} />;
}

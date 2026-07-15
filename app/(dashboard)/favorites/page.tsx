import { FolderRepository } from "@/repositories/folder.repository";
import { FileRepository } from "@/repositories/file.repository";
import { NoteRepository } from "@/repositories/note.repository";
import { DriveView } from "@/components/drive/drive-view";

export default async function FavoritesPage() {
  const [allFolders, allFiles, allNotes] = await Promise.all([
    FolderRepository.findAll(),
    FileRepository.findAll(),
    NoteRepository.findAll(),
  ]);

  const folders = allFolders.filter((f) => f.isFavorite);
  const files = allFiles.filter((f) => f.isFavorite && !f.trashedAt);
  const notes = allNotes.filter((n) => n.isFavorite && !n.trashedAt);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Favorites</h1>
      <DriveView folderId="root" folders={folders} files={files} notes={notes} />
    </div>
  );
}

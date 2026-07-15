import { FileRepository } from "@/repositories/file.repository";
import { NoteRepository } from "@/repositories/note.repository";
import { DriveView } from "@/components/drive/drive-view";

export default async function RecentPage() {
  const [allFiles, allNotes] = await Promise.all([
    FileRepository.findAll(),
    NoteRepository.findAll(),
  ]);

  const files = allFiles
    .filter((f) => !f.trashedAt)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 20);

  const notes = allNotes
    .filter((n) => !n.trashedAt)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 20);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Recent</h1>
      <DriveView folderId="root" folders={[]} files={files} notes={notes} />
    </div>
  );
}

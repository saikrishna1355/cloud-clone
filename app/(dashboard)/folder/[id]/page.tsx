import { notFound } from "next/navigation";
import { FolderRepository } from "@/repositories/folder.repository";
import { FileRepository } from "@/repositories/file.repository";
import { NoteRepository } from "@/repositories/note.repository";
import { DriveView } from "@/components/drive/drive-view";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage,
} from "@/components/ui/breadcrumb";

async function buildBreadcrumb(folderId: string, allFolders: Awaited<ReturnType<typeof FolderRepository.findAll>>) {
  const crumbs: { id: string; name: string }[] = [];
  let current = allFolders.find((f) => f.id === folderId);
  while (current) {
    crumbs.unshift({ id: current.id, name: current.name });
    current = current.parentId ? allFolders.find((f) => f.id === current!.parentId) : undefined;
  }
  return crumbs;
}

export default async function FolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [allFolders, allFiles, allNotes] = await Promise.all([
    FolderRepository.findAll(),
    FileRepository.findAll(),
    NoteRepository.findAll(),
  ]);

  const folder = allFolders.find((f) => f.id === id);
  if (!folder) notFound();

  const folders = allFolders.filter((f) => f.parentId === id);
  const files = allFiles.filter((f) => f.folderId === id && !f.trashedAt);
  const notes = allNotes.filter((n) => n.folderId === id && !n.trashedAt);
  const crumbs = await buildBreadcrumb(id, allFolders);

  const breadcrumb = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
        {crumbs.slice(1).map((c, i) => (
          <>
            <BreadcrumbSeparator key={`sep-${c.id}`} />
            <BreadcrumbItem key={c.id}>
              {i === crumbs.length - 2 ? (
                <BreadcrumbPage>{c.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/folder/${c.id}`}>{c.name}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );

  return <DriveView folderId={id} folders={folders} files={files} notes={notes} breadcrumb={breadcrumb} />;
}

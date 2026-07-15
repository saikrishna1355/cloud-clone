"use client";

import { useState } from "react";
import { Folder, DriveFile, Note } from "@/types";
import { FolderCard } from "./folder-card";
import { FileCard } from "./file-card";
import { NoteCard } from "./note-card";
import { Toolbar } from "./toolbar";
import { CloudIcon, Download, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface DriveViewProps {
  folderId: string;
  folders: Folder[];
  files: DriveFile[];
  notes: Note[];
  breadcrumb?: React.ReactNode;
}

export function DriveView({ folderId, folders, files, notes, breadcrumb }: DriveViewProps) {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const isEmpty = folders.length === 0 && files.length === 0 && notes.length === 0;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function downloadSelected() {
    const selectedFiles = files.filter((f) => selected.has(f.id));
    if (!selectedFiles.length) { toast.info("Select files to download"); return; }
    toast.info(`Downloading ${selectedFiles.length} file(s)…`);
    for (const file of selectedFiles) {
      const a = document.createElement("a");
      a.href = `/api/files/download?id=${file.id}`;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await new Promise((r) => setTimeout(r, 300));
    }
    clearSelection();
  }

  async function trashSelected() {
    if (!confirm(`Move ${selected.size} item(s) to trash?`)) return;
    const now = new Date().toISOString();
    const selectedFiles = files.filter((f) => selected.has(f.id));
    const selectedNotes = notes.filter((n) => selected.has(n.id));
    await Promise.all([
      ...selectedFiles.map((f) => fetch(`/api/files/${f.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trashedAt: now }),
      })),
      ...selectedNotes.map((n) => fetch(`/api/notes/${n.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trashedAt: now }),
      })),
    ]);
    toast.success(`${selected.size} item(s) moved to trash`);
    clearSelection();
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full">
      {breadcrumb && <div className="px-4 pt-3 pb-1 text-sm">{breadcrumb}</div>}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 border-b border-primary/20">
          <span className="text-sm font-medium text-primary">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={downloadSelected}>
              <Download className="h-4 w-4 mr-1.5" /> Download
            </Button>
            <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={trashSelected}>
              <Trash2 className="h-4 w-4 mr-1.5" /> Trash
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Toolbar folderId={folderId} view={view} onViewChange={setView} />

      <div className="flex-1 overflow-auto p-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <CloudIcon className="h-8 w-8 opacity-40" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Nothing here yet</p>
              <p className="text-sm mt-0.5">Upload files, create folders, or write notes</p>
            </div>
          </div>
        ) : (
          <div className={cn(
            view === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
              : "flex flex-col gap-1"
          )}>
            {folders.map((f) => (
              <FolderCard key={f.id} folder={f} view={view} />
            ))}
            {files.map((f) => (
              <FileCard key={f.id} file={f} view={view}
                selected={selected.has(f.id)} onSelect={() => toggleSelect(f.id)}
              />
            ))}
            {notes.map((n) => (
              <NoteCard key={n.id} note={n} view={view} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

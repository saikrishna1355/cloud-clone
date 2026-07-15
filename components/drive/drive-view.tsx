"use client";

import { useState } from "react";
import { Folder, DriveFile, Note } from "@/types";
import { FolderCard } from "./folder-card";
import { FileCard } from "./file-card";
import { NoteCard } from "./note-card";
import { Toolbar } from "./toolbar";
import { CloudIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DriveViewProps {
  folderId: string;
  folders: Folder[];
  files: DriveFile[];
  notes: Note[];
  breadcrumb?: React.ReactNode;
}

export function DriveView({ folderId, folders, files, notes, breadcrumb }: DriveViewProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const isEmpty = folders.length === 0 && files.length === 0 && notes.length === 0;

  return (
    <div className="flex flex-col h-full">
      {breadcrumb && (
        <div className="px-4 pt-3 pb-1 text-sm">{breadcrumb}</div>
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
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
              : "flex flex-col gap-1"
          )}>
            {folders.map((f) => <FolderCard key={f.id} folder={f} view={view} />)}
            {files.map((f) => <FileCard key={f.id} file={f} view={view} />)}
            {notes.map((n) => <NoteCard key={n.id} note={n} view={view} />)}
          </div>
        )}
      </div>
    </div>
  );
}

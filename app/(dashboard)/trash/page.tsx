"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, RotateCcw, FileText } from "lucide-react";
import { DriveFile, Note } from "@/types";
import { Button } from "@/components/ui/button";
import { FileIcon, formatBytes } from "@/components/drive/file-icon";

export default function TrashPage() {
  const router = useRouter();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  async function load() {
    const res = await fetch("/api/trash");
    const data = await res.json();
    setFiles(data.files ?? []);
    setNotes(data.notes ?? []);
  }

  useEffect(() => { load(); }, []);

  async function restoreFile(id: string) {
    await fetch(`/api/files/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trashedAt: null }),
    });
    toast.success("Restored"); load();
  }

  async function deleteFile(id: string) {
    await fetch(`/api/files/${id}`, { method: "DELETE" });
    toast.success("Permanently deleted"); load();
  }

  async function restoreNote(id: string) {
    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trashedAt: null }),
    });
    toast.success("Restored"); load();
  }

  async function deleteNote(id: string) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    toast.success("Permanently deleted"); load();
  }

  async function emptyTrash() {
    if (!confirm("Permanently delete all trashed items?")) return;
    await fetch("/api/trash", { method: "DELETE" });
    toast.success("Trash emptied"); load();
  }

  const isEmpty = files.length === 0 && notes.length === 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Trash2 className="h-6 w-6" /> Trash
        </h1>
        {!isEmpty && (
          <Button variant="destructive" size="sm" onClick={emptyTrash}>Empty Trash</Button>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Trash2 className="h-12 w-12 mb-3 opacity-30" />
          <p>Trash is empty</p>
        </div>
      ) : (
        <div className="space-y-1">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card">
              <FileIcon mimeType={f.mimeType} className="h-5 w-5 text-blue-500 shrink-0" />
              <span className="flex-1 text-sm truncate">{f.name}</span>
              <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
              <Button variant="ghost" size="sm" onClick={() => restoreFile(f.id)}><RotateCcw className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteFile(f.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {notes.map((n) => (
            <div key={n.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card">
              <FileText className="h-5 w-5 text-green-500 shrink-0" />
              <span className="flex-1 text-sm truncate">{n.title}</span>
              <Button variant="ghost" size="sm" onClick={() => restoreNote(n.id)}><RotateCcw className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteNote(n.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

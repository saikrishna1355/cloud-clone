"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, FolderPlus, Upload, FileText, LayoutGrid, List, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  folderId: string;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
}

export function Toolbar({ folderId, view, onViewChange }: ToolbarProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [folderDialog, setFolderDialog] = useState(false);
  const [noteDialog, setNoteDialog] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`);
  }

  async function createFolder() {
    if (!folderName.trim()) return;
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: folderName.trim(), parentId: folderId }),
    });
    if (res.ok) { toast.success("Folder created"); setFolderDialog(false); setFolderName(""); router.refresh(); }
    else toast.error("Failed to create folder");
  }

  async function createNote() {
    if (!noteTitle.trim()) return;
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: noteTitle.trim(), folderId }),
    });
    if (res.ok) {
      const note = await res.json();
      toast.success("Note created"); setNoteDialog(false); setNoteTitle("");
      router.push(`/notes/${note.id}`);
    } else toast.error("Failed to create note");
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setFabOpen(false);
    try {
      for (const file of files) {
        const res = await fetch("/api/files/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, mimeType: file.type || "application/octet-stream", size: file.size, folderId }),
        });
        if (!res.ok) { toast.error(`Failed to upload ${file.name}`); continue; }
        const { uploadUrl } = await res.json();
        await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        toast.success(`Uploaded ${file.name}`);
      }
      router.refresh();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files, folders, notes…"
              className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>

        {/* Desktop action buttons */}
        <div className="hidden md:flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-9" onClick={() => setFolderDialog(true)}>
            <FolderPlus className="h-4 w-4 mr-1.5" /> New Folder
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-1.5" /> {uploading ? "Uploading…" : "Upload"}
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => setNoteDialog(true)}>
            <FileText className="h-4 w-4 mr-1.5" /> New Note
          </Button>
        </div>

        {/* View toggle */}
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9 rounded-none", view === "grid" && "bg-muted")}
            onClick={() => onViewChange("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9 rounded-none", view === "list" && "bg-muted")}
            onClick={() => onViewChange("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} />
      </div>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
        {fabOpen && (
          <>
            <div className="fixed inset-0 z-[-1]" onClick={() => setFabOpen(false)} />
            {[
              { icon: FolderPlus, label: "New Folder", action: () => { setFabOpen(false); setFolderDialog(true); } },
              { icon: Upload, label: uploading ? "Uploading…" : "Upload File", action: () => { setFabOpen(false); fileRef.current?.click(); } },
              { icon: FileText, label: "New Note", action: () => { setFabOpen(false); setNoteDialog(true); } },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                className="flex items-center gap-2 bg-card border shadow-lg rounded-full px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </button>
            ))}
          </>
        )}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform active:scale-95"
        >
          {fabOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>

      {/* Dialogs */}
      <Dialog open={folderDialog} onOpenChange={setFolderDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Folder name</Label>
            <Input value={folderName} onChange={(e) => setFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createFolder()} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialog(false)}>Cancel</Button>
            <Button onClick={createFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Note</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createNote()} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(false)}>Cancel</Button>
            <Button onClick={createNote}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

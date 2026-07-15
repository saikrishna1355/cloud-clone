"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Pencil, Trash2, Star, Clock } from "lucide-react";
import { Note } from "@/types";
import { SetExpiryDialog, ExpiryBadge } from "./expiry-dialog";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  view: "grid" | "list";
}

export function NoteCard({ note, view }: NoteCardProps) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [expiryOpen, setExpiryOpen] = useState(false);
  const [title, setTitle] = useState(note.title);

  async function rename() {
    if (!title.trim() || title === note.title) { setRenameOpen(false); return; }
    const res = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    if (res.ok) { toast.success("Renamed"); router.refresh(); } else toast.error("Failed to rename");
    setRenameOpen(false);
  }

  async function trash() {
    await fetch(`/api/notes/${note.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trashedAt: new Date().toISOString() }),
    });
    toast.success("Moved to trash"); router.refresh();
  }

  async function toggleFavorite() {
    await fetch(`/api/notes/${note.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !note.isFavorite }),
    });
    router.refresh();
  }

  async function saveExpiry(expiresAt: string | null) {
    await fetch(`/api/notes/${note.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresAt }),
    });
  }

  const content = view === "grid" ? (
    <div
      className="group flex flex-col items-center gap-2 p-3 rounded-xl border bg-card hover:bg-muted/60 hover:border-primary/20 hover:shadow-sm transition-all duration-150 cursor-pointer select-none"
      onDoubleClick={() => router.push(`/notes/${note.id}`)}
    >
      <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center mt-1">
        <FileText className="h-7 w-7 text-green-500" />
      </div>
      <p className="text-xs font-medium truncate w-full text-center leading-tight">{note.title}</p>
      <div className="flex items-center gap-1 h-4">
        <ExpiryBadge expiresAt={note.expiresAt} />
        {note.isFavorite && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
      </div>
    </div>
  ) : (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card hover:bg-muted/60 hover:border-primary/20 transition-all cursor-pointer select-none"
      onDoubleClick={() => router.push(`/notes/${note.id}`)}
    >
      <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
        <FileText className="h-4 w-4 text-green-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{note.title}</p>
        <p className="text-xs text-muted-foreground">{new Date(note.updatedAt).toLocaleDateString()}</p>
      </div>
      <ExpiryBadge expiresAt={note.expiresAt} />
      {note.isFavorite && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />}
    </div>
  );

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{content}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => router.push(`/notes/${note.id}`)}>Open</ContextMenuItem>
          <ContextMenuItem onClick={() => { setTitle(note.title); setRenameOpen(true); }}>
            <Pencil className="h-4 w-4 mr-2" /> Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={toggleFavorite}>
            <Star className="h-4 w-4 mr-2" /> {note.isFavorite ? "Unfavorite" : "Favorite"}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setExpiryOpen(true)}>
            <Clock className="h-4 w-4 mr-2" /> Set Expiry
          </ContextMenuItem>
          <ContextMenuItem className="text-destructive" onClick={trash}>
            <Trash2 className="h-4 w-4 mr-2" /> Move to Trash
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Note</DialogTitle></DialogHeader>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && rename()} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={rename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SetExpiryDialog open={expiryOpen} onOpenChange={setExpiryOpen} currentExpiry={note.expiresAt} onSave={saveExpiry} />
    </>
  );
}

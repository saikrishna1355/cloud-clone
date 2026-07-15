"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Folder, Pencil, Trash2, Star, Clock } from "lucide-react";
import { Folder as FolderType } from "@/types";
import { SetExpiryDialog, ExpiryBadge } from "./expiry-dialog";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FolderCardProps {
  folder: FolderType;
  view: "grid" | "list";
}

export function FolderCard({ folder, view }: FolderCardProps) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [expiryOpen, setExpiryOpen] = useState(false);
  const [name, setName] = useState(folder.name);

  async function rename() {
    if (!name.trim() || name === folder.name) { setRenameOpen(false); return; }
    const res = await fetch(`/api/folders/${folder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) { toast.success("Renamed"); router.refresh(); }
    else toast.error("Failed to rename");
    setRenameOpen(false);
  }

  async function toggleFavorite() {
    await fetch(`/api/folders/${folder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !folder.isFavorite }),
    });
    router.refresh();
  }

  async function deleteFolder() {
    if (!confirm(`Delete "${folder.name}" and all its contents?`)) return;
    const res = await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); router.refresh(); }
    else toast.error("Failed to delete");
  }

  async function saveExpiry(expiresAt: string | null) {
    await fetch(`/api/folders/${folder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresAt }),
    });
  }

  const content = (
    <div
      className={cn(
        "group flex items-center gap-3 cursor-pointer rounded-lg border bg-card hover:bg-muted/50 transition-colors",
        view === "grid" ? "flex-col p-4 text-center" : "px-4 py-3"
      )}
      onDoubleClick={() => router.push(`/folder/${folder.id}`)}
    >
      <Folder className={cn("text-yellow-500 shrink-0", view === "grid" ? "h-10 w-10" : "h-5 w-5")} />
      <span className="text-sm font-medium truncate flex-1">{folder.name}</span>
      <ExpiryBadge expiresAt={folder.expiresAt} />
      {folder.isFavorite && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />}
    </div>
  );

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{content}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => router.push(`/folder/${folder.id}`)}>Open</ContextMenuItem>
          <ContextMenuItem onClick={() => { setName(folder.name); setRenameOpen(true); }}>
            <Pencil className="h-4 w-4 mr-2" /> Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={toggleFavorite}>
            <Star className="h-4 w-4 mr-2" /> {folder.isFavorite ? "Unfavorite" : "Favorite"}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setExpiryOpen(true)}>
            <Clock className="h-4 w-4 mr-2" /> Set Expiry
          </ContextMenuItem>
          <ContextMenuItem className="text-destructive" onClick={deleteFolder}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Folder</DialogTitle></DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && rename()} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={rename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SetExpiryDialog
        open={expiryOpen}
        onOpenChange={setExpiryOpen}
        currentExpiry={folder.expiresAt}
        onSave={saveExpiry}
      />
    </>
  );
}

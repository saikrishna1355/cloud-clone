"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Pencil, Trash2, Star, Eye, Clock } from "lucide-react";
import { DriveFile } from "@/types";
import { FileIcon, formatBytes } from "./file-icon";
import { SetExpiryDialog, ExpiryBadge } from "./expiry-dialog";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FileCardProps {
  file: DriveFile;
  view: "grid" | "list";
}

export function FileCard({ file, view }: FileCardProps) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [expiryOpen, setExpiryOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [name, setName] = useState(file.name);

  async function getUrl(): Promise<string> {
    const res = await fetch(`/api/files/${file.id}`);
    const { url } = await res.json();
    return url;
  }

  async function download() {
    const url = await getUrl();
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
  }

  async function preview() {
    const url = await getUrl();
    setPreviewUrl(url);
    setPreviewOpen(true);
  }

  async function rename() {
    if (!name.trim() || name === file.name) { setRenameOpen(false); return; }
    const res = await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) { toast.success("Renamed"); router.refresh(); }
    else toast.error("Failed to rename");
    setRenameOpen(false);
  }

  async function trash() {
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trashedAt: new Date().toISOString() }),
    });
    toast.success("Moved to trash");
    router.refresh();
  }

  async function toggleFavorite() {
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !file.isFavorite }),
    });
    router.refresh();
  }

  async function saveExpiry(expiresAt: string | null) {
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresAt }),
    });
  }

  const isPreviewable = file.mimeType.startsWith("image/") || file.mimeType === "application/pdf";

  const content = (
    <div className={cn(
      "group flex items-center gap-3 cursor-pointer rounded-lg border bg-card hover:bg-muted/50 transition-colors",
      view === "grid" ? "flex-col p-4 text-center" : "px-4 py-3"
    )}>
      <FileIcon mimeType={file.mimeType} className={cn("text-blue-500 shrink-0", view === "grid" ? "h-10 w-10" : "h-5 w-5")} />
      <div className={cn("flex-1 min-w-0", view === "grid" && "w-full")}>
        <p className="text-sm font-medium truncate">{file.name}</p>
        {view === "list" && <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>}
      </div>
      <ExpiryBadge expiresAt={file.expiresAt} />
      {view === "list" && (
        <Badge variant="secondary" className="text-xs shrink-0">{formatBytes(file.size)}</Badge>
      )}
      {file.isFavorite && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />}
    </div>
  );

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{content}</ContextMenuTrigger>
        <ContextMenuContent>
          {isPreviewable && (
            <ContextMenuItem onClick={preview}><Eye className="h-4 w-4 mr-2" /> Preview</ContextMenuItem>
          )}
          <ContextMenuItem onClick={download}><Download className="h-4 w-4 mr-2" /> Download</ContextMenuItem>
          <ContextMenuItem onClick={() => { setName(file.name); setRenameOpen(true); }}>
            <Pencil className="h-4 w-4 mr-2" /> Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={toggleFavorite}>
            <Star className="h-4 w-4 mr-2" /> {file.isFavorite ? "Unfavorite" : "Favorite"}
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
          <DialogHeader><DialogTitle>Rename File</DialogTitle></DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && rename()} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={rename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{file.name}</DialogTitle></DialogHeader>
          {file.mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={file.name} className="max-h-[70vh] object-contain mx-auto" />
          ) : (
            <iframe src={previewUrl} className="w-full h-[70vh]" title={file.name} />
          )}
        </DialogContent>
      </Dialog>

      <SetExpiryDialog
        open={expiryOpen}
        onOpenChange={setExpiryOpen}
        currentExpiry={file.expiresAt}
        onSave={saveExpiry}
      />
    </>
  );
}

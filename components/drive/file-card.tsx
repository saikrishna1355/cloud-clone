"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Pencil, Trash2, Star, Eye, Clock } from "lucide-react";
import { DriveFile } from "@/types";
import { FileIcon, formatBytes } from "./file-icon";
import { SetExpiryDialog, ExpiryBadge } from "./expiry-dialog";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    a.href = url; a.download = file.name; a.click();
  }

  async function preview() {
    const url = await getUrl();
    setPreviewUrl(url); setPreviewOpen(true);
  }

  async function rename() {
    if (!name.trim() || name === file.name) { setRenameOpen(false); return; }
    const res = await fetch(`/api/files/${file.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) { toast.success("Renamed"); router.refresh(); } else toast.error("Failed to rename");
    setRenameOpen(false);
  }

  async function trash() {
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trashedAt: new Date().toISOString() }),
    });
    toast.success("Moved to trash"); router.refresh();
  }

  async function toggleFavorite() {
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !file.isFavorite }),
    });
    router.refresh();
  }

  async function saveExpiry(expiresAt: string | null) {
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresAt }),
    });
  }

  const isPreviewable = file.mimeType.startsWith("image/") || file.mimeType === "application/pdf";

  const content = view === "grid" ? (
    <div className="group flex flex-col items-center gap-2 p-3 rounded-xl border bg-card hover:bg-muted/60 hover:border-primary/20 hover:shadow-sm transition-all duration-150 cursor-pointer select-none">
      <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mt-1">
        <FileIcon mimeType={file.mimeType} className="h-7 w-7 text-blue-500" />
      </div>
      <p className="text-xs font-medium truncate w-full text-center leading-tight">{file.name}</p>
      <div className="flex items-center gap-1 h-4">
        <ExpiryBadge expiresAt={file.expiresAt} />
        {file.isFavorite && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card hover:bg-muted/60 hover:border-primary/20 transition-all cursor-pointer select-none">
      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
        <FileIcon mimeType={file.mimeType} className="h-4 w-4 text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
      </div>
      <ExpiryBadge expiresAt={file.expiresAt} />
      {file.isFavorite && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />}
    </div>
  );

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{content}</ContextMenuTrigger>
        <ContextMenuContent>
          {isPreviewable && <ContextMenuItem onClick={preview}><Eye className="h-4 w-4 mr-2" /> Preview</ContextMenuItem>}
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
            <img src={previewUrl} alt={file.name} className="max-h-[70vh] object-contain mx-auto rounded-lg" />
          ) : (
            <iframe src={previewUrl} className="w-full h-[70vh] rounded-lg" title={file.name} />
          )}
        </DialogContent>
      </Dialog>

      <SetExpiryDialog open={expiryOpen} onOpenChange={setExpiryOpen} currentExpiry={file.expiresAt} onSave={saveExpiry} />
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Pencil, Trash2, Star, Eye, Clock } from "lucide-react";
import { DriveFile } from "@/types";
import { FileIcon, formatBytes } from "./file-icon";
import { SetExpiryDialog, ExpiryBadge } from "./expiry-dialog";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileCardProps {
  file: DriveFile;
  view: "grid" | "list";
  selected?: boolean;
  onSelect?: () => void;
}

export function FileCard({ file, view, selected, onSelect }: FileCardProps) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [expiryOpen, setExpiryOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [name, setName] = useState(file.name);
  const isPreviewable = file.mimeType.startsWith("image/") || file.mimeType === "application/pdf";
  const isImage = file.mimeType.startsWith("image/");

  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!isImage) return;
    fetch(`/api/files/${file.id}`)
      .then((r) => r.json())
      .then(({ url }) => setThumbUrl(url))
      .catch(() => {});
  }, [file.id, isImage]);

  function download() {
    const a = document.createElement("a");
    a.href = `/api/files/download?id=${file.id}`;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function preview() {
    const res = await fetch(`/api/files/${file.id}`);
    const { url } = await res.json();
    setPreviewUrl(url);
    setPreviewOpen(true);
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

  const content = view === "grid" ? (
    <div
      onClick={() => isPreviewable ? preview() : download()}
      className={cn(
        "group relative flex flex-col items-center gap-2 p-3 rounded-xl border bg-card hover:bg-muted/60 hover:border-primary/20 hover:shadow-sm transition-all duration-150 cursor-pointer select-none",
        selected && "border-primary bg-primary/5"
      )}
    >
      {/* Checkbox */}
      <div
        className={cn(
          "absolute top-2 left-2 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all z-10",
          selected ? "bg-primary border-primary" : "border-muted-foreground/50 bg-card/80 group-hover:border-primary/70"
        )}
        onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
      >
        {selected && <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </div>
      <div className="h-28 w-full rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center mt-1">
        {isImage && thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt={file.name} className="h-full w-full object-cover" />
        ) : (
          <FileIcon mimeType={file.mimeType} className="h-10 w-10 text-blue-500" />
        )}
      </div>
      <p className="text-xs font-medium truncate w-full text-center leading-tight px-1">{file.name}</p>
      <div className="flex items-center gap-1 h-4">
        <ExpiryBadge expiresAt={file.expiresAt} />
        {file.isFavorite && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
      </div>
    </div>
  ) : (
    <div
      onClick={() => isPreviewable ? preview() : download()}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card hover:bg-muted/60 hover:border-primary/20 transition-all cursor-pointer select-none",
        selected && "border-primary bg-primary/5"
      )}
    >
      {/* Checkbox */}
      <div
        className={cn(
          "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
          selected ? "bg-primary border-primary" : "border-muted-foreground/50 bg-card/80 group-hover:border-primary/70"
        )}
        onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
      >
        {selected && <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </div>
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

      {previewOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
            <span className="text-sm font-medium truncate pr-4">{file.name}</span>
            <button onClick={() => setPreviewOpen(false)} className="shrink-0 rounded-md p-1 hover:bg-muted transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden flex items-center justify-center bg-black/5 dark:bg-black/40">
            {file.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={file.name} className="max-w-full max-h-full object-contain" />
            ) : (
              <iframe src={previewUrl} className="w-full h-full border-0" title={file.name} />
            )}
          </div>
        </div>,
        document.body
      )}

      <SetExpiryDialog open={expiryOpen} onOpenChange={setExpiryOpen} currentExpiry={file.expiresAt} onSave={saveExpiry} />
    </>
  );
}

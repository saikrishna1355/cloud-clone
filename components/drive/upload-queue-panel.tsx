"use client";

import { CheckCircle2, XCircle, Loader2, X } from "lucide-react";
import { UploadItem } from "@/hooks/use-upload-queue";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadQueuePanelProps {
  queue: UploadItem[];
  onClear: () => void;
}

export function UploadQueuePanel({ queue, onClear }: UploadQueuePanelProps) {
  if (!queue.length) return null;

  const allDone = queue.every((i) => i.status === "done" || i.status === "error");

  return (
    <div className="fixed bottom-24 right-4 z-50 w-80 bg-card border rounded-xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/40">
        <span className="text-sm font-medium">
          Uploading {queue.filter((i) => i.status === "done").length}/{queue.length}
        </span>
        {allDone && (
          <button onClick={onClear} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <ul className="max-h-64 overflow-y-auto divide-y">
        {queue.map((item) => (
          <li key={item.id} className="px-4 py-2.5 space-y-1.5">
            <div className="flex items-center gap-2">
              {item.status === "done" && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
              {item.status === "error" && <XCircle className="h-4 w-4 shrink-0 text-destructive" />}
              {(item.status === "uploading" || item.status === "pending") && (
                <Loader2 className={cn("h-4 w-4 shrink-0 text-primary", item.status === "uploading" && "animate-spin")} />
              )}
              <span className="text-sm truncate flex-1">{item.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">{formatBytes(item.size)}</span>
            </div>

            {(item.status === "uploading" || item.status === "pending") && (
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-200"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            )}

            {item.status === "error" && (
              <p className="text-xs text-destructive">Upload failed</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

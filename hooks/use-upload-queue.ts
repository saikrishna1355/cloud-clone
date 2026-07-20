"use client";

import { useState, useCallback } from "react";

export type UploadStatus = "pending" | "uploading" | "done" | "error";

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: UploadStatus;
}

export function useUploadQueue() {
  const [queue, setQueue] = useState<UploadItem[]>([]);

  const addItems = useCallback((files: File[]) => {
    const items: UploadItem[] = files.map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: f.size,
      progress: 0,
      status: "pending",
    }));
    setQueue((q) => [...q, ...items]);
    return items;
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const clearDone = useCallback(() => {
    setQueue((q) => q.filter((item) => item.status !== "done" && item.status !== "error"));
  }, []);

  const uploadFiles = useCallback(
    async (files: File[], folderId: string, items: UploadItem[]) => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const item = items[i];
        updateItem(item.id, { status: "uploading" });

        try {
          // Step 1: get presigned URL
          const urlRes = await fetch("/api/files/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: file.name,
              mimeType: file.type || "application/octet-stream",
              size: file.size,
              folderId,
            }),
          });

          if (!urlRes.ok) { updateItem(item.id, { status: "error" }); continue; }
          const { url, key, name } = await urlRes.json();

          // Step 2: PUT directly to S3 with progress tracking
          const success = await new Promise<boolean>((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", url);
            xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                updateItem(item.id, { progress: Math.round((e.loaded / e.total) * 100) });
              }
            };

            xhr.onload = () => resolve(xhr.status === 200);
            xhr.onerror = () => resolve(false);
            xhr.send(file);
          });

          if (!success) { updateItem(item.id, { status: "error" }); continue; }

          // Step 3: confirm metadata
          const confirmRes = await fetch("/api/files/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key,
              name,
              mimeType: file.type || "application/octet-stream",
              size: file.size,
              folderId,
            }),
          });

          if (confirmRes.ok) {
            updateItem(item.id, { status: "done", progress: 100 });
          } else {
            updateItem(item.id, { status: "error" });
          }
        } catch {
          updateItem(item.id, { status: "error" });
        }
      }
    },
    [updateItem]
  );

  return { queue, addItems, uploadFiles, clearDone };
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchResult } from "@/types";
import { Folder, FileText } from "lucide-react";
import { FileIcon } from "@/components/drive/file-icon";
import { Skeleton } from "@/components/ui/skeleton";

function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then(setResults)
      .finally(() => setLoading(false));
  }, [q]);

  function navigate(r: SearchResult) {
    if (r.type === "folder") router.push(`/folder/${r.id}`);
    else if (r.type === "note") router.push(`/notes/${r.id}`);
    else if (r.folderId) router.push(`/folder/${r.folderId}`);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Search: &ldquo;{q}&rdquo;</h1>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : results.length === 0 ? (
        <p className="text-muted-foreground">No results found.</p>
      ) : (
        <div className="space-y-1">
          {results.map((r) => (
            <div
              key={`${r.type}-${r.id}`}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer"
              onClick={() => navigate(r)}
            >
              {r.type === "folder" && <Folder className="h-5 w-5 text-yellow-500 shrink-0" />}
              {r.type === "note" && <FileText className="h-5 w-5 text-green-500 shrink-0" />}
              {r.type === "file" && <FileIcon mimeType="application/octet-stream" className="h-5 w-5 text-blue-500 shrink-0" />}
              <span className="text-sm">{r.name}</span>
              <span className="ml-auto text-xs text-muted-foreground capitalize">{r.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-8 w-64" /></div>}>
      <SearchResults />
    </Suspense>
  );
}

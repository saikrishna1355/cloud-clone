"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Eye, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/notes/${id}`)
      .then((r) => r.json())
      .then(({ note, content: c }) => {
        setTitle(note.title);
        setContent(c ?? "");
        setWordCount(c?.trim().split(/\s+/).filter(Boolean).length ?? 0);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const save = useCallback(async (c: string, t: string) => {
    setSaving(true);
    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: c, title: t }),
    });
    setSaving(false);
    setLastSaved(new Date());
  }, [id]);

  function handleContentChange(val: string) {
    setContent(val);
    setWordCount(val.trim().split(/\s+/).filter(Boolean).length);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(val, title), 1500);
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(content, val), 1500);
  }

  if (loading) return (
    <div className="p-8 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <input
          className="flex-1 text-xl font-semibold bg-transparent outline-none"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />
        <span className="text-xs text-muted-foreground">
          {saving ? "Saving…" : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ""}
        </span>
        <span className="text-xs text-muted-foreground">{wordCount} words</span>
        <Button variant="outline" size="sm" onClick={() => setPreview(!preview)}>
          {preview ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {preview ? "Edit" : "Preview"}
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {preview ? (
          <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        ) : (
          <textarea
            className="w-full h-full min-h-[60vh] bg-transparent outline-none resize-none font-mono text-sm"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing in Markdown…"
          />
        )}
      </div>
    </div>
  );
}

// Minimal markdown renderer (no external dep)
function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hliup])(.+)$/gm, "<p>$1</p>");
}

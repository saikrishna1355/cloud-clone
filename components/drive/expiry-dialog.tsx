"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SetExpiryDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentExpiry?: string | null;
  onSave: (expiresAt: string | null) => Promise<void>;
}

const PRESETS = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "Never", days: null },
];

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD for input[type=date]
}

export function SetExpiryDialog({ open, onOpenChange, currentExpiry, onSave }: SetExpiryDialogProps) {
  const router = useRouter();
  const [date, setDate] = useState(
    currentExpiry ? new Date(currentExpiry).toISOString().slice(0, 10) : daysFromNow(3)
  );
  const [saving, setSaving] = useState(false);

  async function save(expiresAt: string | null) {
    setSaving(true);
    await onSave(expiresAt);
    setSaving(false);
    onOpenChange(false);
    toast.success(expiresAt ? `Expires ${new Date(expiresAt).toLocaleDateString()}` : "Expiry removed");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Set Expiry
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.label}
                variant="outline"
                size="sm"
                onClick={() => p.days !== null ? setDate(daysFromNow(p.days)) : save(null)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="space-y-1">
            <Label>Custom date</Label>
            <Input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save(new Date(date).toISOString())} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExpiryBadge({ expiresAt }: { expiresAt?: string | null }) {
  if (!expiresAt) return null;
  const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  if (diff < 0) return null;
  const color = diff <= 1 ? "text-red-500" : diff <= 3 ? "text-orange-500" : "text-muted-foreground";
  return (
    <span className={`text-xs flex items-center gap-0.5 shrink-0 ${color}`}>
      <Clock className="h-3 w-3" />
      {diff === 0 ? "today" : `${diff}d`}
    </span>
  );
}

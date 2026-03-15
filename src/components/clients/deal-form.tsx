"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export type DealStatus =
  | "nouveau"
  | "engage"
  | "call_booke"
  | "no_show"
  | "follow_up"
  | "depot_pose"
  | "close"
  | "perdu";

const DEAL_STATUS_OPTIONS: { value: DealStatus; label: string }[] = [
  { value: "nouveau", label: "Nouveau" },
  { value: "engage", label: "Engagé" },
  { value: "call_booke", label: "Call booké" },
  { value: "no_show", label: "No-show" },
  { value: "follow_up", label: "Follow-up" },
  { value: "depot_pose", label: "Dépôt posé" },
  { value: "close", label: "Closé" },
  { value: "perdu", label: "Perdu" },
];

export interface DealFormData {
  title: string;
  amount: number;
  status: DealStatus;
  notes: string;
}

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DealFormData) => Promise<void>;
  initialData?: Partial<DealFormData>;
  mode: "create" | "edit";
}

export function DealForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: DealFormProps) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<DealFormData>({
    title: initialData?.title ?? "",
    amount: initialData?.amount ?? 0,
    status: initialData?.status ?? "nouveau",
    notes: initialData?.notes ?? "",
  });

  React.useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title ?? "",
        amount: initialData.amount ?? 0,
        status: initialData.status ?? "nouveau",
        notes: initialData.notes ?? "",
      });
    } else {
      setForm({ title: "", amount: 0, status: "nouveau", notes: "" });
    }
  }, [initialData, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSubmit(form);
      if (mode === "create") {
        setForm({ title: "", amount: 0, status: "nouveau", notes: "" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nouveau deal" : "Modifier le deal"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Ajoutez un deal à ce client."
              : "Modifiez les informations du deal."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deal-title">Titre *</Label>
            <Input
              id="deal-title"
              placeholder="Coaching 3 mois"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal-amount">Montant (€)</Label>
              <Input
                id="deal-amount"
                type="number"
                min={0}
                step={0.01}
                placeholder="2000"
                value={form.amount || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-status">Statut</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as DealStatus }))
                }
              >
                <SelectTrigger id="deal-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-notes">Notes</Label>
            <Textarea
              id="deal-notes"
              placeholder="Détails du deal..."
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="min-h-[70px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving || !form.title.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {mode === "create" ? "Créer" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

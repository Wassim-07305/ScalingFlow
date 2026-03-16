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
import type { ClientRow } from "./client-card";

const STATUS_OPTIONS: { value: ClientRow["status"]; label: string }[] = [
  { value: "prospect", label: "Prospect" },
  { value: "actif", label: "Actif" },
  { value: "inactif", label: "Inactif" },
  { value: "churne", label: "Churné" },
];

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClientFormData) => Promise<void>;
  initialData?: Partial<ClientFormData>;
  mode: "create" | "edit";
}

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: ClientRow["status"];
  notes: string;
}

export function ClientForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: ClientFormProps) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<ClientFormData>({
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    company: initialData?.company ?? "",
    status: initialData?.status ?? "prospect",
    notes: initialData?.notes ?? "",
  });

  // Sync form when initialData or mode changes
  React.useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name ?? "",
        email: initialData.email ?? "",
        phone: initialData.phone ?? "",
        company: initialData.company ?? "",
        status: initialData.status ?? "prospect",
        notes: initialData.notes ?? "",
      });
    } else {
      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        status: "prospect",
        notes: "",
      });
    }
  }, [initialData, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSubmit(form);
      if (mode === "create") {
        setForm({
          name: "",
          email: "",
          phone: "",
          company: "",
          status: "prospect",
          notes: "",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof ClientFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Ajouter un client" : "Modifier le client"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Renseignez les informations de votre nouveau client."
              : "Modifiez les informations du client."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nom *</Label>
              <Input
                id="client-name"
                placeholder="Jean Dupont"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-company">Entreprise</Label>
              <Input
                id="client-company"
                placeholder="Acme Inc."
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                type="email"
                placeholder="jean@acme.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Téléphone</Label>
              <Input
                id="client-phone"
                placeholder="+33 6 12 34 56 78"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-status">Statut</Label>
            <Select
              value={form.status}
              onValueChange={(v) => update("status", v)}
            >
              <SelectTrigger id="client-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-notes">Notes</Label>
            <Textarea
              id="client-notes"
              placeholder="Notes libres sur ce client..."
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="min-h-[80px]"
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
            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {mode === "create" ? "Créer" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

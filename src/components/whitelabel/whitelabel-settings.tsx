"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import {
  Building2,
  Palette,
  Users,
  Plus,
  Trash2,
  Loader2,
  Crown,
  Shield,
  UserCircle,
  Globe,
  Camera,
  Mail,
  MessageSquare,
  Lock,
  Sparkles,
} from "lucide-react";
import { useOrganization, type OrgMember } from "@/hooks/use-organization";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

// ─── Create Organization Form ─────────────────────────────────

function CreateOrgForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [creating, setCreating] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate slug from name
    setSlug(
      val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("Le nom et le slug sont requis.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/integrations/whitelabel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la création.");
        return;
      }

      toast.success("Organisation créée avec succès !");
      onCreated();
    } catch {
      toast.error("Erreur inattendue.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-accent" />
          Créer ton espace Whitelabel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-text-secondary">
          Crée ton organisation pour offrir une expérience brandée à tes
          clients. Ils verront ton logo, tes couleurs et ton nom de marque.
        </p>

        <div>
          <Label>Nom de l&apos;organisation</Label>
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Mon Agence"
          />
        </div>

        <div>
          <Label>Slug (URL)</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">
              app.scalingflow.com/
            </span>
            <Input
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="mon-agence"
              className="flex-1"
            />
          </div>
        </div>

        <Button
          onClick={handleCreate}
          disabled={creating || !name.trim() || !slug.trim()}
        >
          {creating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Building2 className="h-4 w-4 mr-2" />
          )}
          Créer l&apos;organisation
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Branding Settings ─────────────────────────────────────────

function BrandingSection({
  organization,
  onUpdated,
}: {
  organization: NonNullable<ReturnType<typeof useOrganization>["organization"]>;
  onUpdated: () => void;
}) {
  const [brandName, setBrandName] = useState(organization.brand_name || "");
  const [primaryColor, setPrimaryColor] = useState(
    organization.primary_color || "#34D399",
  );
  const [accentColor, setAccentColor] = useState(
    organization.accent_color || "#10B981",
  );
  const [customDomain, setCustomDomain] = useState(
    organization.custom_domain || "",
  );
  const [supportEmail, setSupportEmail] = useState(
    organization.support_email || "",
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    organization.custom_welcome_message || "",
  );
  const [logoUrl, setLogoUrl] = useState(organization.logo_url || "");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Seules les images sont acceptées.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 2 Mo.");
        return;
      }

      setUploadingLogo(true);
      try {
        const ext = file.name.split(".").pop() || "png";
        const fileName = `orgs/${organization.id}/logo.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        setLogoUrl(publicUrl);
        toast.success("Logo uploadé !");
      } catch {
        toast.error("Erreur lors de l'upload du logo.");
      } finally {
        setUploadingLogo(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [organization.id, supabase],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/whitelabel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: brandName.trim() || null,
          primary_color: primaryColor,
          accent_color: accentColor,
          custom_domain: customDomain.trim() || null,
          logo_url: logoUrl || null,
          support_email: supportEmail.trim() || null,
          custom_welcome_message: welcomeMessage.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la sauvegarde.");
        return;
      }

      toast.success("Branding mis à jour !");
      onUpdated();
    } catch {
      toast.error("Erreur inattendue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-accent" />
          Branding & Personnalisation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logo */}
        <div>
          <Label>Logo de l&apos;organisation</Label>
          <div className="flex items-center gap-4 mt-2">
            <div className="relative group">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-16 w-16 rounded-lg object-contain bg-bg-tertiary border border-border-default p-1"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-bg-tertiary border border-border-default flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-text-muted" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {uploadingLogo ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </button>
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                {logoUrl ? "Changer" : "Uploader"}
              </Button>
              <p className="text-xs text-text-muted mt-1">
                PNG, SVG ou JPG. Max 2 Mo.
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>

        <Separator />

        {/* Brand name */}
        <div>
          <Label>Nom de marque affiché</Label>
          <Input
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder={organization.name}
          />
          <p className="text-xs text-text-muted mt-1">
            Remplace &quot;ScalingFlow&quot; dans la sidebar pour tes membres.
          </p>
        </div>

        {/* Colors */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Couleur principale</Label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-10 rounded-lg cursor-pointer border border-border-default bg-transparent"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <Label>Couleur secondaire</Label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-10 rounded-lg cursor-pointer border border-border-default bg-transparent"
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-xl bg-bg-tertiary border border-border-default">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
            Aperçu
          </p>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-8 w-8 rounded-md object-contain"
              />
            ) : (
              <div
                className="h-8 w-8 rounded-md flex items-center justify-center"
                style={{ backgroundColor: primaryColor + "20" }}
              >
                <Building2
                  className="h-4 w-4"
                  style={{ color: primaryColor }}
                />
              </div>
            )}
            <span className="font-bold text-text-primary">
              {brandName || organization.name}
            </span>
          </div>
          <div className="flex gap-2 mt-3">
            <div
              className="h-8 flex-1 rounded-lg"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="h-8 flex-1 rounded-lg"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        </div>

        <Separator />

        {/* Support email */}
        <div>
          <Label className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email de support affiché aux clients
          </Label>
          <Input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            placeholder="support@tonbusiness.com"
          />
        </div>

        {/* Welcome message */}
        <div>
          <Label className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Message de bienvenue personnalisé
          </Label>
          <textarea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Bienvenue dans ton espace ! Ici tu trouveras tous les outils pour scaler ton business..."
            rows={3}
            className="w-full rounded-xl border border-border-default bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all resize-none mt-1"
          />
          <p className="text-xs text-text-muted mt-1">
            Affiché sur le dashboard de tes clients.
          </p>
        </div>

        <Separator />

        {/* Custom domain */}
        <div>
          <Label className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Domaine personnalisé (optionnel)
          </Label>
          <Input
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="app.monbusiness.com"
          />
          <p className="text-xs text-text-muted mt-1">
            Configure un CNAME vers cname.scalingflow.com pour activer ton
            domaine.
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Palette className="h-4 w-4 mr-2" />
          )}
          Sauvegarder le branding
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Member Management ─────────────────────────────────────────

function MembersSection({
  members,
  isOwner,
  onUpdated,
}: {
  members: OrgMember[];
  isOwner: boolean;
  onUpdated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Entre une adresse e-mail.");
      return;
    }

    setInviting(true);
    try {
      const res = await fetch("/api/integrations/whitelabel/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'invitation.");
        return;
      }

      toast.success(
        `${trimmed} ajouté comme ${role === "admin" ? "administrateur" : "membre"} !`,
      );
      setEmail("");
      onUpdated();
    } catch {
      toast.error("Erreur inattendue.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    setRemovingId(userId);
    try {
      const res = await fetch("/api/integrations/whitelabel/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la suppression.");
        return;
      }

      toast.success("Membre retiré de l'organisation.");
      onUpdated();
    } catch {
      toast.error("Erreur inattendue.");
    } finally {
      setRemovingId(null);
    }
  };

  const roleIcon = (r: string) => {
    switch (r) {
      case "owner":
        return <Crown className="h-3.5 w-3.5" />;
      case "admin":
        return <Shield className="h-3.5 w-3.5" />;
      default:
        return <UserCircle className="h-3.5 w-3.5" />;
    }
  };

  const roleLabel = (r: string) => {
    switch (r) {
      case "owner":
        return "Propriétaire";
      case "admin":
        return "Admin";
      default:
        return "Membre";
    }
  };

  const roleBadgeVariant = (r: string) => {
    switch (r) {
      case "owner":
        return "purple";
      case "admin":
        return "cyan";
      default:
        return "muted";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          Membres ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-text-secondary">
          Invite tes clients pour qu&apos;ils accèdent à la plateforme sous ta
          marque. Ils doivent avoir un compte ScalingFlow.
        </p>

        {/* Invite form */}
        <div className="flex gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemple.com"
            type="email"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleInvite();
            }}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "member" | "admin")}
            className="rounded-xl border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary"
          >
            <option value="member">Membre</option>
            <option value="admin">Admin</option>
          </select>
          <Button onClick={handleInvite} disabled={inviting || !email.trim()}>
            {inviting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Member list */}
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border-default"
            >
              <div className="flex items-center gap-3 min-w-0">
                {member.profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.profile.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-accent-muted flex items-center justify-center shrink-0">
                    <UserCircle className="h-4 w-4 text-accent" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {member.profile?.full_name || member.profile?.email || "—"}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {member.profile?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <Badge
                  variant={
                    roleBadgeVariant(member.role) as "purple" | "cyan" | "muted"
                  }
                >
                  <span className="flex items-center gap-1">
                    {roleIcon(member.role)}
                    {roleLabel(member.role)}
                  </span>
                </Badge>
                {member.role !== "owner" && isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(member.user_id)}
                    disabled={removingId === member.user_id}
                    className="text-danger hover:text-danger h-8 w-8 p-0"
                  >
                    {removingId === member.user_id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Module Toggles Section ──────────────────────────────────────

const TOGGLEABLE_MODULES = [
  { key: "vault", label: "Vault" },
  { key: "market", label: "Marché" },
  { key: "offer", label: "Offre" },
  { key: "brand", label: "Marque" },
  { key: "funnel", label: "Funnel" },
  { key: "assets", label: "Assets" },
  { key: "ads", label: "Publicités" },
  { key: "content", label: "Contenu" },
  { key: "prospection", label: "Prospection" },
  { key: "pipeline", label: "Pipeline" },
  { key: "sales", label: "Vente" },
  { key: "academy", label: "Academy" },
  { key: "drive", label: "Drive" },
] as const;

function ModulesSection({
  organization,
  onUpdated,
}: {
  organization: NonNullable<ReturnType<typeof useOrganization>["organization"]>;
  onUpdated: () => void;
}) {
  const features = (organization.features as Record<string, boolean>) || {};
  const [modules, setModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    TOGGLEABLE_MODULES.forEach((m) => {
      initial[m.key] = features[m.key] !== false; // enabled by default
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);

  const toggleModule = (key: string) => {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/whitelabel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: modules }),
      });

      if (!res.ok) {
        toast.error("Erreur lors de la sauvegarde.");
        return;
      }

      toast.success("Modules mis à jour !");
      onUpdated();
    } catch {
      toast.error("Erreur inattendue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          Modules activés pour tes clients
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-text-secondary">
          Choisis les modules accessibles par tes clients. Les modules
          désactivés seront masqués de leur navigation.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {TOGGLEABLE_MODULES.map((mod) => (
            <button
              key={mod.key}
              onClick={() => toggleModule(mod.key)}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
                modules[mod.key]
                  ? "border-accent/30 bg-accent/5"
                  : "border-border-default bg-bg-tertiary opacity-60",
              )}
            >
              <span className="text-sm font-medium text-text-primary">
                {mod.label}
              </span>
              {modules[mod.key] ? (
                <div className="flex h-6 w-10 items-center rounded-full bg-accent p-0.5">
                  <div className="h-5 w-5 rounded-full bg-white translate-x-4 transition-transform" />
                </div>
              ) : (
                <div className="flex h-6 w-10 items-center rounded-full bg-bg-secondary border border-border-default p-0.5">
                  <div className="h-5 w-5 rounded-full bg-text-muted/30 transition-transform" />
                </div>
              )}
            </button>
          ))}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Sauvegarder les modules
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Premium Gate ──────────────────────────────────────────────

function PremiumGate() {
  return (
    <Card className="border-purple-500/20 bg-purple-500/5">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/15 mb-4">
            <Lock className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">
            White Label — Premium
          </h3>
          <p className="text-sm text-text-muted max-w-md mb-6">
            Offre une expérience brandée à tes clients avec ton logo, tes
            couleurs et ton nom de marque. Disponible avec le plan Premium.
          </p>
          <Badge variant="purple" className="text-sm px-4 py-1.5">
            <Crown className="h-4 w-4 mr-2" />
            Passer en Premium
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Whitelabel Settings ──────────────────────────────────

export function WhitelabelSettings() {
  const { profile } = useUser();
  const { organization, role, members, loading, isOwner, isAdmin, refetch } =
    useOrganization();

  const subscriptionPlan = profile?.subscription_plan || "free";
  const isPremium = subscriptionPlan === "premium";

  // Premium gate — show upgrade CTA for Free/Pro users
  if (!loading && !isPremium && !organization) {
    return <PremiumGate />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-bg-tertiary" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-40 rounded-lg bg-bg-tertiary" />
                  <div className="h-3 w-24 rounded-lg bg-bg-tertiary" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-bg-tertiary/50" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-48 rounded-lg bg-bg-tertiary" />
              <div className="h-16 w-16 rounded-xl bg-bg-tertiary" />
              <div className="h-10 w-full rounded-xl bg-bg-tertiary/50" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 rounded-xl bg-bg-tertiary/50" />
                <div className="h-10 rounded-xl bg-bg-tertiary/50" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No org yet: show creation form
  if (!organization) {
    return <CreateOrgForm onCreated={refetch} />;
  }

  // Member view (read-only)
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-accent" />
            Organisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            {organization.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={organization.logo_url}
                alt=""
                className="h-12 w-12 rounded-lg object-contain bg-bg-tertiary border border-border-default p-1"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-bg-tertiary border border-border-default flex items-center justify-center">
                <Building2 className="h-5 w-5 text-text-muted" />
              </div>
            )}
            <div>
              <p className="font-semibold text-text-primary">
                {organization.brand_name || organization.name}
              </p>
              <Badge variant="muted">Membre</Badge>
            </div>
          </div>
          <p className="text-sm text-text-secondary">
            Tu fais partie de cette organisation. Contacte un administrateur
            pour modifier les paramètres.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Owner/Admin view: full management
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Org info */}
      <Card className="border-border-default/50 bg-bg-secondary/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-accent" />
            Organisation : {organization.brand_name || organization.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="p-3 rounded-xl bg-bg-tertiary border border-border-default">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                Slug
              </p>
              <p className="text-sm font-mono text-text-primary">
                {organization.slug}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-bg-tertiary border border-border-default">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                Membres
              </p>
              <p className="text-sm font-semibold text-text-primary">
                {members.length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-bg-tertiary border border-border-default">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                Ton rôle
              </p>
              <Badge variant={role === "owner" ? "purple" : "cyan"}>
                {role === "owner" ? "Propriétaire" : "Admin"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <BrandingSection organization={organization} onUpdated={refetch} />

      {/* Members */}
      <MembersSection members={members} isOwner={isOwner} onUpdated={refetch} />

      {/* Modules toggles */}
      <ModulesSection organization={organization} onUpdated={refetch} />
    </div>
  );
}

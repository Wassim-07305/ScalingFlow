"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { SubscriptionCard } from "@/components/settings/subscription-card";
import {
  User,
  Bell,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Camera,
  Trash2,
  Link2,
  Download,
  Palette,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useUIStore, type Theme } from "@/stores/ui-store";

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
};

export default function SettingsPage() {
  const { user, profile } = useUser();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Handle checkout success redirect
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Abonnement activé avec succès ! Bienvenue dans le plan Pro.");
    }
  }, [searchParams]);

  // --- Avatar ---
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile?.avatar_url]);

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptées.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Photo de profil mise à jour !");
    } catch {
      toast.error("Erreur lors de l'upload de l'avatar.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [user, supabase]);

  const handleRemoveAvatar = useCallback(async () => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (error) throw error;
      setAvatarUrl(null);
      toast.success("Photo de profil supprimée.");
    } catch {
      toast.error("Erreur lors de la suppression.");
    } finally {
      setUploadingAvatar(false);
    }
  }, [user, supabase]);

  // --- Profil ---
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // --- Mot de passe ---
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Synchroniser le champ full_name avec le profil chargé
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name]);

  // --- Sauvegarde du profil ---
  const handleSaveProfile = useCallback(async () => {
    if (!user) return;

    const trimmed = fullName.trim();
    if (!trimmed) {
      toast.error("Le nom ne peut pas être vide.");
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: trimmed })
        .eq("id", user.id);

      if (error) {
        toast.error("Erreur lors de la sauvegarde : " + error.message);
      } else {
        toast.success("Profil mis à jour avec succès.");
      }
    } catch {
      toast.error("Une erreur inattendue est survenue.");
    } finally {
      setSavingProfile(false);
    }
  }, [user, fullName, supabase]);

  // --- Changement de mot de passe ---
  const handleChangePassword = useCallback(async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Remplis les deux champs de mot de passe.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error("Erreur : " + error.message);
      } else {
        toast.success("Mot de passe mis à jour avec succès.");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordSection(false);
      }
    } catch {
      toast.error("Une erreur inattendue est survenue.");
    } finally {
      setSavingPassword(false);
    }
  }, [newPassword, confirmPassword, supabase]);

  // --- Suppression de compte ---
  const handleDeleteAccount = useCallback(() => {
    toast.info("Contacte le support pour supprimer ton compte.");
  }, []);

  // --- Notifications ---
  const NOTIF_KEYS = [
    { key: "email_progression", label: "E-mails de progression" },
    { key: "email_tasks", label: "Rappels de tâches" },
    { key: "email_academy", label: "Nouveautés Academy" },
    { key: "email_community", label: "Activité communauté" },
  ] as const;

  type NotifPrefs = Record<string, boolean>;
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(() => {
    const meta = user?.user_metadata as NotifPrefs | undefined;
    return NOTIF_KEYS.reduce((acc, { key }) => {
      acc[key] = meta?.[key] !== false;
      return acc;
    }, {} as NotifPrefs);
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  useEffect(() => {
    const meta = user?.user_metadata as NotifPrefs | undefined;
    setNotifPrefs(
      NOTIF_KEYS.reduce((acc, { key }) => {
        acc[key] = meta?.[key] !== false;
        return acc;
      }, {} as NotifPrefs)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleToggleNotif = (key: string) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotifs = useCallback(async () => {
    if (!user) return;
    setSavingNotifs(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: notifPrefs,
      });
      if (error) throw error;
      toast.success("Préférences de notifications sauvegardées.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSavingNotifs(false);
    }
  }, [user, notifPrefs, supabase]);

  // Vérifier si le profil a changé
  const profileChanged = fullName.trim() !== (profile?.full_name || "");

  return (
    <div>
      <PageHeader
        title="Paramètres"
        description="Gère ton compte et tes intégrations."
      />

      <div className="space-y-6 max-w-2xl">
        {/* Avatar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-accent" />
              Photo de profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-accent/20"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-accent-muted flex items-center justify-center ring-2 ring-accent/20">
                    <User className="h-8 w-8 text-accent" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  aria-label="Changer la photo de profil"
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 mr-2" />
                    )}
                    Changer
                  </Button>
                  {avatarUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      className="text-danger hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  JPG, PNG ou WebP. Max 2 Mo.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                aria-label="Sélectionner une photo de profil"
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Profil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-info" />
              Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div>
              <Label>Nom complet</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ton nom"
              />
            </div>
            <div>
              <Label>Marché cible</Label>
              <Input
                value={profile?.selected_market || "Non défini"}
                disabled
              />
            </div>
            <div>
              <Label>Niveau d&apos;experience</Label>
              <Input
                value={
                  profile?.experience_level
                    ? EXPERIENCE_LABELS[profile.experience_level] ||
                      profile.experience_level
                    : "Non défini"
                }
                disabled
              />
            </div>
            <Button
              size="sm"
              onClick={handleSaveProfile}
              disabled={savingProfile || !profileChanged}
            >
              {savingProfile && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Sauvegarder
            </Button>
          </CardContent>
        </Card>

        {/* Abonnement */}
        <SubscriptionCard />

        {/* Integrations */}
        <IntegrationsCard />

        {/* Export */}
        <ExportDataCard />

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {NOTIF_KEYS.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-text-primary">{label}</span>
                  <button
                    onClick={() => handleToggleNotif(key)}
                    role="switch"
                    aria-checked={notifPrefs[key]}
                    aria-label={label}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      notifPrefs[key] ? "bg-accent" : "bg-bg-tertiary border border-border-default"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                        notifPrefs[key] ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              className="mt-4"
              onClick={handleSaveNotifs}
              disabled={savingNotifs}
            >
              {savingNotifs && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sauvegarder les préférences
            </Button>
          </CardContent>
        </Card>

        {/* Apparence */}
        <ThemeCard />

        {/* Sécurité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-danger" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Changement de mot de passe */}
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordSection((prev) => !prev)}
              >
                Changer de mot de passe
                {showPasswordSection ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  showPasswordSection
                    ? "max-h-80 opacity-100 mt-4"
                    : "max-h-0 opacity-0"
                )}
              >
                <div className="space-y-3">
                  <div>
                    <Label>Nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 caractères"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label={showNewPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label>Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Retape le mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((prev) => !prev)
                        }
                        aria-label={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {newPassword &&
                    confirmPassword &&
                    newPassword !== confirmPassword && (
                      <p className="text-xs text-danger">
                        Les mots de passe ne correspondent pas.
                      </p>
                    )}
                  <Button
                    size="sm"
                    onClick={handleChangePassword}
                    disabled={
                      savingPassword || !newPassword || !confirmPassword
                    }
                  >
                    {savingPassword && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Mettre à jour le mot de passe
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Suppression de compte */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
              aria-label="Supprimer mon compte"
            >
              Supprimer mon compte
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Integrations Card ────────────────────────────────────────

type ConnectionStatus = {
  connected: boolean;
  username?: string;
  accountId?: string;
  expiresAt?: string;
  connectedAt?: string;
};

function IntegrationsCard() {
  const { user } = useUser();
  const [connections, setConnections] = useState<Record<string, ConnectionStatus>>({});
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Show toast for OAuth redirects
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success?.includes("connected")) {
      const provider = success.replace("_connected", "");
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} connecté avec succès !`);
    }
    if (error) {
      toast.error(`Erreur de connexion : ${error}`);
    }
  }, [searchParams]);

  // Fetch connection status
  useEffect(() => {
    if (!user) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/integrations/status");
        const data = await res.json();
        if (data.status) setConnections(data.status);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [user]);

  const handleDisconnect = async (provider: string, endpoint: string) => {
    setDisconnecting(provider);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        setConnections((prev) => ({ ...prev, [provider]: { connected: false } }));
        toast.success("Déconnecté.");
      } else {
        toast.error("Erreur lors de la déconnexion.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setDisconnecting(null);
    }
  };

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const ghlInboundUrl = `${appUrl}/api/webhooks/leads`;

  const ConnectButton = ({
    provider,
    label,
    connectUrl,
    disconnectUrl,
    badgeVariant = "blue",
  }: {
    provider: string;
    label: string;
    connectUrl: string;
    disconnectUrl: string;
    badgeVariant?: "blue" | "cyan" | "default";
  }) => {
    const conn = connections[provider];
    const isDisconnecting = disconnecting === provider;

    return (
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <Badge variant={badgeVariant} className="text-xs">{label}</Badge>
          {conn?.connected ? (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-sm text-text-secondary">
                {conn.username || conn.accountId || "Connecté"}
              </span>
            </div>
          ) : (
            <span className="text-sm text-text-muted">Non connecté</span>
          )}
        </div>
        {conn?.connected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDisconnect(provider, disconnectUrl)}
            disabled={isDisconnecting}
            className="text-danger hover:text-danger"
          >
            {isDisconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Déconnecter"
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { window.location.href = connectUrl; }}
            disabled={loading}
          >
            Connecter
          </Button>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-info" />
          Intégrations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : (
          <>
            {/* Publicite & CRM */}
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider pt-2">
              Publicité & CRM
            </p>

            <ConnectButton
              provider="meta"
              label="Meta Ads"
              connectUrl="/api/integrations/meta/connect"
              disconnectUrl="/api/integrations/meta/disconnect"
              badgeVariant="blue"
            />
            <ConnectButton
              provider="ghl"
              label="GoHighLevel"
              connectUrl="/api/integrations/ghl/connect"
              disconnectUrl="/api/integrations/ghl/disconnect"
              badgeVariant="cyan"
            />
            <ConnectButton
              provider="stripe_connect"
              label="Stripe Connect"
              connectUrl="/api/integrations/stripe-connect/connect"
              disconnectUrl="/api/integrations/stripe-connect/disconnect"
              badgeVariant="default"
            />

            <Separator className="my-3" />

            {/* Reseaux sociaux */}
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Réseaux sociaux
            </p>

            <ConnectButton
              provider="instagram"
              label="Instagram"
              connectUrl="/api/integrations/social/instagram/connect"
              disconnectUrl="/api/integrations/social/instagram/disconnect"
              badgeVariant="default"
            />
            <ConnectButton
              provider="google"
              label="YouTube"
              connectUrl="/api/integrations/social/google/connect"
              disconnectUrl="/api/integrations/social/google/disconnect"
              badgeVariant="default"
            />
            <ConnectButton
              provider="linkedin"
              label="LinkedIn"
              connectUrl="/api/integrations/social/linkedin/connect"
              disconnectUrl="/api/integrations/social/linkedin/disconnect"
              badgeVariant="blue"
            />
            <ConnectButton
              provider="tiktok"
              label="TikTok"
              connectUrl="/api/integrations/social/tiktok/connect"
              disconnectUrl="/api/integrations/social/tiktok/disconnect"
              badgeVariant="default"
            />

            <Separator className="my-3" />

            {/* Webhook entrant */}
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Webhook entrant (GHL / Zapier / Make)
            </p>
            <div className="flex gap-2 mt-2">
              <Input
                value={ghlInboundUrl}
                readOnly
                className="text-xs font-mono bg-bg-tertiary"
              />
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(ghlInboundUrl);
                  toast.success("URL copiée !");
                }}
              >
                Copier
              </Button>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Configure cette URL dans ton CRM (GHL, Zapier, Make) pour recevoir les leads entrants.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Theme Card ───────────────────────────────────────────────

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Système", icon: Monitor },
];

function ThemeCard() {
  const { theme, setTheme } = useUIStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-accent" />
          Apparence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                theme === option.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border-default bg-bg-secondary text-text-secondary hover:border-text-muted"
              )}
            >
              <option.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Export Data Card ─────────────────────────────────────────

function ExportDataCard() {
  const { user } = useUser();
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const supabase = createClient();

      const [offers, funnels, assets, ads, content] = await Promise.all([
        supabase.from("offers").select("*").eq("user_id", user.id),
        supabase.from("funnels").select("*").eq("user_id", user.id),
        supabase.from("sales_assets").select("*").eq("user_id", user.id),
        supabase.from("ad_creatives").select("*").eq("user_id", user.id),
        supabase.from("content_pieces").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        offers: offers.data ?? [],
        funnels: funnels.data ?? [],
        sales_assets: assets.data ?? [],
        ad_creatives: ads.data ?? [],
        content_pieces: content.data ?? [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scalingflow-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Données exportées avec succès !");
    } catch {
      toast.error("Erreur lors de l'export.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-accent" />
          Exporter mes données
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-secondary mb-4">
          Télécharge toutes tes offres, funnels, assets, publicités et contenus
          au format JSON.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportData}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exporter toutes mes données
        </Button>
      </CardContent>
    </Card>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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
import {
  User,
  CreditCard,
  Bell,
  Shield,
  ExternalLink,
  Loader2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Debutant",
  intermediate: "Intermediaire",
  advanced: "Avance",
};

export default function SettingsPage() {
  const { user, profile } = useUser();
  const supabase = createClient();

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

  // Synchroniser le champ full_name avec le profil charge
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
      toast.error("Le nom ne peut pas etre vide.");
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
        toast.success("Profil mis a jour avec succes.");
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
      toast.error("Le mot de passe doit contenir au moins 8 caracteres.");
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
        toast.success("Mot de passe mis a jour avec succes.");
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

  // Verifier si le profil a change
  const profileChanged = fullName.trim() !== (profile?.full_name || "");

  return (
    <div>
      <PageHeader
        title="Parametres"
        description="Gere ton compte et tes integrations."
      />

      <div className="space-y-6 max-w-2xl">
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
              <Label>Marche cible</Label>
              <Input
                value={profile?.selected_market || "Non defini"}
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
                    : "Non defini"
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent" />
              Abonnement
            </CardTitle>
            <CardDescription>
              Gere ton abonnement ScalingFlow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Plan actuel
                </p>
                <p className="text-xs text-text-muted">
                  {profile?.subscription_status === "active"
                    ? "Actif"
                    : "Inactif"}
                </p>
              </div>
              <Badge
                variant={
                  profile?.subscription_status === "active" ? "cyan" : "muted"
                }
              >
                {profile?.subscription_status === "active" ? "Pro" : "Gratuit"}
              </Badge>
            </div>
            <Separator />
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Gerer l&apos;abonnement
            </Button>
          </CardContent>
        </Card>

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
              {[
                "Emails de progression",
                "Rappels de taches",
                "Nouveautes Academy",
                "Activite communaute",
              ].map((notif) => (
                <div
                  key={notif}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-text-primary">{notif}</span>
                  <Badge variant="cyan">Active</Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-4">
              Les preferences de notifications seront bientot configurables.
            </p>
          </CardContent>
        </Card>

        {/* Securite */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-danger" />
              Securite
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
                        placeholder="Minimum 8 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
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
                    Mettre a jour le mot de passe
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
            >
              Supprimer mon compte
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/hooks/use-user";
import { User, CreditCard, Bell, Shield, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const { user, profile } = useUser();

  return (
    <div>
      <PageHeader
        title="Paramètres"
        description="Gère ton compte et tes intégrations."
      />

      <div className="space-y-6 max-w-2xl">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-neon-blue" />
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
              <Input defaultValue={profile?.full_name || ""} placeholder="Ton nom" />
            </div>
            <div>
              <Label>Marché cible</Label>
              <Input value={profile?.selected_market || "Non défini"} disabled />
            </div>
            <Button size="sm">Sauvegarder</Button>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-neon-orange" />
              Abonnement
            </CardTitle>
            <CardDescription>Gère ton abonnement ScalingFlow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Plan actuel</p>
                <p className="text-xs text-text-muted">
                  {profile?.subscription_status === "active" ? "Actif" : "Inactif"}
                </p>
              </div>
              <Badge variant={profile?.subscription_status === "active" ? "cyan" : "muted"}>
                {profile?.subscription_status === "active" ? "Pro" : "Gratuit"}
              </Badge>
            </div>
            <Separator />
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Gérer l&apos;abonnement
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-neon-cyan" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Emails de progression", "Rappels de tâches", "Nouveautés Academy", "Activité communauté"].map((notif) => (
                <div key={notif} className="flex items-center justify-between py-2">
                  <span className="text-sm text-text-primary">{notif}</span>
                  <Badge variant="cyan">Activé</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-neon-red" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" size="sm">Changer de mot de passe</Button>
            <Separator />
            <Button variant="destructive" size="sm">Supprimer mon compte</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

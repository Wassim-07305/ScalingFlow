"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import Image from "next/image";
import { Check, X } from "lucide-react";

function translateRegisterError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("already registered") || msg.includes("already been registered"))
    return "Un compte existe deja avec cet email.";
  if (msg.includes("password") && (msg.includes("short") || msg.includes("least")))
    return "Le mot de passe doit avoir au moins 6 caracteres.";
  if (msg.includes("valid email") || msg.includes("invalid email"))
    return "Format d'email invalide.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Trop de tentatives. Réessaie dans quelques minutes.";
  if (msg.includes("weak password"))
    return "Le mot de passe est trop faible. Ajoute des chiffres ou des majuscules.";
  if (msg.includes("signup") && msg.includes("disabled"))
    return "Les inscriptions sont temporairement desactivees.";
  return "Erreur lors de l'inscription. Vérifie tes informations et réessaie.";
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const passwordChecks = useMemo(() => [
    { label: "6 caracteres minimum", met: password.length >= 6 },
    { label: "Une majuscule", met: /[A-Z]/.test(password) },
    { label: "Un chiffre", met: /\d/.test(password) },
  ], [password]);

  const passwordStrength = passwordChecks.filter((c) => c.met).length;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(translateRegisterError(error.message));
      setLoading(false);
      return;
    }

    // Envoyer l'email de bienvenue (non bloquant)
    try {
      await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: "welcome",
          data: { firstName: fullName.split(" ")[0] },
        }),
      });
    } catch {
      // L'echec de l'email ne doit pas bloquer l'inscription
    }

    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Image src="/icons/icon-192.png" alt="ScalingFlow" width={40} height={40} className="rounded-[8px]" />
          <h1 className="text-3xl font-bold text-text-primary">ScalingFlow</h1>
        </div>
        <p className="text-text-secondary">
          Crée ton compte et commence à scaler.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Ton nom"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          {password.length > 0 && (
            <div className="space-y-2 pt-1">
              {/* Strength bar */}
              <div className="flex gap-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all",
                      passwordStrength >= level
                        ? passwordStrength === 3
                          ? "bg-accent"
                          : passwordStrength === 2
                            ? "bg-yellow-500"
                            : "bg-danger"
                        : "bg-bg-tertiary"
                    )}
                  />
                ))}
              </div>
              {/* Checklist */}
              <div className="space-y-0.5">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-1.5">
                    {check.met ? (
                      <Check className="h-3 w-3 text-accent" />
                    ) : (
                      <X className="h-3 w-3 text-text-muted" />
                    )}
                    <span className={cn(
                      "text-[11px]",
                      check.met ? "text-text-secondary" : "text-text-muted"
                    )}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-[8px] bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Création..." : "Créer mon compte"}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center space-y-2">
        <p className="text-sm text-text-secondary">
          Deja un compte ?{" "}
          <Link
            href="/login"
            className="text-info hover:underline font-medium"
          >
            Se connecter
          </Link>
        </p>
        <p className="text-xs text-text-muted">
          <Link href="/welcome" className="hover:text-text-secondary transition-colors">
            Retour a l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  );
}

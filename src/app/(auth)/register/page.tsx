"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import Image from "next/image";
import { Check, X, Loader2, Sparkles } from "lucide-react";

function translateRegisterError(message: string): string {
  const msg = message.toLowerCase();
  if (
    msg.includes("already registered") ||
    msg.includes("already been registered")
  )
    return "Un compte existe déjà avec cet email.";
  if (
    msg.includes("password") &&
    (msg.includes("short") || msg.includes("least"))
  )
    return "Le mot de passe doit avoir au moins 6 caractères.";
  if (msg.includes("valid email") || msg.includes("invalid email"))
    return "Format d'email invalide.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Trop de tentatives. Réessaie dans quelques minutes.";
  if (msg.includes("weak password"))
    return "Le mot de passe est trop faible. Ajoute des chiffres ou des majuscules.";
  if (msg.includes("signup") && msg.includes("disabled"))
    return "Les inscriptions sont temporairement désactivées.";
  return "Erreur lors de l'inscription. Vérifie tes informations et réessaie.";
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const passwordChecks = useMemo(
    () => [
      { label: "6 caractères minimum", met: password.length >= 6 },
      { label: "Une majuscule", met: /[A-Z]/.test(password) },
      { label: "Un chiffre", met: /\d/.test(password) },
    ],
    [password],
  );

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
      // L'échec de l'email ne doit pas bloquer l'inscription
    }

    // Lier le referral affilié si un cookie sf_ref est présent (non bloquant)
    try {
      await fetch("/api/affiliates/apply-referral", { method: "POST" });
    } catch {
      // Le referral ne doit pas bloquer l'inscription
    }

    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Image
            src="/icons/icon-192.png"
            alt="ScalingFlow"
            width={44}
            height={44}
            className="rounded-xl shadow-lg shadow-accent/10"
          />
          <h1 className="text-3xl font-bold text-text-primary">ScalingFlow</h1>
        </div>
        <p className="text-text-secondary">
          Crée ton compte et commence à scaler.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Ton nom"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoFocus
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 6 caractères"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            minLength={6}
            required
            className="h-11"
          />
          {password.length > 0 && (
            <div className="space-y-2.5 pt-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Strength bar */}
              <div className="flex gap-1.5">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-all duration-500",
                      passwordStrength >= level
                        ? passwordStrength === 3
                          ? "bg-accent shadow-sm shadow-accent/30"
                          : passwordStrength === 2
                            ? "bg-yellow-500 shadow-sm shadow-yellow-500/30"
                            : "bg-danger shadow-sm shadow-danger/30"
                        : "bg-bg-tertiary",
                    )}
                  />
                ))}
              </div>
              {/* Checklist */}
              <div className="space-y-1">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2">
                    {check.met ? (
                      <div className="h-4 w-4 rounded-full bg-accent/15 flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-accent" />
                      </div>
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-bg-tertiary flex items-center justify-center">
                        <X className="h-2.5 w-2.5 text-text-muted" />
                      </div>
                    )}
                    <span
                      className={cn(
                        "text-[11px] transition-colors",
                        check.met ? "text-text-secondary" : "text-text-muted",
                      )}
                    >
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-danger/10 border border-danger/20 p-3 text-sm text-danger animate-in fade-in slide-in-from-top-2 duration-300">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 text-base group"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
          )}
          {loading ? "Création..." : "Créer mon compte"}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center space-y-3">
        <p className="text-sm text-text-secondary">
          Déjà un compte ?{" "}
          <Link
            href="/login"
            className="text-accent hover:underline font-medium transition-colors"
          >
            Se connecter
          </Link>
        </p>
        <p className="text-xs text-text-muted">
          <Link
            href="/welcome"
            className="hover:text-text-secondary transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Traduire les erreurs Supabase en francais
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
        setError("Email ou mot de passe incorrect.");
      } else if (msg.includes("email not confirmed")) {
        setError("Ton email n'a pas encore ete verifie. Verifie ta boite de reception.");
      } else if (msg.includes("too many requests") || msg.includes("rate limit")) {
        setError("Trop de tentatives. Reessaie dans quelques minutes.");
      } else if (msg.includes("user not found")) {
        setError("Aucun compte trouve avec cet email.");
      } else if (msg.includes("disabled") || msg.includes("banned")) {
        setError("Ce compte a ete desactive. Contacte le support.");
      } else {
        setError("Erreur de connexion. Verifie tes identifiants et reessaie.");
      }
      setLoading(false);
      return;
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
          Connecte-toi pour accéder à ton cockpit.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="rounded-[8px] bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Mot de passe oublie ?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center space-y-2">
        <p className="text-sm text-text-secondary">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="text-info hover:underline font-medium"
          >
            Créer un compte
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

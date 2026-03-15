"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Loader2, LogIn } from "lucide-react";

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
      // Traduire les erreurs Supabase en français
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
        setError("Email ou mot de passe incorrect.");
      } else if (msg.includes("email not confirmed")) {
        setError("Ton email n'a pas encore été vérifié. Vérifie ta boîte de réception.");
      } else if (msg.includes("too many requests") || msg.includes("rate limit")) {
        setError("Trop de tentatives. Réessaie dans quelques minutes.");
      } else if (msg.includes("user not found")) {
        setError("Aucun compte trouvé avec cet email.");
      } else if (msg.includes("disabled") || msg.includes("banned")) {
        setError("Ce compte a été désactivé. Contacte le support.");
      } else {
        setError("Erreur de connexion. Vérifie tes identifiants et réessaie.");
      }
      setLoading(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Image src="/icons/icon-192.png" alt="ScalingFlow" width={44} height={44} className="rounded-xl shadow-lg shadow-accent/10" />
          <h1 className="text-3xl font-bold text-text-primary">ScalingFlow</h1>
        </div>
        <p className="text-text-secondary">
          Connecte-toi pour accéder à ton cockpit.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-5">
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
            autoFocus
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            required
            className="h-11"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-danger/10 border border-danger/20 p-3 text-sm text-danger animate-in fade-in slide-in-from-top-2 duration-300">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-text-muted hover:text-accent transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" className="w-full h-11 text-base group" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
          )}
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center space-y-3">
        <p className="text-sm text-text-secondary">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="text-accent hover:underline font-medium transition-colors"
          >
            Créer un compte
          </Link>
        </p>
        <p className="text-xs text-text-muted">
          <Link href="/welcome" className="hover:text-text-secondary transition-colors">
            Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  );
}

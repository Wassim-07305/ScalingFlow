"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Supabase injects the recovery token via URL hash — the client
  // library picks it up automatically when onAuthStateChange fires.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setHasSession(true);
          setChecking(false);
        }
      }
    );

    // Fallback: if user already has a session (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to dashboard after 2s
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 2000);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[30vh]">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Image src="/icons/icon-192.png" alt="ScalingFlow" width={40} height={40} className="rounded-[8px]" />
          <h1 className="text-3xl font-bold text-text-primary">ScalingFlow</h1>
        </div>
        <p className="text-text-secondary">
          Choisis ton nouveau mot de passe.
        </p>
      </div>

      {!hasSession ? (
        <div className="space-y-4">
          <div className="rounded-[8px] bg-danger/10 border border-danger/20 p-4 text-center">
            <p className="text-sm text-danger font-medium">
              Lien invalide ou expire.
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Demande un nouveau lien de reinitialisation.
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-info hover:underline font-medium text-sm"
            >
              Renvoyer un lien
            </Link>
          </div>
        </div>
      ) : success ? (
        <div className="rounded-[8px] bg-accent/10 border border-accent/20 p-4 text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-accent mx-auto" />
          <p className="text-sm text-text-primary font-medium">
            Mot de passe mis a jour !
          </p>
          <p className="text-sm text-text-secondary">
            Redirection vers ton cockpit...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Retape ton mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && (
            <div className="rounded-[8px] bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Mise a jour..." : "Mettre a jour le mot de passe"}
          </Button>
        </form>
      )}

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs text-text-muted">
          <Link href="/login" className="hover:text-text-secondary transition-colors">
            Retour a la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
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
          Reinitialise ton mot de passe.
        </p>
      </div>

      {sent ? (
        <div className="space-y-4">
          <div className="rounded-[8px] bg-accent/10 border border-accent/20 p-4 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-accent mx-auto" />
            <p className="text-sm text-text-primary font-medium">
              Email envoye !
            </p>
            <p className="text-sm text-text-secondary">
              Si un compte existe avec <span className="font-medium text-text-primary">{email}</span>, tu recevras un lien de reinitialisation.
            </p>
          </div>
          <p className="text-xs text-text-muted text-center">
            Rien recu ? Verifie tes spams ou{" "}
            <button
              onClick={() => setSent(false)}
              className="text-info hover:underline font-medium"
            >
              reessaye
            </button>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && (
            <div className="rounded-[8px] bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Envoi..." : "Envoyer le lien"}
          </Button>
        </form>
      )}

      {/* Footer */}
      <div className="text-center space-y-2">
        <p className="text-sm text-text-secondary">
          <Link
            href="/login"
            className="text-info hover:underline font-medium"
          >
            Retour a la connexion
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

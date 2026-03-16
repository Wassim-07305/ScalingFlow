"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { CheckCircle, Compass } from "lucide-react";

const PARCOURS = [
  {
    key: "A1",
    title: "Expert Confirmé",
    description:
      "Tu as déjà des résultats prouvés (clients, CA). Tu veux structurer et scaler ton offre existante.",
    ideal: "Freelances/consultants avec déjà 3k+/mois",
    sophistication: "Marché niveau 4-5 (très conscient)",
  },
  {
    key: "A2",
    title: "Expert Émergent",
    description:
      "Tu as les compétences mais pas encore les résultats. Tu veux créer ta première offre premium.",
    ideal: "Experts avec compétences solides mais peu de clients",
    sophistication: "Marché niveau 3-4 (solution-aware)",
  },
  {
    key: "A3",
    title: "Généraliste",
    description:
      "Tu sais faire beaucoup de choses mais tu n'as pas de spécialisation claire. Tu veux te nicher.",
    ideal: "Profils polyvalents cherchant à se spécialiser",
    sophistication: "Marché niveau 2-3 (problem-aware)",
  },
  {
    key: "B",
    title: "Freelance Technique",
    description:
      "Tu vends du temps/des compétences techniques. Tu veux passer d'un modèle horaire à un modèle valeur.",
    ideal: "Développeurs, designers, rédacteurs freelance",
    sophistication: "Marché niveau 1-2 (unaware -> problem-aware)",
  },
  {
    key: "C",
    title: "Agence / Équipe",
    description:
      "Tu as une équipe et tu veux systématiser l'acquisition et la delivery pour scaler.",
    ideal: "Fondateurs d'agences avec 2+ collaborateurs",
    sophistication: "Marché niveau 4-5 (très conscient)",
  },
] as const;

export function ParcoursSelector() {
  const { user } = useUser();
  const [selectedParcours, setSelectedParcours] = React.useState<string | null>(
    null,
  );
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    const fetchParcours = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("parcours")
        .eq("id", user.id)
        .single();
      if (data?.parcours) setSelectedParcours(data.parcours as string);
      setLoading(false);
    };
    fetchParcours();
  }, [user]);

  const handleSelect = async (key: string) => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ parcours: key as "A1" | "A2" | "A3" | "B" | "C" })
      .eq("id", user.id);

    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      setSelectedParcours(key);
      toast.success("Parcours sélectionné !");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <Compass className="h-10 w-10 text-accent mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Choisis ton parcours
        </h3>
        <p className="text-sm text-text-secondary">
          Ton parcours détermine la stratégie IA adaptée à ton profil.
          Sélectionne celui qui te correspond le mieux.
        </p>
      </div>

      <div className="grid gap-4">
        {PARCOURS.map((p) => (
          <Card
            key={p.key}
            className={cn(
              "cursor-pointer transition-all hover:border-accent/30",
              selectedParcours === p.key && "border-accent bg-accent/5",
              saving && "opacity-50 pointer-events-none",
            )}
            onClick={() => handleSelect(p.key)}
          >
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge
                      variant={selectedParcours === p.key ? "default" : "muted"}
                    >
                      {p.key}
                    </Badge>
                    <h4 className="font-semibold text-text-primary">
                      {p.title}
                    </h4>
                    {selectedParcours === p.key && (
                      <CheckCircle className="h-5 w-5 text-accent" />
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    {p.description}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                    <span>Idéal : {p.ideal}</span>
                    <span>&bull;</span>
                    <span>Sophistication : {p.sophistication}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedParcours && (
        <div className="text-center pt-4">
          <p className="text-sm text-accent font-medium">
            Parcours {selectedParcours} sélectionné — Les analyses IA seront
            adaptées à ton profil.
          </p>
        </div>
      )}
    </div>
  );
}

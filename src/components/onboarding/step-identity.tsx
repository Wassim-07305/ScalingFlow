"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OnboardingState } from "@/stores/onboarding-store";

const COUNTRIES = [
  "France",
  "Belgique",
  "Suisse",
  "Canada",
  "Maroc",
  "Tunisie",
  "Algérie",
  "Autre",
];

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "ar", label: "Arabe" },
];

interface StepProps {
  store: OnboardingState;
}

export function StepIdentity({ store }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text-primary">
          Qui es-tu ?
        </h2>
        <p className="text-text-secondary text-sm">
          Dis-nous en plus sur toi pour personnaliser ton parcours.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Prénom</Label>
          <Input
            value={store.firstName}
            onChange={(e) => store.setField("firstName", e.target.value)}
            placeholder="Ex: Wassim"
          />
        </div>
        <div className="space-y-2">
          <Label>Nom</Label>
          <Input
            value={store.lastName}
            onChange={(e) => store.setField("lastName", e.target.value)}
            placeholder="Ex: Dupont"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Pays</Label>
          <Select
            value={store.country}
            onValueChange={(value) => store.setField("country", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionne ton pays" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Langue principale</Label>
          <Select
            value={store.language}
            onValueChange={(value) => store.setField("language", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionne ta langue" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

"use client";

import { PageHeader } from "@/components/layout/page-header";
import { OfferGenerator } from "@/components/offer/offer-generator";

export default function OfferPage() {
  return (
    <div>
      <PageHeader
        title="Création d'Offre"
        description="Génère ton offre irrésistible avec l'IA."
      />
      <OfferGenerator />
    </div>
  );
}

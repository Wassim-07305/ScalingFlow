"use client";

import { PageHeader } from "@/components/layout/page-header";
import { CreativeGenerator } from "@/components/ads/creative-generator";

export default function CreativesPage() {
  return (
    <div>
      <PageHeader title="Créatives" description="Génère des créatives publicitaires avec l'IA." />
      <CreativeGenerator />
    </div>
  );
}

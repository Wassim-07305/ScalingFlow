"use client";

import { PageHeader } from "@/components/layout/page-header";
import { CreativeGenerator } from "@/components/ads/creative-generator";

export default function CreativesPage() {
  return (
    <div>
      <PageHeader title="Creatives" description="Genere des creatives publicitaires avec l'IA." />
      <CreativeGenerator />
    </div>
  );
}

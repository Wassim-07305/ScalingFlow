"use client";

import { PageHeader } from "@/components/layout/page-header";
import { FunnelBuilder } from "@/components/funnel/funnel-builder";

export default function FunnelPage() {
  return (
    <div>
      <PageHeader
        title="Funnel Builder"
        description="Construis ton funnel de conversion avec copy IA."
      />
      <FunnelBuilder />
    </div>
  );
}

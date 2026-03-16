"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";

export default function PipelinePage() {
  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Gère tes prospects et suis leur progression dans ton processus de vente."
        badge="CRM"
      />

      {/* Hero gradient */}
      <div className="relative mb-6 rounded-2xl border border-border-default bg-gradient-to-br from-accent/10 via-bg-secondary to-violet-500/10 p-6 overflow-hidden transition-all duration-300 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/5 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <h2 className="text-lg font-semibold text-text-primary mb-1">
            Pipeline de vente
          </h2>
          <p className="text-sm text-text-secondary max-w-2xl">
            Visualise chaque étape de ton processus commercial. Glisse-dépose
            tes leads entre les colonnes pour suivre leur avancement en temps
            réel.
          </p>
        </div>
      </div>

      <PipelineBoard />
    </div>
  );
}

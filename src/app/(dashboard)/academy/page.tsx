"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ModuleList } from "@/components/academy/module-list";

export default function AcademyPage() {
  return (
    <div>
      <PageHeader
        title="Academy"
        description="Formation vidéo étape par étape pour scaler ton business."
      />
      <ModuleList />
    </div>
  );
}

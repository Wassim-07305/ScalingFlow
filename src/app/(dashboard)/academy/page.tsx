"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleList } from "@/components/academy/module-list";
import { SkeletonCard } from "@/components/ui/skeleton";
import { GraduationCap, Clock, Trophy } from "lucide-react";

function AcademyStats() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[
        { icon: GraduationCap, label: "Modules", value: "Disponibles", color: "text-accent" },
        { icon: Clock, label: "Format", value: "Video + Action", color: "text-info" },
        { icon: Trophy, label: "Objectif", value: "Scaler ton business", color: "text-warning" },
      ].map((stat) => (
        <div key={stat.label} className="rounded-[12px] border border-border-default bg-bg-secondary p-4 flex items-center gap-3">
          <div className={`h-10 w-10 rounded-[8px] bg-bg-tertiary flex items-center justify-center ${stat.color}`}>
            <stat.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className="text-sm font-medium text-text-primary">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ModuleListFallback() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} className="h-32" />
      ))}
    </div>
  );
}

export default function AcademyPage() {
  return (
    <div>
      <PageHeader
        title="Academie"
        description="Formation video etape par etape pour scaler ton business."
      />
      <AcademyStats />
      <Suspense fallback={<ModuleListFallback />}>
        <ModuleList />
      </Suspense>
    </div>
  );
}

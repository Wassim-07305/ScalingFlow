"use client";

import { PageHeader } from "@/components/layout/page-header";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default function OnboardingPage() {
  return (
    <div>
      <PageHeader
        title="Onboarding"
        description="Configure ton profil et sélectionne ton marché."
      />
      <OnboardingWizard />
    </div>
  );
}

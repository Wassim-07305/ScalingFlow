"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

interface OrgFeatureGateProps {
  disabledFeatures: string[];
  children: React.ReactNode;
}

/**
 * Blocks access to pages that are disabled by the organization's feature config.
 * Members of a whitelabel org can only access features enabled by the owner.
 */
export function OrgFeatureGate({ disabledFeatures, children }: OrgFeatureGateProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (disabledFeatures.length === 0) return;

    // Extract the feature key from the pathname (e.g., "/market" → "market", "/ads/analytics" → "ads")
    const segments = pathname.split("/").filter(Boolean);
    const featureKey = segments[0]; // first segment after /

    if (featureKey && disabledFeatures.includes(featureKey)) {
      toast.error(`Cette section n'est pas disponible dans ton espace.`);
      router.replace("/");
    }
  }, [pathname, disabledFeatures, router]);

  return <>{children}</>;
}

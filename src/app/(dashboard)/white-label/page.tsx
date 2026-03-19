"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WhiteLabelRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings?tab=whitelabel");
  }, [router]);

  return null;
}

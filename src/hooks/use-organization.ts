"use client";

import { useEffect, useState, useCallback } from "react";
import type { Database } from "@/types/database";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type OrgRole = "owner" | "admin" | "member";

export interface OrgMember {
  user_id: string;
  role: OrgRole;
  joined_at: string | null;
  invited_at: string;
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface UseOrganizationReturn {
  organization: Organization | null;
  role: OrgRole | null;
  members: OrgMember[];
  loading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  refetch: () => Promise<void>;
}

export function useOrganization(): UseOrganizationReturn {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<OrgRole | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrg = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/whitelabel");
      if (!res.ok) {
        setOrganization(null);
        setRole(null);
        setMembers([]);
        return;
      }

      const data = await res.json();
      setOrganization(data.organization || null);
      setRole(data.role || null);
      setMembers(data.members || []);
    } catch {
      setOrganization(null);
      setRole(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  return {
    organization,
    role,
    members,
    loading,
    isOwner: role === "owner",
    isAdmin: role === "owner" || role === "admin",
    isMember: role === "member",
    refetch: fetchOrg,
  };
}

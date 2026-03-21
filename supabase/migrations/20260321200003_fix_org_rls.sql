-- Fix infinite recursion in organizations RLS policies
-- The SELECT policy referenced organization_members which references organizations → loop

DROP POLICY IF EXISTS "Org members can view their org" ON organizations;
DROP POLICY IF EXISTS "Org owners can update their org" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create orgs" ON organizations;

-- Owner can always see their org (no sub-select needed)
CREATE POLICY "Owner can view own org" ON organizations FOR SELECT
  USING (owner_id = auth.uid());

-- Members can view org via profile.organization_id (breaks recursion)
CREATE POLICY "Members can view their org" ON organizations FOR SELECT
  USING (
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND organization_id IS NOT NULL)
  );

-- Owner can update
CREATE POLICY "Owner can update org" ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

-- Authenticated users can create
CREATE POLICY "Authenticated can create org" ON organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owner can delete
CREATE POLICY "Owner can delete org" ON organizations FOR DELETE
  USING (owner_id = auth.uid());

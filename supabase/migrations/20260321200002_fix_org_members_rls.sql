-- Fix infinite recursion in organization_members RLS policies
-- The old policies did a sub-select on organization_members itself → infinite loop

-- Drop the recursive policies
DROP POLICY IF EXISTS "Org members can view members" ON organization_members;
DROP POLICY IF EXISTS "Org admins can manage members" ON organization_members;

-- Users can see their own membership rows
CREATE POLICY "Users can view own memberships" ON organization_members FOR SELECT
  USING (auth.uid() = user_id);

-- Users can see other members in the same org (via organizations.owner_id to break recursion)
CREATE POLICY "Members can view org peers" ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR auth.uid() = user_id
  );

-- Org owners can insert/update/delete members (checked via organizations table, not self-referencing)
CREATE POLICY "Org owners can manage members" ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

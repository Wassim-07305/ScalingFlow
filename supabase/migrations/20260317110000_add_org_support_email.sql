-- Add support_email to organizations table for white label feature
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS support_email TEXT;

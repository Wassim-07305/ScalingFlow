-- Extend situation CHECK constraint to include new onboarding options
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_situation_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_situation_check
  CHECK (situation IN ('zero', 'salarie', 'freelance', 'entrepreneur', 'etudiant', 'reconversion', 'sans_emploi')) NOT VALID;

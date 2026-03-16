-- ============================================
-- Script : Créer un compte Admin de test
-- ============================================
-- Étape 1 : Crée le user via Supabase Dashboard > Authentication > Add User
--   Email: admin@test.com  |  Password: Admin123!
--
-- Étape 2 : Copie l'UUID du user créé et remplace ci-dessous
-- Étape 3 : Exécute ce script dans le SQL Editor

-- Remplace 'PASTE_USER_UUID_HERE' par l'UUID réel
UPDATE public.profiles
SET
  role = 'admin',
  full_name = 'Admin Test',
  onboarding_completed = true,
  vault_completed = true
WHERE id = 'PASTE_USER_UUID_HERE';

-- Vérification
SELECT id, email, full_name, role, onboarding_completed
FROM public.profiles
WHERE role = 'admin';

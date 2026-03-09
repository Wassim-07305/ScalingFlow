-- ============================================
-- MIGRATION 003 — ACADEMY SEED DATA
-- 6 modules, 20 videos de formation
-- ============================================

-- Module 1 : Créer ton offre irrésistible
INSERT INTO public.academy_modules (id, module_name, module_slug, module_description, module_order, icon, color, total_videos, total_duration_minutes)
VALUES (
  'a0000001-0001-0001-0001-000000000001',
  'Créer ton offre irrésistible',
  'offre-irresistible',
  'Apprends à construire une offre que ton marché ne peut pas refuser : positionnement, mécanisme unique, pricing et garanties.',
  1, 'Package', '#34D399', 4, 52
);

INSERT INTO public.academy_videos (id, module_id, title, description, video_url, duration_minutes, video_order, related_saas_module) VALUES
('b0000001-0001-0001-0001-000000000001', 'a0000001-0001-0001-0001-000000000001', 'Les fondamentaux d''une offre qui vend', 'Comprends les 5 piliers d''une offre irrésistible et pourquoi 90% des entrepreneurs échouent à cette étape.', '', 15, 1, 'offer'),
('b0000001-0001-0001-0001-000000000002', 'a0000001-0001-0001-0001-000000000001', 'Trouver ton mécanisme unique', 'La méthode Dan Kennedy pour créer un mécanisme que personne d''autre ne propose.', '', 12, 2, 'offer'),
('b0000001-0001-0001-0001-000000000003', 'a0000001-0001-0001-0001-000000000001', 'Pricer sans brader', 'La formule 10% du potentiel et les structures hybrides (setup + performance).', '', 13, 3, 'offer'),
('b0000001-0001-0001-0001-000000000004', 'a0000001-0001-0001-0001-000000000001', 'Garanties qui convertissent', 'Les 5 éléments d''une garantie conditionnelle qui élimine le risque pour ton client.', '', 12, 4, 'offer');

-- Module 2 : Maîtriser ton marché
INSERT INTO public.academy_modules (id, module_name, module_slug, module_description, module_order, icon, color, total_videos, total_duration_minutes)
VALUES (
  'a0000001-0001-0001-0001-000000000002',
  'Maîtriser ton marché',
  'maitriser-marche',
  'Analyse ton marché comme un pro : avatar client ultra-détaillé, analyse concurrentielle et niveaux de sophistication Schwartz.',
  2, 'Globe', '#60A5FA', 3, 42
);

INSERT INTO public.academy_videos (id, module_id, title, description, video_url, duration_minutes, video_order, related_saas_module) VALUES
('b0000001-0001-0001-0001-000000000005', 'a0000001-0001-0001-0001-000000000002', 'PersonaForge : créer ton avatar client', 'La méthode en 4 niveaux pour créer un avatar client ultra-détaillé.', '', 15, 1, 'market'),
('b0000001-0001-0001-0001-000000000006', 'a0000001-0001-0001-0001-000000000002', 'Analyse concurrentielle IA', 'Comment identifier les gaps de marché et te positionner face à tes concurrents.', '', 14, 2, 'market'),
('b0000001-0001-0001-0001-000000000007', 'a0000001-0001-0001-0001-000000000002', 'Les 5 niveaux de sophistication Schwartz', 'Comprendre où en est ton marché pour adapter ta communication.', '', 13, 3, 'market');

-- Module 3 : Construire ton funnel
INSERT INTO public.academy_modules (id, module_name, module_slug, module_description, module_order, icon, color, total_videos, total_duration_minutes)
VALUES (
  'a0000001-0001-0001-0001-000000000003',
  'Construire ton funnel de vente',
  'funnel-vente',
  'Les 3 types de funnels (VSL, Social, Webinar) et comment les construire étape par étape.',
  3, 'Filter', '#A78BFA', 4, 58
);

INSERT INTO public.academy_videos (id, module_id, title, description, video_url, duration_minutes, video_order, related_saas_module) VALUES
('b0000001-0001-0001-0001-000000000008', 'a0000001-0001-0001-0001-000000000003', 'Les 3 types de funnels', 'VSL Funnel, Social Funnel, Webinar Funnel — lequel choisir selon ton parcours.', '', 14, 1, 'funnel'),
('b0000001-0001-0001-0001-000000000009', 'a0000001-0001-0001-0001-000000000003', 'Écrire un script VSL qui convertit', 'Les 3 structures de VSL (DSL, Education-based, Case Study) et quand les utiliser.', '', 16, 2, 'funnel'),
('b0000001-0001-0001-0001-000000000010', 'a0000001-0001-0001-0001-000000000003', 'La page de capture parfaite', 'Anatomie d''une landing page qui convertit à +40%.', '', 14, 3, 'funnel'),
('b0000001-0001-0001-0001-000000000011', 'a0000001-0001-0001-0001-000000000003', 'Séquences email et SMS', 'Comment relancer tes leads avec des séquences automatisées.', '', 14, 4, 'funnel');

-- Module 4 : Créer des publicités qui convertissent
INSERT INTO public.academy_modules (id, module_name, module_slug, module_description, module_order, icon, color, total_videos, total_duration_minutes)
VALUES (
  'a0000001-0001-0001-0001-000000000004',
  'Créer des publicités qui convertissent',
  'publicites-conversion',
  'Maîtrise la création de publicités Meta : hooks, copy, vidéo, ciblage et optimisation.',
  4, 'Megaphone', '#F59E0B', 3, 44
);

INSERT INTO public.academy_videos (id, module_id, title, description, video_url, duration_minutes, video_order, related_saas_module) VALUES
('b0000001-0001-0001-0001-000000000012', 'a0000001-0001-0001-0001-000000000004', 'Les hooks qui arrêtent le scroll', 'Les 7 frameworks de hooks qui captent l''attention en 3 secondes.', '', 15, 1, 'ads'),
('b0000001-0001-0001-0001-000000000013', 'a0000001-0001-0001-0001-000000000004', 'Copywriting publicitaire', 'PAS, AIDA, storytelling — les structures de copy qui vendent.', '', 14, 2, 'ads'),
('b0000001-0001-0001-0001-000000000014', 'a0000001-0001-0001-0001-000000000004', 'Lancer et optimiser tes campagnes', 'Structure CBO, budgets, KPIs à suivre les 10 premiers jours.', '', 15, 3, 'ads');

-- Module 5 : Stratégie de contenu
INSERT INTO public.academy_modules (id, module_name, module_slug, module_description, module_order, icon, color, total_videos, total_duration_minutes)
VALUES (
  'a0000001-0001-0001-0001-000000000005',
  'Stratégie de contenu K/L/T/C',
  'strategie-contenu',
  'La méthode Know/Like/Trust/Convert pour créer du contenu qui attire, engage et convertit.',
  5, 'PenTool', '#EC4899', 3, 40
);

INSERT INTO public.academy_videos (id, module_id, title, description, video_url, duration_minutes, video_order, related_saas_module) VALUES
('b0000001-0001-0001-0001-000000000015', 'a0000001-0001-0001-0001-000000000005', 'Les 4 piliers K/L/T/C', 'Know, Like, Trust, Convert — le ratio parfait pour ton calendrier éditorial.', '', 14, 1, 'content'),
('b0000001-0001-0001-0001-000000000016', 'a0000001-0001-0001-0001-000000000005', 'Créer des Reels qui explosent', 'Hooks, corps, CTA — la structure en 60 secondes qui génère des vues.', '', 13, 2, 'content'),
('b0000001-0001-0001-0001-000000000017', 'a0000001-0001-0001-0001-000000000005', 'Optimiser ton profil Instagram', 'Bio, highlights, CTA, grille visuelle — tout pour convertir les visiteurs en followers.', '', 13, 3, 'content');

-- Module 6 : Closer tes ventes
INSERT INTO public.academy_modules (id, module_name, module_slug, module_description, module_order, icon, color, total_videos, total_duration_minutes)
VALUES (
  'a0000001-0001-0001-0001-000000000006',
  'Closer tes ventes',
  'closer-ventes',
  'Scripts de setting, techniques de closing et gestion des objections pour maximiser ton taux de conversion.',
  6, 'Handshake', '#EF4444', 3, 38
);

INSERT INTO public.academy_videos (id, module_id, title, description, video_url, duration_minutes, video_order, related_saas_module) VALUES
('b0000001-0001-0001-0001-000000000018', 'a0000001-0001-0001-0001-000000000006', 'Le script de setting parfait', 'Les 6 phases d''un appel de qualification qui prépare le closing.', '', 13, 1, 'sales'),
('b0000001-0001-0001-0001-000000000019', 'a0000001-0001-0001-0001-000000000006', 'Techniques de closing avancées', 'Les 5 techniques pour closer sans être pushy.', '', 13, 2, 'sales'),
('b0000001-0001-0001-0001-000000000020', 'a0000001-0001-0001-0001-000000000006', 'Gérer les objections', 'Les réponses aux 10 objections les plus courantes et comment les transformer en ventes.', '', 12, 3, 'sales');

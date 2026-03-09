-- ============================================
-- ScalingFlow Academy — Seed Data
-- Execute dans le SQL Editor de Supabase
-- ============================================

-- Module 1: Fondamentaux du Business en Ligne
INSERT INTO academy_modules (module_name, module_slug, module_description, module_order, icon, color, total_videos, total_duration_minutes)
VALUES (
  'Fondamentaux du Business en Ligne',
  'fondamentaux-business',
  'Comprends les bases du business en ligne : mindset, modeles economiques, et comment choisir ta niche rentable.',
  1, 'BookOpen', 'emerald', 5, 47
) ON CONFLICT (module_slug) DO NOTHING;

-- Module 2: Analyse de Marche & Positionnement
INSERT INTO academy_modules (module_name, module_slug, module_description, module_order, icon, color, total_videos, total_duration_minutes)
VALUES (
  'Analyse de Marche & Positionnement',
  'analyse-marche',
  'Apprends a analyser ton marche, identifier ton avatar client ideal, et te positionner comme la reference.',
  2, 'Target', 'blue', 5, 52
) ON CONFLICT (module_slug) DO NOTHING;

-- Module 3: Creation d''Offre Irresistible
INSERT INTO academy_modules (module_name, module_slug, module_description, module_order, icon, color, total_videos, total_duration_minutes)
VALUES (
  'Creation d''Offre Irresistible',
  'creation-offre',
  'Construis une offre que ton marche ne peut pas refuser : pricing, garanties, mecanisme unique et OTO.',
  3, 'Package', 'orange', 6, 58
) ON CONFLICT (module_slug) DO NOTHING;

-- Module 4: Funnel de Conversion
INSERT INTO academy_modules (module_name, module_slug, module_description, module_order, icon, color, total_videos, total_duration_minutes)
VALUES (
  'Funnel de Conversion',
  'funnel-conversion',
  'Maitrise les 3 pages cles de ton funnel : opt-in, VSL, et page de remerciement avec upsell.',
  4, 'Filter', 'purple', 5, 45
) ON CONFLICT (module_slug) DO NOTHING;

-- Module 5: Copywriting & Persuasion
INSERT INTO academy_modules (module_name, module_slug, module_description, module_order, icon, color, total_videos, total_duration_minutes)
VALUES (
  'Copywriting & Persuasion',
  'copywriting-persuasion',
  'Les techniques de copywriting qui convertissent : headlines, storytelling, CTA et sequences email.',
  5, 'PenTool', 'pink', 5, 50
) ON CONFLICT (module_slug) DO NOTHING;

-- Module 6: Publicite & Acquisition
INSERT INTO academy_modules (module_name, module_slug, module_description, module_order, icon, color, total_videos, total_duration_minutes)
VALUES (
  'Publicite & Acquisition',
  'publicite-acquisition',
  'Lance tes campagnes publicitaires : Meta Ads, hooks qui captent, creatives qui convertissent.',
  6, 'Megaphone', 'red', 5, 55
) ON CONFLICT (module_slug) DO NOTHING;

-- Module 7: Contenu & Personal Branding
INSERT INTO academy_modules (module_name, module_slug, module_description, module_order, icon, color, total_videos, total_duration_minutes)
VALUES (
  'Contenu & Personal Branding',
  'contenu-branding',
  'Cree du contenu qui attire et convertit : strategie editoriale, Reels, YouTube, et calendrier de publication.',
  7, 'Palette', 'cyan', 5, 48
) ON CONFLICT (module_slug) DO NOTHING;

-- Module 8: Vente & Closing
INSERT INTO academy_modules (module_name, module_slug, module_description, module_order, icon, color, total_videos, total_duration_minutes)
VALUES (
  'Vente & Closing',
  'vente-closing',
  'Maitrise l''art de la vente : scripts de decouverte, traitement des objections, et techniques de closing.',
  8, 'Handshake', 'yellow', 5, 42
) ON CONFLICT (module_slug) DO NOTHING;

-- ============================================
-- Videos pour chaque module
-- ============================================

-- Videos Module 1: Fondamentaux
INSERT INTO academy_videos (module_id, title, description, video_url, duration_minutes, video_order, related_saas_module)
SELECT m.id, v.title, v.description, v.video_url, v.duration_minutes, v.video_order, v.related_saas_module
FROM academy_modules m,
(VALUES
  ('Le mindset de l''entrepreneur digital', 'Les croyances qui separent ceux qui reussissent de ceux qui abandonnent.', 'https://www.loom.com/share/placeholder-1-1', 10, 1, NULL),
  ('Les 5 modeles de business en ligne', 'Coaching, formation, SaaS, e-commerce, affiliation : lequel choisir ?', 'https://www.loom.com/share/placeholder-1-2', 12, 2, NULL),
  ('Trouver ta niche rentable', 'La methode pour identifier une niche avec de la demande et peu de concurrence.', 'https://www.loom.com/share/placeholder-1-3', 8, 3, 'market'),
  ('Definir tes objectifs SMART', 'Comment fixer des objectifs mesurables et les atteindre en 90 jours.', 'https://www.loom.com/share/placeholder-1-4', 9, 4, 'roadmap'),
  ('Tour de la plateforme ScalingFlow', 'Decouvre tous les outils IA a ta disposition pour scaler ton business.', 'https://www.loom.com/share/placeholder-1-5', 8, 5, NULL)
) AS v(title, description, video_url, duration_minutes, video_order, related_saas_module)
WHERE m.module_slug = 'fondamentaux-business'
ON CONFLICT DO NOTHING;

-- Videos Module 2: Analyse de Marche
INSERT INTO academy_videos (module_id, title, description, video_url, duration_minutes, video_order, related_saas_module)
SELECT m.id, v.title, v.description, v.video_url, v.duration_minutes, v.video_order, v.related_saas_module
FROM academy_modules m,
(VALUES
  ('Analyser la demande de ton marche', 'Utilise les signaux de demande pour valider que ton marche est viable.', 'https://www.loom.com/share/placeholder-2-1', 11, 1, 'market'),
  ('Creer ton avatar client ideal', 'La methode pour definir precisement qui est ton client et ce qu''il veut.', 'https://www.loom.com/share/placeholder-2-2', 10, 2, 'market'),
  ('Analyser la concurrence', 'Comment etudier tes concurrents pour trouver ton angle differenciateur.', 'https://www.loom.com/share/placeholder-2-3', 12, 3, 'market'),
  ('Le Vault : ton diagnostic IA', 'Comment utiliser le Vault ScalingFlow pour obtenir un diagnostic personnalise.', 'https://www.loom.com/share/placeholder-2-4', 9, 4, 'vault'),
  ('Valider ta niche avec des donnees', 'Les metriques a verifier avant de te lancer a fond sur ton marche.', 'https://www.loom.com/share/placeholder-2-5', 10, 5, 'market')
) AS v(title, description, video_url, duration_minutes, video_order, related_saas_module)
WHERE m.module_slug = 'analyse-marche'
ON CONFLICT DO NOTHING;

-- Videos Module 3: Creation d'Offre
INSERT INTO academy_videos (module_id, title, description, video_url, duration_minutes, video_order, related_saas_module)
SELECT m.id, v.title, v.description, v.video_url, v.duration_minutes, v.video_order, v.related_saas_module
FROM academy_modules m,
(VALUES
  ('L''anatomie d''une offre irresistible', 'Les 7 composants d''une offre que personne ne peut refuser.', 'https://www.loom.com/share/placeholder-3-1', 10, 1, 'offer'),
  ('Trouver ton mecanisme unique', 'Comment creer un concept proprietaire qui te differencie de tous.', 'https://www.loom.com/share/placeholder-3-2', 9, 2, 'offer'),
  ('Strategie de pricing et valeur percue', 'Prix ancre, decomposition de valeur, et psychologie du prix.', 'https://www.loom.com/share/placeholder-3-3', 11, 3, 'offer'),
  ('Garanties et inversion du risque', 'Elimine toute hesitation avec des garanties qui rassurent.', 'https://www.loom.com/share/placeholder-3-4', 8, 4, 'offer'),
  ('Construire ton OTO (One-Time Offer)', 'L''upsell qui booste ta valeur par client de 30 a 50%.', 'https://www.loom.com/share/placeholder-3-5', 10, 5, 'offer'),
  ('Le Category OS : domine ta categorie', 'Positionne-toi comme createur de categorie avec le Category Design.', 'https://www.loom.com/share/placeholder-3-6', 10, 6, 'offer')
) AS v(title, description, video_url, duration_minutes, video_order, related_saas_module)
WHERE m.module_slug = 'creation-offre'
ON CONFLICT DO NOTHING;

-- Videos Module 4: Funnel
INSERT INTO academy_videos (module_id, title, description, video_url, duration_minutes, video_order, related_saas_module)
SELECT m.id, v.title, v.description, v.video_url, v.duration_minutes, v.video_order, v.related_saas_module
FROM academy_modules m,
(VALUES
  ('Architecture d''un funnel qui convertit', 'Les 3 pages essentielles et le parcours ideal de ton prospect.', 'https://www.loom.com/share/placeholder-4-1', 10, 1, 'funnel'),
  ('La page opt-in parfaite', 'Headline, bullet points, CTA : les elements qui captent les emails.', 'https://www.loom.com/share/placeholder-4-2', 9, 2, 'funnel'),
  ('Creer une VSL qui vend', 'La structure en 12 etapes d''une Video Sales Letter efficace.', 'https://www.loom.com/share/placeholder-4-3', 11, 3, 'funnel'),
  ('La page de remerciement strategique', 'Transforme ta thank you page en machine a upsell.', 'https://www.loom.com/share/placeholder-4-4', 8, 4, 'funnel'),
  ('Optimiser ton taux de conversion', 'Les metriques a suivre et les leviers pour ameliorer tes resultats.', 'https://www.loom.com/share/placeholder-4-5', 7, 5, 'funnel')
) AS v(title, description, video_url, duration_minutes, video_order, related_saas_module)
WHERE m.module_slug = 'funnel-conversion'
ON CONFLICT DO NOTHING;

-- Videos Module 5: Copywriting
INSERT INTO academy_videos (module_id, title, description, video_url, duration_minutes, video_order, related_saas_module)
SELECT m.id, v.title, v.description, v.video_url, v.duration_minutes, v.video_order, v.related_saas_module
FROM academy_modules m,
(VALUES
  ('Les fondamentaux du copywriting', 'AIDA, PAS, 4U : les frameworks qui font vendre depuis 100 ans.', 'https://www.loom.com/share/placeholder-5-1', 10, 1, 'assets'),
  ('Ecrire des headlines magnetiques', '7 formules de headlines testees qui captent l''attention instantanement.', 'https://www.loom.com/share/placeholder-5-2', 10, 2, 'assets'),
  ('Le storytelling qui convertit', 'Comment raconter une histoire qui cree une connexion emotionnelle.', 'https://www.loom.com/share/placeholder-5-3', 11, 3, 'assets'),
  ('Sequences email qui rapportent', 'Les 5 emails post-inscription qui transforment un lead en client.', 'https://www.loom.com/share/placeholder-5-4', 10, 4, 'assets'),
  ('Scripts SMS et relance', 'Les SMS de suivi qui relancent sans etre intrusif.', 'https://www.loom.com/share/placeholder-5-5', 9, 5, 'assets')
) AS v(title, description, video_url, duration_minutes, video_order, related_saas_module)
WHERE m.module_slug = 'copywriting-persuasion'
ON CONFLICT DO NOTHING;

-- Videos Module 6: Publicite
INSERT INTO academy_videos (module_id, title, description, video_url, duration_minutes, video_order, related_saas_module)
SELECT m.id, v.title, v.description, v.video_url, v.duration_minutes, v.video_order, v.related_saas_module
FROM academy_modules m,
(VALUES
  ('Les bases de Meta Ads', 'Structure de campagne, ciblage, et budget pour debutants.', 'https://www.loom.com/share/placeholder-6-1', 12, 1, 'ads'),
  ('Creer des hooks qui captent', 'Les 3 premieres secondes qui font la difference entre scroll et clic.', 'https://www.loom.com/share/placeholder-6-2', 10, 2, 'ads'),
  ('Creatives video qui convertissent', 'Les formats et structures de video ads qui marchent en 2026.', 'https://www.loom.com/share/placeholder-6-3', 11, 3, 'ads'),
  ('Retargeting et audiences', 'Comment relancer ceux qui t''ont deja vu pour maximiser ton ROAS.', 'https://www.loom.com/share/placeholder-6-4', 12, 4, 'ads'),
  ('Analyser et optimiser tes campagnes', 'Les KPIs a suivre et comment scaler tes ads gagnantes.', 'https://www.loom.com/share/placeholder-6-5', 10, 5, 'ads')
) AS v(title, description, video_url, duration_minutes, video_order, related_saas_module)
WHERE m.module_slug = 'publicite-acquisition'
ON CONFLICT DO NOTHING;

-- Videos Module 7: Contenu & Branding
INSERT INTO academy_videos (module_id, title, description, video_url, duration_minutes, video_order, related_saas_module)
SELECT m.id, v.title, v.description, v.video_url, v.duration_minutes, v.video_order, v.related_saas_module
FROM academy_modules m,
(VALUES
  ('Ta strategie de contenu en 30 min', 'Definis tes piliers de contenu, ta frequence et tes objectifs.', 'https://www.loom.com/share/placeholder-7-1', 10, 1, 'content'),
  ('Creer des Reels viraux', 'Les structures de Reels qui generent des milliers de vues.', 'https://www.loom.com/share/placeholder-7-2', 9, 2, 'content'),
  ('YouTube : la machine a leads', 'Comment YouTube peut generer des leads qualifies en automatique.', 'https://www.loom.com/share/placeholder-7-3', 11, 3, 'content'),
  ('Construire ton identite de marque', 'Nom, palette, ton de voix : cree une marque memorable.', 'https://www.loom.com/share/placeholder-7-4', 9, 4, 'brand'),
  ('Le calendrier editorial parfait', 'Planifie un mois de contenu en une seule session.', 'https://www.loom.com/share/placeholder-7-5', 9, 5, 'content')
) AS v(title, description, video_url, duration_minutes, video_order, related_saas_module)
WHERE m.module_slug = 'contenu-branding'
ON CONFLICT DO NOTHING;

-- Videos Module 8: Vente & Closing
INSERT INTO academy_videos (module_id, title, description, video_url, duration_minutes, video_order, related_saas_module)
SELECT m.id, v.title, v.description, v.video_url, v.duration_minutes, v.video_order, v.related_saas_module
FROM academy_modules m,
(VALUES
  ('Le script de decouverte', 'Les questions qui revelent les vrais besoins de ton prospect.', 'https://www.loom.com/share/placeholder-8-1', 9, 1, 'sales'),
  ('Presenter ton offre avec impact', 'La structure de presentation qui cree l''urgence et le desir.', 'https://www.loom.com/share/placeholder-8-2', 8, 2, 'sales'),
  ('Traiter les objections', 'Les 5 objections les plus courantes et comment les retourner.', 'https://www.loom.com/share/placeholder-8-3', 10, 3, 'sales'),
  ('Techniques de closing ethique', 'Closer sans manipuler : les techniques basees sur la valeur.', 'https://www.loom.com/share/placeholder-8-4', 8, 4, 'sales'),
  ('Le suivi post-vente', 'Transforme tes clients en ambassadeurs avec un suivi structure.', 'https://www.loom.com/share/placeholder-8-5', 7, 5, 'sales')
) AS v(title, description, video_url, duration_minutes, video_order, related_saas_module)
WHERE m.module_slug = 'vente-closing'
ON CONFLICT DO NOTHING;

-- ============================================================
-- ScalingFlow — Données de démonstration pour Wassim
-- Exécuter dans le SQL Editor de Supabase APRÈS seed-demo.sql
-- ============================================================

DO $$
DECLARE
  demo_user_id UUID := 'cbe731dd-c0e4-442a-8f1b-a99db5dfc39d';
  market1_id UUID := gen_random_uuid();
  market2_id UUID := gen_random_uuid();
  market3_id UUID := gen_random_uuid();
  offer_id UUID := gen_random_uuid();
  funnel_id UUID := gen_random_uuid();
  brand_id UUID := gen_random_uuid();
  campaign1_id UUID := gen_random_uuid();
  campaign2_id UUID := gen_random_uuid();
BEGIN

-- ─── 1. PROFIL COMPLET ───────────────────────────────────
UPDATE profiles SET
  full_name = 'Wassim Belkacem',
  first_name = 'Wassim',
  last_name = 'Belkacem',
  onboarding_completed = true,
  onboarding_step = 10,
  skills = ARRAY['Coaching business', 'Stratégie e-commerce', 'Facebook Ads', 'Copywriting', 'Webinaires'],
  experience_level = 'advanced',
  current_revenue = 8500,
  target_revenue = 30000,
  industries = ARRAY['E-commerce', 'Coaching', 'Formation en ligne'],
  objectives = ARRAY['Scaler à 30K/mois', 'Automatiser l''acquisition', 'Lancer un programme premium'],
  budget_monthly = 3000,
  situation = 'entrepreneur',
  situation_details = '{"business_type": "coaching", "years_in_business": 3, "team_size": 2, "current_clients": 12}'::jsonb,
  formations = ARRAY['Bootcamp Growth Hacking', 'Masterclass Facebook Ads', 'Formation Copywriting Persuasif'],
  parcours = 'B',
  vault_skills = '[
    {"name": "Facebook Ads", "level": "expert", "details": "5 ans d''expérience, +500K€ dépensés"},
    {"name": "Copywriting", "level": "avancé", "details": "Formé chez Copy School"},
    {"name": "Stratégie e-commerce", "level": "expert", "details": "Accompagné +50 e-commerçants"},
    {"name": "Webinaires", "level": "intermédiaire", "details": "10 webinaires réalisés"},
    {"name": "Management", "level": "débutant", "details": "En cours de structuration"}
  ]'::jsonb,
  expertise_answers = '{"biggest_win": "Passage de 0 à 8.5K/mois en 6 mois", "biggest_challenge": "Automatiser sans perdre en qualité", "unique_approach": "Méthode SCALE en 5 étapes"}'::jsonb,
  hours_per_week = 45,
  deadline = '6 mois',
  team_size = 2,
  vault_completed = true,
  vault_analysis = '{
    "radar": {"marketing": 85, "sales": 75, "product": 90, "operations": 55, "finance": 60, "leadership": 50},
    "global_score": 72,
    "forces": ["Expertise technique solide en ads et copywriting", "Track record prouvé avec +50 clients", "Méthode propriétaire SCALE"],
    "faiblesses": ["Management et délégation à structurer", "Processus opérationnels à documenter", "Finance et prévisions à renforcer"],
    "recommandations": ["Recruter un closer/setter dédié", "Documenter la méthode SCALE dans un playbook", "Mettre en place un dashboard financier mensuel"],
    "parcours_ideal": "B — Entrepreneur en phase de scaling",
    "next_milestone": "Atteindre 15K/mois récurrent"
  }'::jsonb,
  selected_market = 'E-commerce coaching',
  market_viability_score = 87,
  niche = 'Coaching scaling e-commerce pour entrepreneurs francophones',
  xp_points = 3200,
  level = 10,
  streak_days = 18,
  last_active_date = CURRENT_DATE,
  badges = ARRAY['first_market', 'first_offer', 'first_funnel', 'first_ad', 'streak_7', 'streak_14', 'content_creator'],
  global_progress = 75.0,
  country = 'France',
  language = 'fr'
WHERE id = demo_user_id;

-- ─── 2. ANALYSES DE MARCHÉ ──────────────────────────────
INSERT INTO market_analyses (id, user_id, market_name, market_description, problems, opportunities, competitors, viability_score, recommended_positioning, target_avatar, persona, schwartz_level, country, language, selected, ai_raw_response, created_at) VALUES
(market1_id, demo_user_id, 'Coaching E-commerce Premium',
 'Marché du coaching business pour e-commerçants francophones voulant scaler de 5K à 50K/mois',
 ARRAY['Difficulté à scaler au-delà de 10K/mois', 'Dépendance au paid ads sans stratégie', 'Manque de structure opérationnelle', 'Pas de système de vente automatisé'],
 ARRAY['Marché en forte croissance (+35%/an)', 'Peu de coaches spécialisés e-commerce en FR', 'Ticket moyen élevé (2K-5K€)', 'Forte demande de programmes structurés'],
 '[{"name": "Yomi Denzel", "positioning": "Formation dropshipping débutant", "pricing_estimate": "997€"},
   {"name": "Maxence Rigottier", "positioning": "Business en ligne généraliste", "pricing_estimate": "1497€"},
   {"name": "Romain Music", "positioning": "E-commerce Shopify", "pricing_estimate": "2000€"}]'::jsonb,
 87, 'Expert scaling e-commerce — La méthode SCALE pour passer de 5K à 50K/mois',
 '{"name": "Thomas", "age": 28, "situation": "E-commerçant depuis 1-2 ans", "revenue": "5K-15K/mois", "frustration": "Bloqué au même palier depuis 6 mois", "desire": "Scaler à 30K+ sans travailler plus", "objection": "J''ai déjà essayé des formations sans résultat"}'::jsonb,
 '{"prenom": "Thomas", "age": 28, "profession": "E-commerçant", "revenu_actuel": "8K/mois", "objectif": "30K/mois en 90 jours", "peur_principale": "Investir sans ROI", "canal_prefere": "Instagram + YouTube"}'::jsonb,
 3, 'France', 'fr', true,
 '{"analysis_date": "2026-03-01", "confidence": 0.92}'::jsonb,
 NOW() - INTERVAL '30 days'),

(market2_id, demo_user_id, 'Formation Ads pour agences',
 'Marché de la formation Facebook/Meta Ads pour les agences marketing',
 ARRAY['Agences qui gèrent mal les budgets ads', 'Pas de méthodologie structurée', 'Difficulté à retenir les clients'],
 ARRAY['Besoin constant de formation continue', 'Budget formation des agences en hausse'],
 '[]'::jsonb,
 62, 'Formation avancée Meta Ads pour agences',
 '{}'::jsonb, '{}'::jsonb, 2, 'France', 'fr', false,
 '{"analysis_date": "2026-03-05"}'::jsonb,
 NOW() - INTERVAL '25 days'),

(market3_id, demo_user_id, 'SaaS tools pour e-commerçants',
 'Outils SaaS de productivité et automatisation pour boutiques e-commerce',
 ARRAY['Trop d''outils différents à gérer', 'Intégrations complexes'],
 ARRAY['Marché SaaS en croissance', 'Besoin d''outils tout-en-un'],
 '[]'::jsonb,
 45, 'Plateforme tout-en-un e-commerce',
 '{}'::jsonb, '{}'::jsonb, 1, 'France', 'fr', false,
 '{"analysis_date": "2026-03-08"}'::jsonb,
 NOW() - INTERVAL '20 days');

-- ─── 3. CONCURRENTS ─────────────────────────────────────
INSERT INTO competitors (user_id, market_analysis_id, competitor_name, positioning, pricing, strengths, weaknesses, gap_opportunity, source) VALUES
(demo_user_id, market1_id, 'Yomi Denzel', 'Formation dropshipping pour débutants', '997€ - 2997€',
 ARRAY['Grande audience YouTube', 'Branding fort', 'Communauté active'],
 ARRAY['Focalisé débutants', 'Pas de suivi personnalisé', 'Pas de coaching 1:1'],
 'Coaching premium personnalisé pour e-commerçants intermédiaires/avancés', 'YouTube + site web'),

(demo_user_id, market1_id, 'Maxence Rigottier', 'Business en ligne généraliste', '1497€',
 ARRAY['Multi-niche', 'Beaucoup de contenu gratuit', 'Réseau d''affiliés'],
 ARRAY['Pas spécialisé e-commerce', 'Formations datées', 'Peu de résultats récents'],
 'Spécialisation e-commerce avec résultats prouvés récents', 'Blog + YouTube'),

(demo_user_id, market1_id, 'Romain Music', 'E-commerce Shopify avancé', '2000€ - 5000€',
 ARRAY['Résultats prouvés', 'Bonne réputation', 'Contenu technique solide'],
 ARRAY['Peu de présence sur les réseaux', 'Pas de programme de group coaching', 'Pas de communauté'],
 'Programme hybride group coaching + communauté active', 'Site web');

-- ─── 4. OFFRE PRINCIPALE ────────────────────────────────
INSERT INTO offers (id, user_id, market_analysis_id, offer_name, positioning, unique_mechanism, pricing_strategy, guarantees, no_brainer_element, risk_reversal, delivery_structure, status, ai_raw_response, created_at) VALUES
(offer_id, demo_user_id, market1_id,
 'Programme SCALE — De 5K à 30K/mois en 90 jours',
 'Le seul programme de coaching e-commerce qui garantit le passage à 30K/mois grâce à la méthode SCALE en 5 piliers',
 'La Méthode SCALE™ : Stratégie → Copywriting → Ads → Leads → Exécution — un framework propriétaire testé sur +50 e-commerçants',
 '{"main_price": 3997, "payment_plan": "3x 1399€", "currency": "EUR", "positioning": "premium", "anchor_price": 8000, "justification": "ROI moyen de 5x en 90 jours"}'::jsonb,
 '["Garantie résultats : si tu n''atteins pas +50% de CA en 90 jours, on continue gratuitement", "Garantie satisfaction : remboursement intégral sous 14 jours", "Garantie accès : accès à vie aux mises à jour du programme"]'::jsonb,
 'Audit gratuit de ton business e-commerce (valeur 500€) + 1 mois de coaching offert si tu rejoins cette semaine',
 'Garantie 90 jours : +50% de CA ou coaching prolongé gratuitement. Aucun risque pour toi.',
 '{"modules": [
    {"name": "Module 1 — Stratégie", "description": "Positionnement, offre irrésistible, pricing", "duration": "Semaines 1-2"},
    {"name": "Module 2 — Copywriting", "description": "Pages de vente, emails, scripts", "duration": "Semaines 3-4"},
    {"name": "Module 3 — Ads", "description": "Facebook/Instagram Ads avancé", "duration": "Semaines 5-6"},
    {"name": "Module 4 — Leads", "description": "Système d''acquisition automatisé", "duration": "Semaines 7-8"},
    {"name": "Module 5 — Exécution", "description": "Scaling, équipe, automatisation", "duration": "Semaines 9-12"}
  ], "bonuses": ["Communauté privée Slack", "Templates et swipe files", "2 calls groupe/semaine", "1 call 1:1/mois"]}'::jsonb,
 'validated',
 '{"generated_at": "2026-03-02", "model": "claude"}'::jsonb,
 NOW() - INTERVAL '28 days');

UPDATE offers SET
  oto_offer = '{"oto_name": "Pack Accélérateur", "oto_price": 997, "oto_description": "Templates ads prêts à l''emploi + audit mensuel de tes campagnes pendant 6 mois", "oto_benefits": ["50 templates de publicités testés", "Audit mensuel personnalisé", "Accès au groupe VIP"]}'::jsonb,
  ai_raw_response = '{"offer_name": "Programme SCALE", "price": 3997, "target": "E-commerçants 5K-15K/mois", "unique_mechanism": "Méthode SCALE en 5 piliers", "guarantee": "Résultats en 90 jours ou coaching prolongé", "delivery": {"format": "Coaching hybride", "duration": "12 semaines", "calls_per_week": 2, "platform": "Zoom + Slack", "resources": "Vidéos + Templates + Playbooks"}}'::jsonb
WHERE id = offer_id;

-- ─── 5. FUNNEL ──────────────────────────────────────────
INSERT INTO funnels (id, user_id, offer_id, funnel_name, optin_page, vsl_page, thankyou_page, status, total_visits, total_optins, conversion_rate, created_at) VALUES
(funnel_id, demo_user_id, offer_id,
 'Funnel SCALE — Audit Gratuit',
 '{"headline": "Découvre pourquoi 93% des e-commerçants restent bloqués sous 10K/mois", "subheadline": "Et comment la méthode SCALE permet de passer à 30K/mois en 90 jours", "bullet_points": ["Les 3 erreurs qui plafonnent ton CA", "La stratégie exacte pour doubler ton ROAS en 30 jours", "Comment automatiser 80% de ton acquisition client"], "cta_text": "Réserve ton audit gratuit →", "social_proof_text": "+50 e-commerçants accompagnés"}'::jsonb,
 '{"headline": "La Méthode SCALE : Le système complet pour passer de 5K à 30K/mois", "intro_text": "Dans cette vidéo, je te montre exactement comment mes clients passent de 5K à 30K/mois.", "benefit_bullets": ["Un positionnement premium", "Des publicités qui convertissent à 3-5x ROAS", "Un système d''acquisition automatique"], "faq": [{"question": "Est-ce adapté à mon e-commerce ?", "answer": "Testé sur +50 niches différentes."}]}'::jsonb,
 '{"confirmation_message": "Ton audit gratuit est confirmé !", "next_steps": ["Vérifie ta boîte mail", "Bloque 45 minutes dans ton agenda", "Prépare tes chiffres clés"], "upsell_headline": "Pack Accélérateur", "upsell_cta": "Ajouter le Pack — 997€"}'::jsonb,
 'published', 1247, 312, 25.02,
 NOW() - INTERVAL '25 days');

-- ─── 6. BRAND IDENTITY ──────────────────────────────────
INSERT INTO brand_identities (id, user_id, offer_id, brand_names, selected_name, art_direction, logo_concept, brand_kit, status, created_at) VALUES
(brand_id, demo_user_id, offer_id,
 '["ScaleFlow", "GrowthPulse", "E-Scale Academy"]'::jsonb,
 'ScaleFlow',
 '{"style": "Moderne et premium", "mood": "Confiance, croissance, énergie", "colors": ["#34D399", "#0B0E11", "#FFFFFF"]}'::jsonb,
 'Logo minimaliste avec une flèche ascendante intégrée dans le S de Scale.',
 '{"primary_color": "#34D399", "secondary_color": "#0B0E11", "accent_color": "#60A5FA", "font_heading": "Satoshi", "font_body": "Inter", "tone_of_voice": "Expert mais accessible"}'::jsonb,
 'validated',
 NOW() - INTERVAL '22 days');

-- ─── 7. SALES ASSETS ────────────────────────────────────
INSERT INTO sales_assets (user_id, offer_id, asset_type, title, content, ai_raw_response, status, created_at) VALUES
(demo_user_id, offer_id, 'vsl_script', 'VSL — Programme SCALE',
 'Script VSL de 15 minutes pour le programme SCALE',
 '{"hook": "Si tu fais entre 5K et 15K par mois en e-commerce... reste jusqu''au bout de cette vidéo.", "problem": "93% des e-commerçants restent bloqués au même palier.", "solution": "La méthode SCALE est un système en 5 piliers.", "proof": "Thomas est passé de 7K à 28K en 87 jours.", "close": "Réserve ton audit gratuit maintenant."}'::jsonb,
 'validated', NOW() - INTERVAL '20 days'),
(demo_user_id, offer_id, 'email_sequence', 'Séquence Email — Nurturing SCALE',
 'Séquence de 7 emails pour convertir les leads',
 '{"emails": [{"subject": "Ton audit gratuit est confirmé ✓", "type": "confirmation"}, {"subject": "Les 3 erreurs qui plafonnent ton CA", "type": "value"}, {"subject": "Comment Thomas est passé de 7K à 28K/mois", "type": "case_study"}, {"subject": "Ta place se libère demain", "type": "urgency"}, {"subject": "Dernière chance — Audit gratuit", "type": "last_call"}]}'::jsonb,
 'validated', NOW() - INTERVAL '18 days'),
(demo_user_id, offer_id, 'sales_script', 'Script de Vente — Call SCALE',
 'Script pour l''appel de closing',
 '{"phases": [{"name": "Rapport", "duration": "5 min"}, {"name": "Diagnostic", "duration": "15 min"}, {"name": "Vision", "duration": "5 min"}, {"name": "Présentation", "duration": "10 min"}, {"name": "Closing", "duration": "10 min"}]}'::jsonb,
 'validated', NOW() - INTERVAL '16 days'),
(demo_user_id, offer_id, 'lead_magnet', 'Checklist — 10 Actions pour Scaler',
 'Lead magnet PDF',
 '{"title": "La Checklist du E-commerçant qui Scale", "items": ["Auditer tes marges", "Identifier ton produit star", "Créer une offre irrésistible", "Funnel automatisé", "3 angles pub", "Pixel + CAPI", "Séquence email", "Système témoignages", "Recruter un closer", "Documenter tes process"]}'::jsonb,
 'draft', NOW() - INTERVAL '14 days'),
(demo_user_id, offer_id, 'follower_ads', 'follower_ads — Programme SCALE',
 'Publicités followers',
 '{"ads": [{"hook": "Tu fais 5K-15K/mois en e-commerce ? Suis-moi 🚀", "body": "Tips de scaling quotidiens.", "cta": "Suivre"}, {"hook": "93% des e-commerçants font cette erreur.", "body": "Découvre-les dans mon contenu.", "cta": "S''abonner"}]}'::jsonb,
 'draft', NOW() - INTERVAL '10 days'),
(demo_user_id, offer_id, 'dm_retargeting', 'dm_retargeting — Programme SCALE',
 'Scripts DM retargeting',
 '{"scripts": [{"trigger": "A visité la page de vente", "message": "Hey ! Tu as des questions sur SCALE ?"}, {"trigger": "A commencé le formulaire", "message": "Je vois que tu hésites — dis-moi ce qui te bloque"}, {"trigger": "A regardé la VSL", "message": "Tu as vu la vidéo — qu''en penses-tu ?"}]}'::jsonb,
 'draft', NOW() - INTERVAL '8 days');

-- ─── 8. AD CREATIVES ────────────────────────────────────
INSERT INTO ad_creatives (user_id, creative_type, ad_copy, headline, hook, cta, angle, status, impressions, clicks, ctr, spend, conversions, cpa, created_at) VALUES
(demo_user_id, 'image',
 'Tu fais 5K-15K/mois en e-commerce et tu veux passer à 30K+ ? Réserve ton audit gratuit.',
 'De 5K à 30K/mois en 90 jours', 'Tu es bloqué sous 15K/mois ?', 'Réserver mon audit gratuit',
 'Douleur → Solution', 'active', 45230, 1825, 4.04, 892.50, 47, 18.99,
 NOW() - INTERVAL '20 days'),
(demo_user_id, 'image',
 'Thomas faisait 7K/mois. En 87 jours, il est passé à 28K/mois.',
 'De 7K à 28K en 87 jours', 'Les résultats parlent', 'Voir le case study',
 'Preuve sociale', 'active', 38750, 2105, 5.43, 756.30, 52, 14.54,
 NOW() - INTERVAL '18 days'),
(demo_user_id, 'carousel',
 'Les 5 piliers pour scaler ton e-commerce à 30K/mois',
 'La méthode SCALE en 5 étapes', '5 étapes pour tripler ton CA', 'Télécharger la checklist',
 'Éducatif', 'active', 52100, 3200, 6.14, 1120.00, 68, 16.47,
 NOW() - INTERVAL '15 days'),
(demo_user_id, 'video_script',
 'Script vidéo 60s — Hook erreurs e-commerçants',
 'Les 3 erreurs qui tuent ton CA', 'STOP. Tu perds de l''argent chaque jour.',
 'Réserve ton audit gratuit', 'Émotion → Autorité',
 'active', 28900, 1450, 5.02, 645.00, 35, 18.43,
 NOW() - INTERVAL '12 days'),
(demo_user_id, 'dm_script',
 'Script DM pour prospects engagés',
 'Retargeting DM', 'Hey ! J''ai vu que tu avais liké mon post',
 'Tu veux qu''on en discute ?', 'Conversationnel',
 'draft', 0, 0, 0, 0, 0, 0,
 NOW() - INTERVAL '10 days');

-- ─── 9. CAMPAGNES ───────────────────────────────────────
INSERT INTO ad_campaigns (id, user_id, campaign_name, campaign_type, daily_budget, total_budget, status, total_spend, total_impressions, total_clicks, total_conversions, roas, start_date, end_date, audience_config, ai_recommendations, created_at) VALUES
(campaign1_id, demo_user_id, 'SCALE — Acquisition Audit Gratuit', 'conversions', 50.00, 1500.00,
 'active', 1245.80, 165000, 8580, 202, 3.85,
 (CURRENT_DATE - INTERVAL '25 days')::date, (CURRENT_DATE + INTERVAL '5 days')::date,
 '{"targeting": "E-commerçants FR, 25-45 ans", "lookalike": "1% clients existants"}'::jsonb,
 '["Augmenter le budget sur la créative carousel", "Tester un angle témoignage vidéo"]'::jsonb,
 NOW() - INTERVAL '25 days'),
(campaign2_id, demo_user_id, 'SCALE — Retargeting Visiteurs', 'retargeting', 25.00, 750.00,
 'active', 487.20, 42000, 2850, 85, 5.12,
 (CURRENT_DATE - INTERVAL '20 days')::date, (CURRENT_DATE + INTERVAL '10 days')::date,
 '{"targeting": "Visiteurs page de vente 30 derniers jours"}'::jsonb,
 '["Le retargeting performe bien (ROAS 5.1x)", "Ajouter un angle urgency"]'::jsonb,
 NOW() - INTERVAL '20 days');

-- ─── 10. AD DAILY METRICS (30 jours) ────────────────────
INSERT INTO ad_daily_metrics (user_id, date, spend, impressions, clicks, conversions, roas, ctr, cpm, cpa)
SELECT demo_user_id, d::date,
  ROUND((40 + random() * 35)::numeric, 2),
  (4000 + floor(random() * 3000))::integer,
  (200 + floor(random() * 200))::integer,
  (5 + floor(random() * 8))::integer,
  ROUND((2.5 + random() * 3)::numeric, 2),
  ROUND((3.5 + random() * 3)::numeric, 2),
  ROUND((8 + random() * 7)::numeric, 2),
  ROUND((12 + random() * 15)::numeric, 2)
FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day', '1 day') AS d
ON CONFLICT (user_id, date) DO NOTHING;

-- ─── 11. CONTENT PIECES ─────────────────────────────────
INSERT INTO content_pieces (user_id, content_type, title, content, hook, hashtags, scheduled_date, published, views, likes, comments, shares, created_at) VALUES
(demo_user_id, 'instagram_reel', '3 erreurs qui tuent ton CA e-commerce',
 'Erreur 1: Pas de système d''acquisition\nErreur 2: Dépendance à un seul canal\nErreur 3: Pas de suivi des KPIs',
 'Tu fais ces 3 erreurs ?', ARRAY['#ecommerce', '#scaling', '#entrepreneur'],
 (CURRENT_DATE - INTERVAL '5 days')::date, true, 12400, 890, 67, 145, NOW() - INTERVAL '7 days'),
(demo_user_id, 'instagram_carousel', 'La méthode SCALE en 5 slides',
 'Slide 1: Le problème\nSlide 2: Stratégie\nSlide 3: Copywriting\nSlide 4: Ads\nSlide 5: Résultat',
 'Tu veux scaler ? Swipe →', ARRAY['#ecommerce', '#coaching', '#scale'],
 (CURRENT_DATE - INTERVAL '3 days')::date, true, 8920, 1250, 94, 210, NOW() - INTERVAL '5 days'),
(demo_user_id, 'youtube_video', 'Comment j''ai aidé 50 e-commerçants à tripler leur CA',
 'Patterns communs de mes clients qui sont passés de 5-10K à 30K+ par mois.',
 'Cette vidéo va changer ta vie.', ARRAY['#ecommerce', '#coaching'],
 (CURRENT_DATE - INTERVAL '10 days')::date, true, 3450, 287, 45, 32, NOW() - INTERVAL '12 days'),
(demo_user_id, 'instagram_story', 'Behind the scenes — Call coaching',
 'Aperçu du call coaching de ce matin avec Thomas. Il vient de dépasser les 25K 🔥',
 NULL, ARRAY['#coaching', '#results'], NULL, true, 2100, 0, 0, 0, NOW() - INTERVAL '2 days'),
(demo_user_id, 'linkedin_post', 'Retour d''expérience — 3 ans de coaching',
 'Il y a 3 ans, j''ai accompagné mon premier client.\nAujourd''hui +50 entrepreneurs utilisent la méthode SCALE.\nRésultats : ROAS moyen 4.2x, 92% atteignent +50% de CA.',
 NULL, ARRAY['#coaching', '#ecommerce', '#results'],
 (CURRENT_DATE - INTERVAL '8 days')::date, true, 1890, 156, 23, 18, NOW() - INTERVAL '9 days');

-- ─── 12. COMMUNITY POSTS ────────────────────────────────
INSERT INTO community_posts (user_id, category, title, content, likes_count, comments_count, created_at) VALUES
(demo_user_id, 'wins', '🎉 Premier mois à 28K pour Thomas !',
 'Thomas vient de clôturer son premier mois à 28K ! Bravo !', 24, 8, NOW() - INTERVAL '5 days'),
(demo_user_id, 'general', 'Nouveau template de publicité',
 'Template "Angle Témoignage" mis à jour — CTR de 6.14%.', 15, 5, NOW() - INTERVAL '12 days'),
(demo_user_id, 'questions', 'Quel CPA visez-vous ?',
 'Quel CPA acceptable pour un programme à 3997€ ?', 18, 12, NOW() - INTERVAL '18 days');

-- ─── 13. DAILY PERFORMANCE METRICS ──────────────────────
INSERT INTO daily_performance_metrics (user_id, date, spend, impressions, clicks, leads, calls, clients, revenue)
SELECT demo_user_id, d::date,
  ROUND((40 + random() * 35)::numeric, 2),
  (4000 + floor(random() * 3000))::integer,
  (200 + floor(random() * 200))::integer,
  (8 + floor(random() * 12))::integer,
  (2 + floor(random() * 4))::integer,
  CASE WHEN random() > 0.6 THEN (1 + floor(random() * 2))::integer ELSE 0 END,
  CASE WHEN random() > 0.6 THEN ROUND((2000 + random() * 4000)::numeric, 2) ELSE 0 END
FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day', '1 day') AS d
ON CONFLICT (user_id, date) DO NOTHING;

-- ─── 14. LTV / CAC ─────────────────────────────────────
INSERT INTO ltv_cac_entries (user_id, date, avg_deal_value, monthly_churn_rate, monthly_ad_spend, new_customers) VALUES
(demo_user_id, '2025-10', 3500, 0.08, 1200, 3),
(demo_user_id, '2025-11', 3700, 0.07, 1500, 4),
(demo_user_id, '2025-12', 3997, 0.06, 1800, 5),
(demo_user_id, '2026-01', 3997, 0.05, 2200, 6),
(demo_user_id, '2026-02', 3997, 0.05, 2800, 8),
(demo_user_id, '2026-03', 4200, 0.04, 3000, 10)
ON CONFLICT (user_id, date) DO NOTHING;

-- ─── 15. LEADERBOARD ────────────────────────────────────
INSERT INTO leaderboard_scores (user_id, progress_score, business_score, engagement_score, composite_score, rank_position, monthly_revenue, total_clients, total_leads)
VALUES (demo_user_id, 82, 88, 78, 84, 1, 12000, 18, 350)
ON CONFLICT (user_id) DO UPDATE SET
  progress_score = 82, business_score = 88, engagement_score = 78,
  composite_score = 84, rank_position = 1, monthly_revenue = 12000,
  total_clients = 18, total_leads = 350;

-- ─── 16. GROWTH CHECKPOINTS ─────────────────────────────
INSERT INTO growth_checkpoints (user_id, tier_id, checkpoint) VALUES
(demo_user_id, 'launch', 'Analyse de marche terminee'),
(demo_user_id, 'launch', 'Offre creee et validee'),
(demo_user_id, 'launch', 'Funnel de vente en place'),
(demo_user_id, 'launch', 'Premieres publicites lancees'),
(demo_user_id, 'launch', 'Premier client signe'),
(demo_user_id, 'traction', 'ROAS > 2x stable sur 7 jours'),
(demo_user_id, 'traction', 'Pipeline de vente regulier (5+ leads/semaine)'),
(demo_user_id, 'traction', 'Systeme de contenu en place'),
(demo_user_id, 'traction', 'Sequences email automatisees')
ON CONFLICT (user_id, tier_id, checkpoint) DO NOTHING;

-- ─── 17. AB TESTS ───────────────────────────────────────
INSERT INTO ab_tests (user_id, name, metric, status, variant_a_description, variant_a_conversions, variant_a_traffic, variant_b_description, variant_b_conversions, variant_b_traffic, target_sample_size, winner) VALUES
(demo_user_id, 'Headline page opt-in', 'taux_optin', 'completed',
 'Découvre pourquoi 93% restent bloqués', 156, 623,
 'La méthode utilisée par +50 e-commerçants', 187, 624, 1200, 'B'),
(demo_user_id, 'CTA couleur bouton', 'taux_clic', 'active',
 'Bouton vert émeraude', 89, 450,
 'Bouton orange vif', 102, 448, 1000, NULL);

-- ─── 18. NOTIFICATIONS ──────────────────────────────────
INSERT INTO notifications (user_id, type, title, message, link, read, created_at) VALUES
(demo_user_id, 'badge', 'Nouveau badge !', 'Badge "Content Creator" débloqué !', '/progress', true, NOW() - INTERVAL '3 days'),
(demo_user_id, 'milestone', 'Milestone atteint !', 'Palier Lancement complété. Prochaine étape : Traction !', '/progress', true, NOW() - INTERVAL '7 days'),
(demo_user_id, 'system', 'Nouvelle fonctionnalité', 'L''Ad Spy est disponible !', '/ads', false, NOW() - INTERVAL '1 day'),
(demo_user_id, 'win', 'Record de ROAS !', 'Campagne "Acquisition" à 5.12x ROAS !', '/ads', false, NOW() - INTERVAL '2 days'),
(demo_user_id, 'community', 'Nouveau commentaire', 'Marc a commenté ton post.', '/community', false, NOW() - INTERVAL '1 day');

-- ─── 19. ACTIVITY LOG ───────────────────────────────────
INSERT INTO activity_log (user_id, activity_type, activity_data, created_at) VALUES
(demo_user_id, 'generation.market', '{"market": "Coaching E-commerce Premium"}'::jsonb, NOW() - INTERVAL '30 days'),
(demo_user_id, 'generation.offer', '{"offer": "Programme SCALE"}'::jsonb, NOW() - INTERVAL '28 days'),
(demo_user_id, 'generation.funnel', '{"funnel": "Funnel SCALE"}'::jsonb, NOW() - INTERVAL '25 days'),
(demo_user_id, 'generation.brand', '{"brand": "ScaleFlow"}'::jsonb, NOW() - INTERVAL '22 days'),
(demo_user_id, 'generation.vsl', '{"asset": "VSL Programme SCALE"}'::jsonb, NOW() - INTERVAL '20 days'),
(demo_user_id, 'generation.ads', '{"creative": "Image — Douleur → Solution"}'::jsonb, NOW() - INTERVAL '18 days'),
(demo_user_id, 'generation.content', '{"content": "Reel — 3 erreurs CA"}'::jsonb, NOW() - INTERVAL '7 days'),
(demo_user_id, 'community.post', '{"title": "Premier mois à 28K pour Thomas !"}'::jsonb, NOW() - INTERVAL '5 days'),
(demo_user_id, 'login', '{}'::jsonb, NOW() - INTERVAL '1 day'),
(demo_user_id, 'login', '{}'::jsonb, NOW());

-- ─── 20. AGENT CONVERSATIONS ────────────────────────────
INSERT INTO agent_conversations (user_id, agent_type, title, messages, created_at) VALUES
(demo_user_id, 'strategist', 'Stratégie de scaling Q1 2026',
 '[{"role": "user", "content": "Je veux passer de 8.5K à 30K/mois. Par où commencer ?"}, {"role": "assistant", "content": "3 axes prioritaires : 1. Optimiser ton funnel 2. Augmenter le budget ads 3. Recruter un closer."}]'::jsonb,
 NOW() - INTERVAL '15 days'),
(demo_user_id, 'ad_expert', 'Optimisation campagne Meta Ads',
 '[{"role": "user", "content": "Mon retargeting a un ROAS de 5.1x mais le volume est faible."}, {"role": "assistant", "content": "Élargis ta fenêtre à 30 jours, ajoute des audiences custom engagement Instagram 90 jours."}]'::jsonb,
 NOW() - INTERVAL '8 days');

-- ─── 21. TASKS ──────────────────────────────────────────
INSERT INTO tasks (user_id, title, description, task_type, related_module, estimated_minutes, due_date, completed, completed_at, task_order, created_at) VALUES
(demo_user_id, 'Lancer l''A/B test headline', 'Tester le nouveau headline vs l''actuel', 'action', 'ads', 30, (CURRENT_DATE + INTERVAL '2 days')::date, false, NULL, 1, NOW() - INTERVAL '3 days'),
(demo_user_id, 'Créer 3 angles vidéo', 'Filmer 3 courtes vidéos', 'action', 'content', 120, (CURRENT_DATE + INTERVAL '5 days')::date, false, NULL, 2, NOW() - INTERVAL '2 days'),
(demo_user_id, 'Augmenter budget acquisition', 'Passer de 50€ à 75€/jour', 'action', 'ads', 15, (CURRENT_DATE + INTERVAL '1 day')::date, false, NULL, 3, NOW() - INTERVAL '1 day'),
(demo_user_id, 'Finaliser séquence SMS', 'Générer la séquence SMS post-audit', 'action', 'sales', 45, (CURRENT_DATE + INTERVAL '7 days')::date, false, NULL, 4, NOW()),
(demo_user_id, 'Publier le reel "3 erreurs"', 'Monter et publier le reel', 'action', 'content', 60, (CURRENT_DATE - INTERVAL '2 days')::date, true, NOW() - INTERVAL '2 days', 5, NOW() - INTERVAL '5 days'),
(demo_user_id, 'Analyser les résultats du mois', 'Revoir les KPIs : ROAS, CPA, closing, CA', 'review', 'analytics', 45, CURRENT_DATE::date, false, NULL, 6, NOW() - INTERVAL '1 day');

RAISE NOTICE 'Données demo insérées pour Wassim (%)' , demo_user_id;

END $$;

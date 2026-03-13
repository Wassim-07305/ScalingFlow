-- ============================================================
-- ScalingFlow — Données de démonstration
-- Business fictif : Coaching High-Ticket en scaling e-commerce
-- Exécuter dans le SQL Editor de Supabase
-- ============================================================

-- Récupère le premier utilisateur existant
DO $$
DECLARE
  demo_user_id UUID;
  market1_id UUID := gen_random_uuid();
  market2_id UUID := gen_random_uuid();
  market3_id UUID := gen_random_uuid();
  offer_id UUID := gen_random_uuid();
  funnel_id UUID := gen_random_uuid();
  brand_id UUID := gen_random_uuid();
  campaign1_id UUID := gen_random_uuid();
  campaign2_id UUID := gen_random_uuid();
BEGIN

-- ⚠️ Remplace cet UUID par celui de l'utilisateur cible
demo_user_id := '6924010d-7470-4695-8ca3-e0002735ef8e';

-- ─── 1. PROFIL COMPLET ───────────────────────────────────
UPDATE profiles SET
  full_name = 'Alexandre Dumont',
  first_name = 'Alexandre',
  last_name = 'Dumont',
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
  situation_details = '{"business": "Coaching scaling e-commerce", "ca_actuel": 8500, "clients_count": 12, "biggest_challenge": "Automatiser l''acquisition sans perdre en qualité de delivery", "paying_clients": {"has_paying_clients": true, "clients_count": 12, "client_type": "E-commerçants Shopify 5K-15K/mois", "best_result": "Client passé de 7K à 28K/mois en 87 jours"}}'::jsonb,
  formations = ARRAY['Bootcamp Growth Hacking — 2024', 'Masterclass Facebook Ads — Damien Menu', 'Formation Copywriting Persuasif — Copy School'],
  parcours = 'B',
  vault_skills = '[
    {"name": "Acquisition & Prospection", "level": "avance", "details": "Facebook Ads + Instagram, 500K€ dépensés, ROAS moyen 3.8x"},
    {"name": "Vente & Closing", "level": "intermediaire", "details": "Closing en call Zoom, taux 35%, cherche à recruter un closer"},
    {"name": "Création de contenu", "level": "intermediaire", "details": "Reels, carousels, YouTube — 3 posts/semaine"},
    {"name": "Marketing & Ads", "level": "avance", "details": "Meta Ads expert, copywriting direct response, funnels VSL"},
    {"name": "Delivery & Gestion client", "level": "intermediaire", "details": "Coaching groupe + 1:1, Slack + Notion, 12 clients actifs"},
    {"name": "Automatisation & Outils", "level": "debutant", "details": "Zapier basique, veut structurer CRM et automations"}
  ]'::jsonb,
  expertise_answers = '{"q1": "Le scaling e-commerce — comment passer de 5K à 30K/mois avec un système structuré", "q2": "J''aide les e-commerçants à sortir du plateau de revenus en structurant leur acquisition et leur delivery", "q3": "Un client passé de 7K à 28K/mois en 87 jours grâce à la méthode SCALE", "q4": "Comment créer une offre irrésistible et un funnel qui convertit pour un business de services"}'::jsonb,
  hours_per_week = 40,
  deadline = '3_mois',
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
  xp_points = 2450,
  level = 8,
  streak_days = 12,
  last_active_date = CURRENT_DATE,
  badges = ARRAY['first_market', 'first_offer', 'first_funnel', 'first_ad', 'streak_7', 'content_creator'],
  global_progress = 68.5,
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

-- OTO + delivery + offer data in ai_raw_response
UPDATE offers SET
  oto_offer = '{"oto_name": "Pack Accélérateur", "oto_price": 997, "oto_description": "Templates ads prêts à l''emploi + audit mensuel de tes campagnes pendant 6 mois", "oto_benefits": ["50 templates de publicités testés", "Audit mensuel personnalisé", "Accès au groupe VIP"]}'::jsonb,
  ai_raw_response = '{"offer_name": "Programme SCALE", "price": 3997, "target": "E-commerçants 5K-15K/mois", "unique_mechanism": "Méthode SCALE en 5 piliers", "guarantee": "Résultats en 90 jours ou coaching prolongé", "delivery": {"format": "Coaching hybride", "duration": "12 semaines", "calls_per_week": 2, "platform": "Zoom + Slack", "resources": "Vidéos + Templates + Playbooks"}}'::jsonb
WHERE id = offer_id;

-- ─── 5. FUNNEL ──────────────────────────────────────────
INSERT INTO funnels (id, user_id, offer_id, funnel_name, optin_page, vsl_page, thankyou_page, status, total_visits, total_optins, conversion_rate, created_at) VALUES
(funnel_id, demo_user_id, offer_id,
 'Funnel SCALE — Audit Gratuit',
 '{
   "headline": "Découvre pourquoi 93% des e-commerçants restent bloqués sous 10K/mois",
   "subheadline": "Et comment la méthode SCALE permet de passer à 30K/mois en 90 jours (sans travailler plus)",
   "bullet_points": [
     "Les 3 erreurs qui plafonnent ton CA (et comment les corriger en 48h)",
     "La stratégie exacte pour doubler ton ROAS en 30 jours",
     "Comment automatiser 80% de ton acquisition client",
     "Le framework utilisé par +50 e-commerçants pour scaler"
   ],
   "cta_text": "Réserve ton audit gratuit →",
   "social_proof_text": "+50 e-commerçants accompagnés • ROAS moyen de 4.2x • 92% atteignent +50% de CA"
 }'::jsonb,
 '{
   "headline": "La Méthode SCALE : Le système complet pour passer de 5K à 30K/mois",
   "intro_text": "Dans cette vidéo, je te montre exactement comment mes clients passent de 5K à 30K/mois en 90 jours grâce à un système en 5 étapes.",
   "benefit_bullets": [
     "Un positionnement premium qui justifie des prix élevés",
     "Des publicités qui convertissent à 3-5x ROAS",
     "Un système d''acquisition qui tourne en automatique",
     "Une équipe structurée pour déléguer sans stress"
   ],
   "faq": [
     {"question": "Est-ce que ça marche pour mon type de e-commerce ?", "answer": "La méthode SCALE a été testée sur +50 niches différentes. Si tu fais déjà 5K/mois, c''est adapté."},
     {"question": "Combien de temps par semaine ?", "answer": "10-15h/semaine suffisent. L''objectif est de travailler mieux, pas plus."},
     {"question": "Et si ça ne marche pas ?", "answer": "Garantie résultats : +50% de CA en 90 jours ou coaching prolongé gratuitement."}
   ]
 }'::jsonb,
 '{
   "confirmation_message": "Ton audit gratuit est confirmé ! Voici les prochaines étapes.",
   "next_steps": [
     "Vérifie ta boîte mail — tu vas recevoir un questionnaire à remplir avant l''appel",
     "Bloque 45 minutes dans ton agenda pour l''audit",
     "Prépare tes chiffres clés : CA, dépense ads, taux de conversion"
   ],
   "upsell_headline": "Offre spéciale : Pack Accélérateur",
   "upsell_description": "50 templates de publicités + audit mensuel pendant 6 mois",
   "upsell_cta": "Ajouter le Pack — 997€ au lieu de 2000€"
 }'::jsonb,
 'published', 1247, 312, 25.02,
 NOW() - INTERVAL '25 days');

-- ─── 6. BRAND IDENTITY ──────────────────────────────────
INSERT INTO brand_identities (id, user_id, offer_id, brand_names, selected_name, art_direction, logo_concept, brand_kit, status, created_at) VALUES
(brand_id, demo_user_id, offer_id,
 '["ScaleFlow", "GrowthPulse", "E-Scale Academy", "ScaleMaster", "LaunchPad Pro"]'::jsonb,
 'ScaleFlow',
 '{"style": "Moderne et premium", "mood": "Confiance, croissance, énergie", "colors": ["#34D399", "#0B0E11", "#FFFFFF"], "typography": "Sans-serif géométrique (Inter/Satoshi)", "imagery": "Graphiques de croissance, interfaces dashboard, photos lifestyle entrepreneur"}'::jsonb,
 'Logo minimaliste avec une flèche ascendante intégrée dans le S de Scale. Palette vert émeraude sur fond sombre.',
 '{"primary_color": "#34D399", "secondary_color": "#0B0E11", "accent_color": "#60A5FA", "font_heading": "Satoshi", "font_body": "Inter", "logo_url": null, "tone_of_voice": "Expert mais accessible, direct, orienté résultats"}'::jsonb,
 'validated',
 NOW() - INTERVAL '22 days');

-- ─── 7. SALES ASSETS ────────────────────────────────────
INSERT INTO sales_assets (user_id, offer_id, asset_type, title, content, ai_raw_response, status, created_at) VALUES
(demo_user_id, offer_id, 'vsl_script', 'VSL — Programme SCALE',
 'Script VSL de 15 minutes pour le programme SCALE',
 '{"hook": "Si tu fais entre 5K et 15K par mois en e-commerce et que tu te demandes comment passer au niveau supérieur sans travailler 80h par semaine... reste jusqu''au bout de cette vidéo.", "problem": "Le problème, c''est que 93% des e-commerçants restent bloqués au même palier pendant des mois, voire des années. Ils essaient tout : nouvelles pubs, nouveaux produits, nouvelles formations... mais rien ne change vraiment.", "solution": "La méthode SCALE est un système en 5 piliers qui attaque chaque blocage de ton business de manière structurée.", "proof": "Thomas est passé de 7K à 28K en 87 jours. Sarah a doublé son ROAS en 3 semaines. Marc a automatisé 80% de son acquisition.", "offer": "Le programme SCALE, c''est 12 semaines de coaching intensif avec moi et mon équipe. 2 calls groupe par semaine, 1 call privé par mois, accès à tous les templates et playbooks.", "close": "Réserve ton audit gratuit maintenant. En 45 minutes, je te donne un plan d''action personnalisé pour atteindre 30K/mois."}'::jsonb,
 'validated', NOW() - INTERVAL '20 days'),

(demo_user_id, offer_id, 'email_sequence', 'Séquence Email — Nurturing SCALE',
 'Séquence de 7 emails pour convertir les leads en clients',
 '{"emails": [
   {"subject": "Ton audit gratuit est confirmé ✓", "type": "confirmation", "body": "Salut {{prenom}}, ton audit est bien réservé..."},
   {"subject": "Les 3 erreurs qui plafonnent ton CA", "type": "value", "body": "Avant notre appel, je voulais partager les 3 erreurs les plus courantes..."},
   {"subject": "Comment Thomas est passé de 7K à 28K/mois", "type": "case_study", "body": "Thomas était exactement dans ta situation il y a 3 mois..."},
   {"subject": "Ta place se libère demain", "type": "urgency", "body": "On n''accepte que 10 nouveaux clients par mois..."},
   {"subject": "Dernière chance — Audit gratuit", "type": "last_call", "body": "C''est le dernier email que je t''envoie à ce sujet..."}
 ]}'::jsonb,
 'validated', NOW() - INTERVAL '18 days'),

(demo_user_id, offer_id, 'sales_script', 'Script de Vente — Call SCALE',
 'Script pour l''appel de closing du programme SCALE',
 '{"phases": [
   {"name": "Rapport", "duration": "5 min", "script": "Salut [prénom], ravi de te parler ! Dis-moi, qu''est-ce qui t''a donné envie de réserver cet audit ?"},
   {"name": "Diagnostic", "duration": "15 min", "script": "OK, et si tu devais identifier LE blocage principal qui t''empêche de passer au niveau supérieur, ce serait quoi ?"},
   {"name": "Vision", "duration": "5 min", "script": "Imagine que dans 90 jours, tu fais 30K/mois de manière prévisible. Qu''est-ce que ça changerait concrètement dans ta vie ?"},
   {"name": "Présentation", "duration": "10 min", "script": "C''est exactement pour ça que j''ai créé le programme SCALE. Laisse-moi t''expliquer comment ça fonctionne..."},
   {"name": "Closing", "duration": "10 min", "script": "Alors [prénom], sur une échelle de 1 à 10, à quel point tu es prêt à passer à l''action ?"}
 ]}'::jsonb,
 'validated', NOW() - INTERVAL '16 days'),

(demo_user_id, offer_id, 'lead_magnet', 'Checklist — 10 Actions pour Scaler',
 'Lead magnet PDF : checklist pour e-commerçants',
 '{"title": "La Checklist du E-commerçant qui Scale", "subtitle": "10 actions concrètes pour passer de 5K à 30K/mois", "items": [
   "Auditer tes marges produit (objectif: +60%)",
   "Identifier ton produit star (80/20)",
   "Créer une offre irrésistible avec garantie",
   "Mettre en place un funnel de vente automatisé",
   "Lancer 3 angles publicitaires différents",
   "Installer un pixel + CAPI correctement",
   "Créer une séquence email de nurturing",
   "Mettre en place un système de témoignages",
   "Recruter un closer/setter",
   "Documenter tes process dans un playbook"
 ]}'::jsonb,
 'draft', NOW() - INTERVAL '14 days'),

(demo_user_id, offer_id, 'follower_ads', 'follower_ads — Programme SCALE',
 'Publicités pour gagner des followers qualifiés',
 '{"ads": [
   {"hook": "Tu fais 5K-15K/mois en e-commerce ? Suis-moi pour des conseils de scaling quotidiens 🚀", "body": "Chaque jour, je partage les stratégies exactes que j''utilise avec mes clients pour tripler leur CA.", "cta": "Suivre pour plus de tips"},
   {"hook": "93% des e-commerçants font cette erreur avec leurs pubs. Et toi ?", "body": "En 3 ans de coaching, j''ai vu les mêmes patterns se répéter. Découvre-les dans mon contenu.", "cta": "S''abonner maintenant"},
   {"hook": "De 7K à 28K/mois en 87 jours — voici comment", "body": "Je documente en temps réel les résultats de mes clients. Rejoins la communauté.", "cta": "Rejoindre"}
 ]}'::jsonb,
 'draft', NOW() - INTERVAL '10 days'),

(demo_user_id, offer_id, 'dm_retargeting', 'dm_retargeting — Programme SCALE',
 'Scripts de DM pour retargeting prospects chauds',
 '{"scripts": [
   {"trigger": "A visité la page de vente", "message": "Hey {{prenom}} ! J''ai vu que tu t''intéressais au programme SCALE. Tu as des questions ? Je suis dispo pour en discuter 💬", "follow_up": "Au fait, si tu veux un aperçu gratuit, je peux t''envoyer la checklist des 10 actions pour scaler 📋"},
   {"trigger": "A commencé le formulaire sans finir", "message": "Salut {{prenom}} ! Je vois que tu as commencé à remplir le formulaire pour l''audit. Si tu as des hésitations, je comprends totalement — dis-moi ce qui te bloque et je t''aide 🤝"},
   {"trigger": "A regardé la VSL sans réserver", "message": "Hey {{prenom}} ! Tu as vu la vidéo sur la méthode SCALE — qu''est-ce que tu en as pensé ? 😊 Si tu veux en savoir plus, j''ai quelques places pour un audit gratuit cette semaine."}
 ]}'::jsonb,
 'draft', NOW() - INTERVAL '8 days');

-- ─── 8. AD CREATIVES ────────────────────────────────────
INSERT INTO ad_creatives (user_id, creative_type, ad_copy, headline, hook, cta, angle, status, impressions, clicks, ctr, spend, conversions, cpa, created_at) VALUES
(demo_user_id, 'image',
 'Tu fais 5K-15K/mois en e-commerce et tu veux passer à 30K+ ? La méthode SCALE a aidé +50 e-commerçants à tripler leur CA en 90 jours. Réserve ton audit gratuit maintenant.',
 'De 5K à 30K/mois en 90 jours', 'Tu es bloqué sous 15K/mois ?', 'Réserver mon audit gratuit',
 'Douleur → Solution', 'active', 45230, 1825, 4.04, 892.50, 47, 18.99,
 NOW() - INTERVAL '20 days'),

(demo_user_id, 'image',
 'Thomas faisait 7K/mois. En 87 jours avec la méthode SCALE, il est passé à 28K/mois. Son secret ? Un système d''acquisition automatisé. Découvre comment.',
 'De 7K à 28K en 87 jours', 'Les résultats parlent d''eux-mêmes', 'Voir le case study',
 'Preuve sociale', 'active', 38750, 2105, 5.43, 756.30, 52, 14.54,
 NOW() - INTERVAL '18 days'),

(demo_user_id, 'carousel',
 'Les 5 piliers pour scaler ton e-commerce à 30K/mois :\n1️⃣ Stratégie de positionnement\n2️⃣ Copywriting persuasif\n3️⃣ Ads haute performance\n4️⃣ Système de leads automatisé\n5️⃣ Exécution et scaling',
 'La méthode SCALE en 5 étapes', '5 étapes pour tripler ton CA', 'Télécharger la checklist',
 'Éducatif', 'active', 52100, 3200, 6.14, 1120.00, 68, 16.47,
 NOW() - INTERVAL '15 days'),

(demo_user_id, 'video_script',
 'Script vidéo 60s — Hook puissant sur les erreurs courantes des e-commerçants',
 'Les 3 erreurs qui tuent ton CA', 'STOP. Si tu fais cette erreur, tu perds de l''argent chaque jour.',
 'Réserve ton audit gratuit', 'Émotion → Autorité',
 'active', 28900, 1450, 5.02, 645.00, 35, 18.43,
 NOW() - INTERVAL '12 days'),

(demo_user_id, 'dm_script',
 'Script DM pour prospects qui ont interagi avec les posts',
 'Retargeting DM — Engagement', 'Hey ! J''ai vu que tu avais liké mon post sur le scaling',
 'Tu veux qu''on en discute ?', 'Conversationnel',
 'draft', 0, 0, 0, 0, 0, 0,
 NOW() - INTERVAL '10 days');

-- ─── 9. CAMPAGNES ───────────────────────────────────────
INSERT INTO ad_campaigns (id, user_id, campaign_name, campaign_type, daily_budget, total_budget, status, total_spend, total_impressions, total_clicks, total_conversions, roas, start_date, end_date, audience_config, ai_recommendations, created_at) VALUES
(campaign1_id, demo_user_id, 'SCALE — Acquisition Audit Gratuit', 'conversions', 50.00, 1500.00,
 'active', 1245.80, 165000, 8580, 202, 3.85,
 (CURRENT_DATE - INTERVAL '25 days')::date, (CURRENT_DATE + INTERVAL '5 days')::date,
 '{"targeting": "E-commerçants FR, 25-45 ans, intérêts: Shopify, WooCommerce, dropshipping", "lookalike": "1% clients existants", "exclusions": "Déjà clients"}'::jsonb,
 '["Augmenter le budget sur la créative carousel (meilleur CPA)", "Tester un angle témoignage vidéo", "Créer une lookalike 2% pour élargir"]'::jsonb,
 NOW() - INTERVAL '25 days'),

(campaign2_id, demo_user_id, 'SCALE — Retargeting Visiteurs', 'retargeting', 25.00, 750.00,
 'active', 487.20, 42000, 2850, 85, 5.12,
 (CURRENT_DATE - INTERVAL '20 days')::date, (CURRENT_DATE + INTERVAL '10 days')::date,
 '{"targeting": "Visiteurs page de vente 30 derniers jours", "exclusions": "Déjà inscrits audit"}'::jsonb,
 '["Le retargeting performe très bien (ROAS 5.1x), envisager d''augmenter le budget", "Ajouter un angle urgency/scarcity"]'::jsonb,
 NOW() - INTERVAL '20 days');

-- ─── 10. AD DAILY METRICS (30 jours) ────────────────────
INSERT INTO ad_daily_metrics (user_id, date, spend, impressions, clicks, conversions, roas, ctr, cpm, cpa)
SELECT
  demo_user_id,
  d::date,
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
 'Erreur 1: Pas de système d''acquisition\nErreur 2: Dépendance à un seul canal\nErreur 3: Pas de suivi des KPIs\n\nLa solution ? Un framework structuré comme la méthode SCALE.',
 'Tu fais ces 3 erreurs ? Normal que ton CA stagne.', ARRAY['#ecommerce', '#scaling', '#businessenligne', '#entrepreneur'],
 (CURRENT_DATE - INTERVAL '5 days')::date, true, 12400, 890, 67, 145,
 NOW() - INTERVAL '7 days'),

(demo_user_id, 'instagram_carousel', 'La méthode SCALE en 5 slides',
 'Slide 1: Le problème — 93% des e-commerçants bloqués\nSlide 2: Stratégie — Positionnement premium\nSlide 3: Copywriting — Pages qui convertissent\nSlide 4: Ads — ROAS x3\nSlide 5: Le résultat — 30K/mois en 90 jours',
 'Tu veux scaler ? Swipe →', ARRAY['#ecommerce', '#coaching', '#scale', '#methode'],
 (CURRENT_DATE - INTERVAL '3 days')::date, true, 8920, 1250, 94, 210,
 NOW() - INTERVAL '5 days'),

(demo_user_id, 'youtube_video', 'Comment j''ai aidé 50 e-commerçants à tripler leur CA',
 'Dans cette vidéo, je te montre les patterns communs de mes clients qui sont passés de 5-10K à 30K+ par mois.\n\nTimecodes:\n00:00 Introduction\n02:30 Les 3 blocages les plus courants\n08:15 La méthode SCALE expliquée\n15:00 Résultats concrets\n20:00 Comment commencer',
 'Si tu fais entre 5K et 15K par mois, cette vidéo va changer ta vie.', ARRAY['#ecommerce', '#coaching', '#business'],
 (CURRENT_DATE - INTERVAL '10 days')::date, true, 3450, 287, 45, 32,
 NOW() - INTERVAL '12 days'),

(demo_user_id, 'instagram_story', 'Behind the scenes — Call coaching',
 'Petit aperçu de mon call coaching de ce matin avec Thomas.\nIl vient de dépasser les 25K ce mois-ci 🔥\nStory suivante : ses 3 actions clés.',
 NULL, ARRAY['#coaching', '#results'], NULL, true, 2100, 0, 0, 0,
 NOW() - INTERVAL '2 days'),

(demo_user_id, 'instagram_post', 'Mindset du jour — La constance bat le talent',
 'Tu n''as pas besoin d''être le plus malin.\nTu as besoin d''être le plus constant.\n\nChaque jour pendant 90 jours → résultats garantis.\n\nC''est aussi simple (et aussi dur) que ça. 💪',
 NULL, ARRAY['#mindset', '#entrepreneur', '#constance'],
 CURRENT_DATE::date, false, 0, 0, 0, 0,
 NOW() - INTERVAL '1 day'),

(demo_user_id, 'linkedin_post', 'Retour d''expérience — 3 ans de coaching e-commerce',
 'Il y a 3 ans, j''ai accompagné mon premier client e-commerce.\nAujourd''hui, +50 entrepreneurs ont utilisé la méthode SCALE.\n\nLes résultats :\n→ ROAS moyen de 4.2x\n→ 92% atteignent +50% de CA\n→ Durée moyenne pour atteindre 30K : 78 jours\n\nCe que j''ai appris : le système bat toujours le talent.',
 NULL, ARRAY['#coaching', '#ecommerce', '#results', '#linkedin'],
 (CURRENT_DATE - INTERVAL '8 days')::date, true, 1890, 156, 23, 18,
 NOW() - INTERVAL '9 days');

-- ─── 12. COMMUNITY POSTS ────────────────────────────────
INSERT INTO community_posts (user_id, category, title, content, likes_count, comments_count, created_at) VALUES
(demo_user_id, 'wins', '🎉 Premier mois à 28K pour Thomas !',
 'Thomas vient de clôturer son premier mois à 28K ! Il était à 7K quand on a commencé il y a 87 jours. La méthode SCALE fonctionne quand on l''applique avec rigueur. Bravo Thomas !',
 24, 8, NOW() - INTERVAL '5 days'),

(demo_user_id, 'general', 'Nouveau template de publicité disponible',
 'Je viens de mettre à jour le template "Angle Témoignage" dans le groupe. Il a généré un CTR de 6.14% sur nos tests. Allez le récupérer dans les ressources !',
 15, 5, NOW() - INTERVAL '12 days'),

(demo_user_id, 'questions', 'Quel CPA visez-vous sur vos campagnes ?',
 'Question pour la communauté : quel CPA considérez-vous comme acceptable pour un programme à 3997€ ? Perso, je vise sous 20€ pour un audit gratuit.',
 18, 12, NOW() - INTERVAL '18 days');

-- ─── 13. DAILY PERFORMANCE METRICS (30 jours) ──────────
INSERT INTO daily_performance_metrics (user_id, date, spend, impressions, clicks, leads, calls, clients, revenue)
SELECT
  demo_user_id,
  d::date,
  ROUND((40 + random() * 35)::numeric, 2),
  (4000 + floor(random() * 3000))::integer,
  (200 + floor(random() * 200))::integer,
  (8 + floor(random() * 12))::integer,
  (2 + floor(random() * 4))::integer,
  CASE WHEN random() > 0.6 THEN (1 + floor(random() * 2))::integer ELSE 0 END,
  CASE WHEN random() > 0.6 THEN ROUND((2000 + random() * 4000)::numeric, 2) ELSE 0 END
FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day', '1 day') AS d
ON CONFLICT (user_id, date) DO NOTHING;

-- ─── 14. LTV / CAC ENTRIES (6 mois) ────────────────────
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
VALUES (demo_user_id, 78, 85, 72, 80, 3, 8500, 12, 287)
ON CONFLICT (user_id) DO UPDATE SET
  progress_score = 78, business_score = 85, engagement_score = 72,
  composite_score = 80, rank_position = 3, monthly_revenue = 8500,
  total_clients = 12, total_leads = 287;

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
 'Découvre pourquoi 93% des e-commerçants restent bloqués', 156, 623,
 'La méthode utilisée par +50 e-commerçants pour tripler leur CA', 187, 624,
 1200, 'B'),
(demo_user_id, 'CTA couleur bouton', 'taux_clic', 'active',
 'Bouton vert émeraude (accent)', 89, 450,
 'Bouton orange vif', 102, 448,
 1000, NULL);

-- ─── 18. NOTIFICATIONS ──────────────────────────────────
INSERT INTO notifications (user_id, type, title, message, link, read, created_at) VALUES
(demo_user_id, 'badge', 'Nouveau badge débloqué !', 'Tu as obtenu le badge "Content Creator" — continue comme ça !', '/progress', true, NOW() - INTERVAL '3 days'),
(demo_user_id, 'milestone', 'Milestone atteint !', 'Tu as complété toutes les étapes du palier Lancement. Prochaine étape : Traction !', '/progress', true, NOW() - INTERVAL '7 days'),
(demo_user_id, 'system', 'Nouvelle fonctionnalité', 'L''Ad Spy est maintenant disponible ! Analyse les publicités de tes concurrents.', '/ads', false, NOW() - INTERVAL '1 day'),
(demo_user_id, 'win', 'Record de ROAS !', 'Ta campagne "Acquisition Audit Gratuit" a atteint un ROAS de 5.12x aujourd''hui !', '/ads', false, NOW() - INTERVAL '2 days'),
(demo_user_id, 'community', 'Nouveau commentaire', 'Marc a commenté ton post "Premier mois à 28K pour Thomas !"', '/community', false, NOW() - INTERVAL '1 day');

-- ─── 19. ACTIVITY LOG ───────────────────────────────────
INSERT INTO activity_log (user_id, activity_type, activity_data, created_at) VALUES
(demo_user_id, 'generation.market', '{"market": "Coaching E-commerce Premium"}'::jsonb, NOW() - INTERVAL '30 days'),
(demo_user_id, 'generation.offer', '{"offer": "Programme SCALE"}'::jsonb, NOW() - INTERVAL '28 days'),
(demo_user_id, 'generation.funnel', '{"funnel": "Funnel SCALE — Audit Gratuit"}'::jsonb, NOW() - INTERVAL '25 days'),
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
 '[
   {"role": "user", "content": "Je veux passer de 8.5K à 30K/mois d''ici juin. Par où commencer ?"},
   {"role": "assistant", "content": "Excellente ambition ! Basé sur ton profil, je recommande 3 axes prioritaires :\n\n1. **Optimiser ton funnel actuel** — ton taux de conversion optin (25%) est bon, mais on peut viser 30%+ avec un A/B test sur le headline.\n\n2. **Augmenter le budget ads** — ton ROAS est stable à 3.8x. Avec un budget de 75€/jour (au lieu de 50€), tu devrais générer 15-20 leads/jour.\n\n3. **Recruter un closer** — tu perds ~30% des calls qualifiés. Un closer dédié peut doubler ton taux de closing.\n\nVeux-tu qu''on détaille un de ces axes ?"},
   {"role": "user", "content": "Oui, détaille le point 2 sur les ads"},
   {"role": "assistant", "content": "Voici mon plan pour scaler tes ads :\n\n**Semaine 1-2 :** Duplique ta campagne gagnante (carousel SCALE) avec un budget de 75€/jour. Garde les mêmes audiences.\n\n**Semaine 3-4 :** Lance une lookalike 2% basée sur tes clients existants. Budget : 30€/jour en test.\n\n**Semaine 5-6 :** Scale la meilleure variante à 100€/jour. Si le ROAS reste > 3x, continue l''augmentation progressive (+20%/semaine).\n\n**KPIs à surveiller :** CPA < 20€, ROAS > 3x, fréquence < 2.5\n\nAvec ce plan, tu devrais passer de 8-10 leads/jour à 20-25 leads/jour en 6 semaines."}
 ]'::jsonb,
 NOW() - INTERVAL '15 days'),

(demo_user_id, 'ad_expert', 'Optimisation campagne Meta Ads',
 '[
   {"role": "user", "content": "Ma campagne retargeting a un ROAS de 5.1x mais le volume est faible. Comment augmenter ?"},
   {"role": "assistant", "content": "Un ROAS de 5.1x en retargeting, c''est excellent ! Pour augmenter le volume sans diluer la performance :\n\n1. **Élargis ta fenêtre de retargeting** — passe de 7 jours à 30 jours de visiteurs.\n2. **Ajoute des audiences custom** — engagement Instagram 90 jours, viewers vidéo 75%.\n3. **Crée un DPA dynamique** — montre le contenu consulté aux visiteurs.\n\nAttention : le ROAS va probablement baisser à 3.5-4x en élargissant, mais le volume de conversions augmentera. C''est un bon trade-off."}
 ]'::jsonb,
 NOW() - INTERVAL '8 days');

-- ─── 21. TASKS ──────────────────────────────────────────
INSERT INTO tasks (user_id, title, description, task_type, related_module, estimated_minutes, due_date, completed, completed_at, task_order, created_at) VALUES
(demo_user_id, 'Lancer l''A/B test headline opt-in', 'Tester le nouveau headline "La méthode utilisée par +50 e-commerçants" vs l''actuel', 'action', 'ads', 30, (CURRENT_DATE + INTERVAL '2 days')::date, false, NULL, 1, NOW() - INTERVAL '3 days'),
(demo_user_id, 'Créer 3 nouveaux angles vidéo', 'Filmer 3 courtes vidéos avec les angles : témoignage, behind-the-scenes, tips rapides', 'action', 'content', 120, (CURRENT_DATE + INTERVAL '5 days')::date, false, NULL, 2, NOW() - INTERVAL '2 days'),
(demo_user_id, 'Augmenter budget campagne acquisition', 'Passer de 50€/jour à 75€/jour sur la campagne SCALE Acquisition', 'action', 'ads', 15, (CURRENT_DATE + INTERVAL '1 day')::date, false, NULL, 3, NOW() - INTERVAL '1 day'),
(demo_user_id, 'Finaliser séquence SMS', 'Générer et valider la séquence SMS de suivi post-audit', 'action', 'sales', 45, (CURRENT_DATE + INTERVAL '7 days')::date, false, NULL, 4, NOW()),
(demo_user_id, 'Publier le reel "3 erreurs"', 'Monter et publier le reel sur les 3 erreurs qui tuent le CA', 'action', 'content', 60, (CURRENT_DATE - INTERVAL '2 days')::date, true, NOW() - INTERVAL '2 days', 5, NOW() - INTERVAL '5 days'),
(demo_user_id, 'Analyser les résultats du mois', 'Revoir les KPIs du mois : ROAS, CPA, taux de closing, CA', 'review', 'analytics', 45, CURRENT_DATE::date, false, NULL, 6, NOW() - INTERVAL '1 day');

RAISE NOTICE 'Données de démonstration insérées avec succès pour l''utilisateur %', demo_user_id;

END $$;

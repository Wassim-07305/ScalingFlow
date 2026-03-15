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
  skills = ARRAY['Marketing digital', 'Social media', 'Automatisation', 'Consulting', 'IA & No-code'],
  experience_level = 'intermediate',
  current_revenue = 4500,
  target_revenue = 20000,
  industries = ARRAY['SaaS / Tech', 'Marketing / Communication', 'Coaching business'],
  objectives = ARRAY['Creer une offre irresistible', 'Lancer des pubs Meta', 'Scaler mon activite', 'Automatiser mon business'],
  budget_monthly = 1000,
  situation = 'freelance',
  situation_details = '{"missions": "Consulting marketing digital et automatisation IA pour PME", "client_type": "PME et startups B2B", "ca_actuel": 4500, "clients_count": 6, "tarif_actuel": "TJM 450EUR, forfaits 1500-3000EUR", "biggest_challenge": "Je trade mon temps contre de l''argent, pas de revenus récurrents", "paying_clients": {"has_paying_clients": true, "clients_count": 6, "client_type": "PME tech et startups SaaS", "best_result": "Automatisation marketing qui a généré +180% de leads en 2 mois pour un client SaaS"}}'::jsonb,
  formations = ARRAY['Certif Google Ads', 'Formation Iman Gadzhi — Agency Navigator', 'Make/Zapier avancé — No-code bootcamp'],
  parcours = 'A3',
  vault_skills = '[
    {"name": "Acquisition & Prospection", "level": "intermediaire", "details": "LinkedIn outreach + cold email, quelques campagnes Meta Ads"},
    {"name": "Vente & Closing", "level": "debutant", "details": "Vente en DM et visio, pas de process structuré"},
    {"name": "Création de contenu", "level": "intermediaire", "details": "Posts LinkedIn 2x/semaine, quelques carrousels Instagram"},
    {"name": "Marketing & Ads", "level": "avance", "details": "Google Ads, Meta Ads, SEO, email marketing — 3 ans d''expérience"},
    {"name": "Delivery & Gestion client", "level": "intermediaire", "details": "Notion + Slack, process basiques, 6 clients en parallèle"},
    {"name": "Automatisation & Outils", "level": "avance", "details": "Make, Zapier, n8n, Airtable — automatisations complexes multi-étapes"}
  ]'::jsonb,
  expertise_answers = '{"q1": "Le marketing digital et l''automatisation IA — comment utiliser l''IA pour scaler l''acquisition", "q2": "J''aide les PME à automatiser leur marketing pour générer des leads sans y passer 40h/semaine", "q3": "+180% de leads pour un client SaaS en 2 mois grâce à une stack Make + Clay + Instantly", "q4": "Comment construire un système d''automatisation marketing de A à Z avec des outils no-code", "phase1_Offre ideale scalable": "Un forfait mensuel d''automatisation marketing IA — setup + maintenance + optimisation", "phase1_Blocage pricing": "Clients PME avec petit budget, difficile de justifier plus de 2K/mois sans prouver le ROI d''abord", "phase1_Acquisition ideale": "LinkedIn outbound + contenu organique + referral clients satisfaits"}'::jsonb,
  hours_per_week = 35,
  deadline = '1_mois',
  team_size = 1,
  vault_completed = true,
  vault_analysis = '{
    "radar": {"marketing": 85, "vente": 40, "copywriting": 55, "tech": 90, "design": 35, "strategie": 65},
    "score_avantage_competitif": 72,
    "forces_principales": ["Expertise technique solide en automatisation IA (Make, n8n, Clay)", "Double compétence marketing + tech rare sur le marché", "Résultats prouvés : +180% de leads pour un client SaaS"],
    "faiblesses": ["Vente et closing à structurer — pas de process", "Pas de revenus récurrents, modèle TJM", "Design et branding faibles"],
    "suggestions_productisation": [
      {"titre": "Pack Automatisation Lead Gen", "description": "Forfait mensuel d''automatisation de l''acquisition : setup Make + Clay + Instantly + reporting", "potentiel": "fort"},
      {"titre": "Formation IA Marketing pour PME", "description": "Programme en ligne pour apprendre à automatiser son marketing avec l''IA", "potentiel": "moyen"},
      {"titre": "Audit Automatisation Express", "description": "Audit de 2h pour identifier les automatisations à mettre en place", "potentiel": "fort"}
    ],
    "recommandation_funnel": "hybride",
    "recommandation_funnel_raison": "Un funnel hybride (contenu LinkedIn + call découverte) est idéal pour vendre du B2B technique. Le contenu éduque, le call convertit.",
    "parcours_recommande": "A3",
    "parcours_raison": "En tant que freelance avec des clients existants, le parcours A3 permet de packager l''expertise en offre scalable.",
    "prochaines_etapes": ["Packager l''offre d''automatisation en forfait mensuel récurrent", "Créer un lead magnet (checklist automatisation)", "Structurer un process de vente en 3 étapes", "Lancer du contenu LinkedIn 3x/semaine"]
  }'::jsonb,
  selected_market = 'Automatisation Marketing IA pour PME B2B',
  market_viability_score = 88,
  niche = 'Automatisation marketing IA pour PME et startups B2B',
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
(market1_id, demo_user_id, 'Automatisation Marketing IA pour PME B2B',
 'Marché des services d''automatisation marketing et IA pour PME et startups B2B francophones',
 ARRAY['Trop de tâches marketing manuelles et répétitives', 'Pas de système de lead gen automatisé', 'Outils IA sous-exploités (ChatGPT, Make, Clay)', 'Équipe marketing trop petite pour le volume'],
 ARRAY['Marché en explosion (+60%/an avec l''IA)', 'Peu de prestataires spécialisés automatisation IA en FR', 'Ticket moyen élevé (2K-5K€/mois récurrent)', 'PME prêtes à investir pour gagner du temps'],
 '[{"name": "Growth Machine", "positioning": "Agence outbound B2B", "pricing_estimate": "3000-8000€/mois"},
   {"name": "Lemlist/Instantly", "positioning": "Outils SaaS cold outreach", "pricing_estimate": "99-299€/mois"},
   {"name": "Agences SEA classiques", "positioning": "Gestion Google/Meta Ads", "pricing_estimate": "1500-3000€/mois"}]'::jsonb,
 88, 'Expert automatisation marketing IA — Le système qui génère des leads 24/7 sans équipe marketing',
 '{"name": "Sophie", "age": 35, "situation": "CMO d''une startup SaaS B2B (15 personnes)", "revenue": "500K-2M ARR", "frustration": "2 personnes au marketing pour tout faire, impossible de scaler", "desire": "Un système automatisé qui génère 50+ leads qualifiés/mois", "objection": "On a déjà testé des outils d''automatisation sans résultat"}'::jsonb,
 '{"prenom": "Sophie", "age": 35, "profession": "CMO startup SaaS", "revenu_actuel": "500K ARR", "objectif": "Doubler les leads qualifiés en 60 jours", "peur_principale": "Investir dans un prestataire qui ne comprend pas notre marché", "canal_prefere": "LinkedIn + Email"}'::jsonb,
 3, 'France', 'fr', true,
 '{"analysis_date": "2026-03-01", "confidence": 0.92}'::jsonb,
 NOW() - INTERVAL '30 days'),

(market2_id, demo_user_id, 'IA No-Code pour Agences Marketing',
 'Marché de la formation et du consulting en automatisation no-code pour agences marketing',
 ARRAY['Agences débordées par les tâches répétitives', 'Pas de compétences techniques en interne', 'Difficulté à proposer des services IA aux clients'],
 ARRAY['Forte demande de montée en compétences IA', 'Agences prêtes à payer pour se former'],
 '[]'::jsonb,
 72, 'Formation automatisation IA pour agences marketing',
 '{}'::jsonb, '{}'::jsonb, 2, 'France', 'fr', false,
 '{"analysis_date": "2026-03-05"}'::jsonb,
 NOW() - INTERVAL '25 days'),

(market3_id, demo_user_id, 'Growth Ops as a Service pour SaaS',
 'Service externalisé de growth operations (RevOps + marketing automation) pour startups SaaS',
 ARRAY['Startups SaaS early-stage sans équipe growth', 'Stack marketing fragmentée et non connectée'],
 ARRAY['Modèle récurrent MRR élevé', 'Marché SaaS en croissance'],
 '[]'::jsonb,
 65, 'Growth Ops externalisé pour SaaS early-stage',
 '{}'::jsonb, '{}'::jsonb, 2, 'France', 'fr', false,
 '{"analysis_date": "2026-03-08"}'::jsonb,
 NOW() - INTERVAL '20 days');

-- ─── 3. CONCURRENTS ─────────────────────────────────────
INSERT INTO competitors (user_id, market_analysis_id, competitor_name, positioning, pricing, strengths, weaknesses, gap_opportunity, source) VALUES
(demo_user_id, market1_id, 'Growth Machine', 'Agence outbound B2B premium', '3000€ - 8000€/mois',
 ARRAY['Méthodologie éprouvée', 'Équipe dédiée par client', 'Forte notoriété LinkedIn'],
 ARRAY['Prix élevé inaccessible pour PME', 'Pas d''automatisation IA avancée', 'Process rigide'],
 'Automatisation IA accessible aux PME à budget moyen (2-3K€/mois)', 'LinkedIn + site web'),

(demo_user_id, market1_id, 'Freelances Make/Zapier', 'Freelances techniques no-code', '500€ - 1500€ par projet',
 ARRAY['Prix bas', 'Flexibilité', 'Compétences techniques'],
 ARRAY['Pas de vision marketing', 'Livrable technique sans stratégie', 'Pas de suivi ni récurrence'],
 'Combiner expertise marketing + automatisation technique en offre récurrente', 'Malt + Upwork'),

(demo_user_id, market1_id, 'Agences SEA classiques', 'Gestion de campagnes publicitaires', '1500€ - 3000€/mois',
 ARRAY['Expertise ads solide', 'Reporting régulier', 'Certifications Google/Meta'],
 ARRAY['Pas d''automatisation beyond ads', 'Pas d''IA dans le process', 'Siloed — ne couvrent que les ads'],
 'Offre intégrée : ads + automatisation lead nurturing + IA', 'Google + LinkedIn');

-- ─── 4. OFFRE PRINCIPALE ────────────────────────────────
INSERT INTO offers (id, user_id, market_analysis_id, offer_name, positioning, unique_mechanism, pricing_strategy, guarantees, no_brainer_element, risk_reversal, delivery_structure, status, ai_raw_response, created_at) VALUES
(offer_id, demo_user_id, market1_id,
 'AutoGrowth — Système d''acquisition automatisé par l''IA',
 'Le seul service qui installe un système complet d''acquisition automatisé IA — de la prospection au nurturing — en 30 jours',
 'La Stack AutoGrowth™ : Clay + Make + Instantly + ChatGPT — un système propriétaire qui génère des leads qualifiés 24/7 sans intervention humaine',
 '{"main_price": 2997, "payment_plan": "3x 1099€", "currency": "EUR", "positioning": "premium", "anchor_price": 6000, "justification": "ROI moyen de 8x dès le 2ème mois — un seul client signé rembourse l''investissement"}'::jsonb,
 '["Garantie résultats : 30+ leads qualifiés/mois ou on prolonge gratuitement", "Garantie technique : maintenance incluse pendant 3 mois", "Garantie satisfaction : remboursement intégral sous 14 jours"]'::jsonb,
 'Audit gratuit de ton stack marketing (valeur 500€) + 1 automatisation bonus offerte si tu signes cette semaine',
 'Garantie 60 jours : 30+ leads qualifiés/mois ou on prolonge gratuitement jusqu''à atteindre l''objectif.',
 '{"modules": [
    {"name": "Phase 1 — Audit & Stratégie", "description": "Audit du stack actuel, mapping des automatisations, stratégie d''acquisition", "duration": "Semaine 1"},
    {"name": "Phase 2 — Setup Technique", "description": "Installation Clay + Make + Instantly, scraping, enrichissement, séquences", "duration": "Semaines 2-3"},
    {"name": "Phase 3 — Lancement", "description": "Activation des séquences, A/B testing, optimisation des taux de réponse", "duration": "Semaine 4"},
    {"name": "Phase 4 — Optimisation", "description": "Analyse des résultats, ajustements IA, scaling du volume", "duration": "Mois 2-3"}
  ], "bonuses": ["Dashboard de suivi temps réel", "Playbook d''automatisation (50+ templates)", "Support Slack illimité", "1 call stratégie/mois"]}'::jsonb,
 'validated',
 '{"generated_at": "2026-03-02", "model": "claude"}'::jsonb,
 NOW() - INTERVAL '28 days');

UPDATE offers SET
  oto_offer = '{"oto_name": "Pack Content Automation", "oto_price": 997, "oto_description": "Automatisation de la création de contenu LinkedIn + newsletter avec l''IA — posts générés, planifiés et publiés automatiquement", "oto_benefits": ["30 posts LinkedIn/mois générés par IA", "Newsletter hebdo automatisée", "Reporting engagement automatique"]}'::jsonb,
  ai_raw_response = '{"offer_name": "AutoGrowth", "price": 2997, "target": "PME B2B 10-50 personnes", "unique_mechanism": "Stack AutoGrowth Clay+Make+Instantly+ChatGPT", "guarantee": "30+ leads qualifiés/mois ou prolongation gratuite", "delivery": {"format": "Done-for-you + consulting", "duration": "30 jours setup + 3 mois maintenance", "calls_per_month": 1, "platform": "Make + Slack", "resources": "Dashboard + Playbook + Templates"}}'::jsonb
WHERE id = offer_id;

-- ─── 5. FUNNEL ──────────────────────────────────────────
INSERT INTO funnels (id, user_id, offer_id, funnel_name, optin_page, vsl_page, thankyou_page, status, total_visits, total_optins, conversion_rate, created_at) VALUES
(funnel_id, demo_user_id, offer_id,
 'Funnel AutoGrowth — Audit Gratuit',
 '{"headline": "Tu perds 20h/semaine sur des tâches marketing manuelles ?", "subheadline": "Découvre comment l''IA peut générer 30+ leads qualifiés/mois pendant que tu dors", "bullet_points": ["Pourquoi 80% des PME sous-exploitent l''IA marketing", "Le système en 4 étapes pour automatiser ton acquisition", "Comment un de mes clients a généré +180% de leads en 60 jours"], "cta_text": "Réserve ton audit gratuit →", "social_proof_text": "6 PME accompagnées, +180% de leads en moyenne"}'::jsonb,
 '{"headline": "Le Système AutoGrowth : Comment générer des leads B2B qualifiés 24/7 avec l''IA", "intro_text": "Dans cette vidéo, je te montre le système exact que j''installe pour mes clients PME.", "benefit_bullets": ["Un système d''acquisition qui tourne sans toi", "Des leads qualifiés enrichis par l''IA", "Un coût par lead divisé par 3 vs les agences classiques"], "faq": [{"question": "C''est adapté à mon secteur ?", "answer": "Le système fonctionne pour tout le B2B — SaaS, services, consulting, formation."}]}'::jsonb,
 '{"confirmation_message": "Ton audit gratuit est confirmé !", "next_steps": ["Vérifie ta boîte mail pour le lien Calendly", "Prépare un aperçu de ton stack marketing actuel", "Note tes objectifs de leads mensuels"], "upsell_headline": "Pack Content Automation", "upsell_cta": "Ajouter le Pack — 997€"}'::jsonb,
 'published', 847, 198, 23.38,
 NOW() - INTERVAL '25 days');

-- ─── 6. BRAND IDENTITY ──────────────────────────────────
INSERT INTO brand_identities (id, user_id, offer_id, brand_names, selected_name, art_direction, logo_concept, brand_kit, status, created_at) VALUES
(brand_id, demo_user_id, offer_id,
 '["AutoGrowth", "GrowthPilot", "LeadForge"]'::jsonb,
 'AutoGrowth',
 '{"style": "Tech moderne et épuré", "mood": "Innovation, efficacité, confiance", "colors": ["#6366F1", "#0B0E11", "#FFFFFF"]}'::jsonb,
 'Logo minimaliste — le A stylisé en circuit / flux automatisé avec une flèche de croissance.',
 '{"primary_color": "#6366F1", "secondary_color": "#0B0E11", "accent_color": "#34D399", "font_heading": "Satoshi", "font_body": "Inter", "tone_of_voice": "Tech expert mais accessible — pas de jargon inutile"}'::jsonb,
 'validated',
 NOW() - INTERVAL '22 days');

-- ─── 7. SALES ASSETS ────────────────────────────────────
INSERT INTO sales_assets (user_id, offer_id, asset_type, title, content, ai_raw_response, status, created_at) VALUES
(demo_user_id, offer_id, 'vsl_script', 'VSL — AutoGrowth',
 'Script VSL de 12 minutes pour le système AutoGrowth',
 '{"hook": "Tu passes 20h par semaine sur des tâches marketing manuelles ? Cette vidéo va tout changer.", "problem": "80% des PME B2B font leur marketing à la main. Résultat : peu de leads, beaucoup de temps perdu.", "solution": "Le système AutoGrowth combine Clay + Make + Instantly + ChatGPT pour automatiser toute ta chaîne d''acquisition.", "proof": "Mon client SaaS est passé de 12 à 45 leads qualifiés/mois en 60 jours — sans embaucher.", "close": "Réserve ton audit gratuit de 30 minutes — je te montre exactement ce qu''on peut automatiser chez toi."}'::jsonb,
 'validated', NOW() - INTERVAL '20 days'),
(demo_user_id, offer_id, 'email_sequence', 'Séquence Email — Nurturing AutoGrowth',
 'Séquence de 5 emails pour convertir les leads après l''audit',
 '{"emails": [{"subject": "Ton audit AutoGrowth est confirmé ✓", "type": "confirmation"}, {"subject": "3 automatisations que tu peux mettre en place aujourd''hui", "type": "value"}, {"subject": "Comment mon client SaaS a généré +180% de leads", "type": "case_study"}, {"subject": "Les 5 outils IA que j''utilise au quotidien", "type": "value"}, {"subject": "On en discute ? (dernières places ce mois)", "type": "urgency"}]}'::jsonb,
 'validated', NOW() - INTERVAL '18 days'),
(demo_user_id, offer_id, 'sales_script', 'Script de Vente — Call Audit AutoGrowth',
 'Script pour l''appel d''audit/closing',
 '{"phases": [{"name": "Contexte", "duration": "5 min", "goal": "Comprendre le business et le stack actuel"}, {"name": "Diagnostic", "duration": "15 min", "goal": "Identifier les tâches manuelles et les automatisations possibles"}, {"name": "Vision", "duration": "5 min", "goal": "Projeter le client dans un système automatisé"}, {"name": "Proposition", "duration": "10 min", "goal": "Présenter AutoGrowth et le ROI attendu"}, {"name": "Closing", "duration": "5 min", "goal": "Traiter les objections et closer"}]}'::jsonb,
 'validated', NOW() - INTERVAL '16 days'),
(demo_user_id, offer_id, 'lead_magnet', 'Checklist — 10 Automatisations IA pour PME',
 'Lead magnet PDF',
 '{"title": "10 Automatisations IA que Toute PME Devrait Avoir", "items": ["Enrichissement automatique des leads (Clay)", "Séquences cold email personnalisées par IA", "Scoring des leads automatique", "Contenu LinkedIn généré par ChatGPT", "Newsletter automatisée", "CRM auto-alimenté", "Reporting hebdo automatique", "Veille concurrentielle IA", "Chatbot qualification prospects", "Workflow onboarding client"]}'::jsonb,
 'draft', NOW() - INTERVAL '14 days'),
(demo_user_id, offer_id, 'follower_ads', 'Follower Ads — AutoGrowth',
 'Publicités followers LinkedIn',
 '{"ads": [{"hook": "J''automatise le marketing de PME B2B avec l''IA 🤖", "body": "Tips automatisation quotidiens — Make, Clay, ChatGPT.", "cta": "Suivre"}, {"hook": "80% du marketing B2B peut être automatisé.", "body": "Je montre comment chaque semaine.", "cta": "S''abonner"}]}'::jsonb,
 'draft', NOW() - INTERVAL '10 days'),
(demo_user_id, offer_id, 'dm_retargeting', 'DM Retargeting — AutoGrowth',
 'Scripts DM retargeting LinkedIn',
 '{"scripts": [{"trigger": "A visité la page AutoGrowth", "message": "Hey ! Tu as des questions sur l''automatisation marketing IA ?"}, {"trigger": "A liké un post sur l''automatisation", "message": "Content que le sujet t''intéresse ! Tu automatises déjà des trucs côté marketing ?"}, {"trigger": "A téléchargé la checklist", "message": "Tu as vu la checklist — tu veux qu''on regarde ensemble ce qui est applicable chez toi ?"}]}'::jsonb,
 'draft', NOW() - INTERVAL '8 days');

-- ─── 8. AD CREATIVES ────────────────────────────────────
INSERT INTO ad_creatives (user_id, creative_type, ad_copy, headline, hook, cta, angle, status, impressions, clicks, ctr, spend, conversions, cpa, created_at) VALUES
(demo_user_id, 'image',
 'Tu passes 20h/semaine sur des tâches marketing répétitives ? Mon système AutoGrowth automatise tout avec l''IA. Résultat : +180% de leads pour mes clients.',
 'Automatise ton marketing avec l''IA', '20h/semaine perdues en tâches manuelles ?', 'Réserver mon audit gratuit',
 'Douleur → Solution', 'active', 32400, 1520, 4.69, 645.00, 38, 16.97,
 NOW() - INTERVAL '20 days'),
(demo_user_id, 'image',
 'Mon client SaaS est passé de 12 à 45 leads qualifiés/mois en 60 jours. Sans embaucher. Grâce à l''automatisation IA.',
 'De 12 à 45 leads/mois en 60 jours', 'Les résultats parlent', 'Voir le case study',
 'Preuve sociale', 'active', 28100, 1680, 5.98, 534.00, 42, 12.71,
 NOW() - INTERVAL '18 days'),
(demo_user_id, 'carousel',
 'Les 5 automatisations IA que toute PME B2B devrait avoir en 2026',
 '5 automatisations IA essentielles', '80% des PME perdent du temps sur ça', 'Télécharger la checklist',
 'Éducatif', 'active', 41800, 2850, 6.82, 890.00, 55, 16.18,
 NOW() - INTERVAL '15 days'),
(demo_user_id, 'video_script',
 'Script vidéo 60s — Les PME qui n''automatisent pas leur marketing vont disparaître',
 'Automatise ou disparais', 'En 2026, si ton marketing n''est pas automatisé...', 'Réserve ton audit gratuit',
 'Urgence → Autorité', 'active', 22300, 1180, 5.29, 478.00, 28, 17.07,
 NOW() - INTERVAL '12 days'),
(demo_user_id, 'dm_script',
 'Script DM LinkedIn pour prospects engagés',
 'Outreach LinkedIn', 'Hey ! J''ai vu que tu t''intéresses à l''automatisation marketing',
 'On en discute 15 min ?', 'Conversationnel',
 'draft', 0, 0, 0, 0, 0, 0,
 NOW() - INTERVAL '10 days');

-- ─── 9. CAMPAGNES ───────────────────────────────────────
INSERT INTO ad_campaigns (id, user_id, campaign_name, campaign_type, daily_budget, total_budget, status, total_spend, total_impressions, total_clicks, total_conversions, roas, start_date, end_date, audience_config, ai_recommendations, created_at) VALUES
(campaign1_id, demo_user_id, 'AutoGrowth — Acquisition Audit Gratuit', 'conversions', 40.00, 1200.00,
 'active', 985.50, 124000, 7230, 163, 4.15,
 (CURRENT_DATE - INTERVAL '25 days')::date, (CURRENT_DATE + INTERVAL '5 days')::date,
 '{"targeting": "CMO/Founders PME B2B FR, 28-50 ans, intérêts: marketing automation, SaaS, growth hacking", "lookalike": "1% clients existants"}'::jsonb,
 '["La créative carousel performe le mieux (6.82% CTR) — augmenter le budget", "Tester un angle témoignage vidéo client SaaS"]'::jsonb,
 NOW() - INTERVAL '25 days'),
(campaign2_id, demo_user_id, 'AutoGrowth — Retargeting Visiteurs', 'retargeting', 20.00, 600.00,
 'active', 387.20, 35000, 2280, 72, 5.65,
 (CURRENT_DATE - INTERVAL '20 days')::date, (CURRENT_DATE + INTERVAL '10 days')::date,
 '{"targeting": "Visiteurs page AutoGrowth + téléchargements checklist 30 derniers jours"}'::jsonb,
 '["Retargeting très performant (ROAS 5.65x)", "Ajouter un angle case study client"]'::jsonb,
 NOW() - INTERVAL '20 days');

-- ─── 10. AD DAILY METRICS (30 jours) ────────────────────
INSERT INTO ad_daily_metrics (user_id, date, spend, impressions, clicks, conversions, roas, ctr, cpm, cpa)
SELECT demo_user_id, d::date,
  ROUND((30 + random() * 30)::numeric, 2),
  (3000 + floor(random() * 2500))::integer,
  (150 + floor(random() * 180))::integer,
  (4 + floor(random() * 7))::integer,
  ROUND((3.0 + random() * 3.5)::numeric, 2),
  ROUND((4.0 + random() * 3.5)::numeric, 2),
  ROUND((7 + random() * 6)::numeric, 2),
  ROUND((10 + random() * 12)::numeric, 2)
FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day', '1 day') AS d
ON CONFLICT (user_id, date) DO NOTHING;

-- ─── 11. CONTENT PIECES ─────────────────────────────────
INSERT INTO content_pieces (user_id, content_type, title, content, hook, hashtags, scheduled_date, published, views, likes, comments, shares, created_at) VALUES
(demo_user_id, 'instagram_reel', '3 automatisations IA que tu dois avoir en 2026',
 'Automatisation 1: Enrichissement leads avec Clay\nAutomatisation 2: Séquences cold email IA avec Instantly\nAutomatisation 3: Reporting automatique avec Make + Airtable',
 'Tu fais encore ton marketing à la main ?', ARRAY['#automatisation', '#ia', '#marketing', '#b2b'],
 (CURRENT_DATE - INTERVAL '5 days')::date, true, 8900, 620, 48, 95, NOW() - INTERVAL '7 days'),
(demo_user_id, 'instagram_carousel', 'Clay + Make + Instantly : le stack ultime',
 'Slide 1: Le problème (marketing manuel)\nSlide 2: Clay — enrichissement\nSlide 3: Make — orchestration\nSlide 4: Instantly — séquences\nSlide 5: Résultats (+180% leads)',
 'Ce stack a changé mon business. Swipe →', ARRAY['#nocode', '#automatisation', '#leadgen'],
 (CURRENT_DATE - INTERVAL '3 days')::date, true, 6700, 940, 72, 156, NOW() - INTERVAL '5 days'),
(demo_user_id, 'youtube_video', 'Comment j''ai automatisé l''acquisition de 6 PME avec l''IA',
 'Retour d''expérience sur 6 mois d''automatisation marketing IA pour mes clients PME B2B. Résultats, outils, process.',
 'Cette vidéo résume 6 mois de travail.', ARRAY['#automatisation', '#ia', '#pme'],
 (CURRENT_DATE - INTERVAL '10 days')::date, true, 2800, 215, 38, 24, NOW() - INTERVAL '12 days'),
(demo_user_id, 'instagram_story', 'Behind the scenes — Workflow Make',
 'Aperçu du workflow Make que je viens de builder : 45 leads enrichis automatiquement ce matin 🤖',
 NULL, ARRAY['#make', '#automatisation'], NULL, true, 1650, 0, 0, 0, NOW() - INTERVAL '2 days'),
(demo_user_id, 'linkedin_post', 'J''ai remplacé 20h de travail manuel par 3 automatisations',
 'Il y a 6 mois, je passais 20h/semaine sur des tâches marketing répétitives.\nAujourd''hui, 3 automatisations font le travail pour moi ET pour mes 6 clients.\nRésultat moyen : +180% de leads, -70% de temps passé.\nLes 3 outils : Clay, Make, Instantly.',
 NULL, ARRAY['#automatisation', '#ia', '#marketing', '#growth'],
 (CURRENT_DATE - INTERVAL '8 days')::date, true, 3200, 245, 34, 28, NOW() - INTERVAL '9 days');

-- ─── 12. COMMUNITY POSTS ────────────────────────────────
INSERT INTO community_posts (user_id, category, title, content, likes_count, comments_count, created_at) VALUES
(demo_user_id, 'wins', '+180% de leads pour mon client SaaS !',
 'Mon client SaaS est passé de 12 à 45 leads qualifiés/mois grâce au système AutoGrowth. Stack : Clay + Make + Instantly.', 24, 8, NOW() - INTERVAL '5 days'),
(demo_user_id, 'general', 'Nouveau template Make — enrichissement leads',
 'Template Make pour enrichir automatiquement les leads LinkedIn avec Clay. Import et c''est parti.', 15, 5, NOW() - INTERVAL '12 days'),
(demo_user_id, 'questions', 'Quel CPA visez-vous en B2B ?',
 'Pour une offre à 3000€/mois, quel CPA trouvez-vous acceptable ? Je suis à ~15€ actuellement.', 18, 12, NOW() - INTERVAL '18 days');

-- ─── 13. DAILY PERFORMANCE METRICS ──────────────────────
INSERT INTO daily_performance_metrics (user_id, date, spend, impressions, clicks, leads, calls, clients, revenue)
SELECT demo_user_id, d::date,
  ROUND((30 + random() * 30)::numeric, 2),
  (3000 + floor(random() * 2500))::integer,
  (150 + floor(random() * 180))::integer,
  (6 + floor(random() * 10))::integer,
  (1 + floor(random() * 3))::integer,
  CASE WHEN random() > 0.65 THEN (1 + floor(random() * 2))::integer ELSE 0 END,
  CASE WHEN random() > 0.65 THEN ROUND((1500 + random() * 3000)::numeric, 2) ELSE 0 END
FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day', '1 day') AS d
ON CONFLICT (user_id, date) DO NOTHING;

-- ─── 14. LTV / CAC ─────────────────────────────────────
INSERT INTO ltv_cac_entries (user_id, date, avg_deal_value, monthly_churn_rate, monthly_ad_spend, new_customers) VALUES
(demo_user_id, '2025-10', 2500, 0.10, 800, 2),
(demo_user_id, '2025-11', 2800, 0.08, 900, 3),
(demo_user_id, '2025-12', 2997, 0.07, 1000, 3),
(demo_user_id, '2026-01', 2997, 0.06, 1100, 4),
(demo_user_id, '2026-02', 2997, 0.05, 1200, 5),
(demo_user_id, '2026-03', 3200, 0.05, 1400, 6)
ON CONFLICT (user_id, date) DO NOTHING;

-- ─── 15. LEADERBOARD ────────────────────────────────────
INSERT INTO leaderboard_scores (user_id, progress_score, business_score, engagement_score, composite_score, rank_position, monthly_revenue, total_clients, total_leads)
VALUES (demo_user_id, 82, 85, 78, 82, 2, 9500, 6, 198)
ON CONFLICT (user_id) DO UPDATE SET
  progress_score = 82, business_score = 85, engagement_score = 78,
  composite_score = 82, rank_position = 2, monthly_revenue = 9500,
  total_clients = 6, total_leads = 198;

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
 'Tu perds 20h/semaine sur des tâches manuelles ?', 98, 412,
 'Automatise ton marketing avec l''IA en 30 jours', 118, 435, 800, 'B'),
(demo_user_id, 'Angle pub principale', 'taux_clic', 'active',
 'Angle Douleur : 20h perdues/semaine', 72, 380,
 'Angle Preuve : +180% de leads en 60 jours', 89, 375, 800, NULL);

-- ─── 18. NOTIFICATIONS ──────────────────────────────────
INSERT INTO notifications (user_id, type, title, message, link, read, created_at) VALUES
(demo_user_id, 'badge', 'Nouveau badge !', 'Badge "Content Creator" débloqué !', '/progress', true, NOW() - INTERVAL '3 days'),
(demo_user_id, 'milestone', 'Milestone atteint !', 'Palier Lancement complété. Prochaine étape : Traction !', '/progress', true, NOW() - INTERVAL '7 days'),
(demo_user_id, 'system', 'Nouvelle fonctionnalité', 'L''agent Recherche est disponible pour analyser tes marchés !', '/market', false, NOW() - INTERVAL '1 day'),
(demo_user_id, 'win', 'Record de ROAS !', 'Campagne "Retargeting" à 5.65x ROAS !', '/ads', false, NOW() - INTERVAL '2 days'),
(demo_user_id, 'community', 'Nouveau commentaire', 'Marc a commenté ton post sur l''automatisation.', '/community', false, NOW() - INTERVAL '1 day');

-- ─── 19. ACTIVITY LOG ───────────────────────────────────
INSERT INTO activity_log (user_id, activity_type, activity_data, created_at) VALUES
(demo_user_id, 'generation.market', '{"market": "Automatisation Marketing IA pour PME B2B"}'::jsonb, NOW() - INTERVAL '30 days'),
(demo_user_id, 'generation.offer', '{"offer": "AutoGrowth"}'::jsonb, NOW() - INTERVAL '28 days'),
(demo_user_id, 'generation.funnel', '{"funnel": "Funnel AutoGrowth"}'::jsonb, NOW() - INTERVAL '25 days'),
(demo_user_id, 'generation.brand', '{"brand": "AutoGrowth"}'::jsonb, NOW() - INTERVAL '22 days'),
(demo_user_id, 'generation.vsl', '{"asset": "VSL AutoGrowth"}'::jsonb, NOW() - INTERVAL '20 days'),
(demo_user_id, 'generation.ads', '{"creative": "Image — Douleur 20h/semaine"}'::jsonb, NOW() - INTERVAL '18 days'),
(demo_user_id, 'generation.content', '{"content": "Reel — 3 automatisations IA"}'::jsonb, NOW() - INTERVAL '7 days'),
(demo_user_id, 'community.post', '{"title": "+180% de leads pour mon client SaaS !"}'::jsonb, NOW() - INTERVAL '5 days'),
(demo_user_id, 'login', '{}'::jsonb, NOW() - INTERVAL '1 day'),
(demo_user_id, 'login', '{}'::jsonb, NOW());

-- ─── 20. AGENT CONVERSATIONS ────────────────────────────
INSERT INTO agent_conversations (user_id, agent_type, title, messages, created_at) VALUES
(demo_user_id, 'strategie', 'Stratégie pricing AutoGrowth',
 '[{"role": "user", "content": "Je veux passer de 4.5K à 20K/mois. Comment structurer mon offre récurrente ?"}, {"role": "assistant", "content": "3 axes : 1. Setup fee 2997€ + maintenance 997€/mois 2. Upsell Content Automation 3. Viser 8-10 clients récurrents."}]'::jsonb,
 NOW() - INTERVAL '15 days'),
(demo_user_id, 'ads', 'Optimisation campagne LinkedIn Ads',
 '[{"role": "user", "content": "Mon CPA est à 15€ mais le volume de leads est faible."}, {"role": "assistant", "content": "Élargis ton audience : ajoute les fondateurs de startups 10-50 personnes. Teste un angle vidéo témoignage client."}]'::jsonb,
 NOW() - INTERVAL '8 days'),
(demo_user_id, 'recherche', 'Analyse concurrence automatisation IA France',
 '[{"role": "user", "content": "Qui sont mes concurrents directs en automatisation marketing IA en France ?"}, {"role": "assistant", "content": "3 catégories : 1. Agences outbound (Growth Machine, Aloha) 2. Freelances Make/Zapier sur Malt 3. Agences SEA classiques qui ajoutent de l''IA. Ton positionnement combine les 3 — c''est ta force."}]'::jsonb,
 NOW() - INTERVAL '5 days');

-- ─── 21. TASKS ──────────────────────────────────────────
INSERT INTO tasks (user_id, title, description, task_type, related_module, estimated_minutes, due_date, completed, completed_at, task_order, created_at) VALUES
(demo_user_id, 'Filmer le case study client SaaS', 'Vidéo témoignage : de 12 à 45 leads/mois', 'action', 'content', 120, (CURRENT_DATE + INTERVAL '3 days')::date, false, NULL, 1, NOW() - INTERVAL '3 days'),
(demo_user_id, 'Créer 3 templates Make à partager', 'Templates enrichissement, scoring, reporting', 'action', 'content', 90, (CURRENT_DATE + INTERVAL '5 days')::date, false, NULL, 2, NOW() - INTERVAL '2 days'),
(demo_user_id, 'Augmenter budget acquisition', 'Passer de 40€ à 60€/jour sur la campagne principale', 'action', 'ads', 15, (CURRENT_DATE + INTERVAL '1 day')::date, false, NULL, 3, NOW() - INTERVAL '1 day'),
(demo_user_id, 'Lancer séquence nurturing SMS', 'Générer et activer la séquence SMS post-audit', 'action', 'sales', 45, (CURRENT_DATE + INTERVAL '7 days')::date, false, NULL, 4, NOW()),
(demo_user_id, 'Publier le carousel Clay+Make+Instantly', 'Finaliser et publier le carousel LinkedIn', 'action', 'content', 30, (CURRENT_DATE - INTERVAL '2 days')::date, true, NOW() - INTERVAL '2 days', 5, NOW() - INTERVAL '5 days'),
(demo_user_id, 'Analyser les KPIs du mois', 'Revoir : CPA, ROAS, leads qualifiés, taux closing, MRR', 'review', 'analytics', 45, CURRENT_DATE::date, false, NULL, 6, NOW() - INTERVAL '1 day');

RAISE NOTICE 'Données demo insérées pour Wassim (%)' , demo_user_id;

END $$;

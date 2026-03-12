# ScalingFlow — Suivi Cahier des Charges (93 fonctionnalités)

> Dernière mise à jour : 2026-03-12
> Bilan : **86 DONE** / **3 PARTIAL** / **4 MISSING** (+ 7 features enrichies conformité CDC)

---

## ONBOARDING & VAULT (4/4 DONE)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Onboarding guidé | DONE | Wizard multi-étapes, 50+ champs, store Zustand |
| 2 | Vault de compétences | DONE | Skill map radar + **mindmap SVG interactive** (survol = détail skills), extraction, avantage concurrentiel, documents |
| 3 | Sélection de parcours | DONE | Parcours selector intégré à l'onboarding |
| 4 | Upload de ressources | DONE | PDF/text/csv, extraction texte, Supabase Storage |

## RECHERCHE MARCHÉ & AVATAR (6/6 DONE)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 5 | Exploration de marché | DONE | Page market 5 onglets, API analyze-market, **scoring composite 3 dimensions** (attractivité/concurrence/potentiel) + **estimation budget client** |
| 6 | Scraper d'insights | DONE | insights-scraper IA (Reddit, forums, YouTube, reviews simulés) + API scrape-insights |
| 7 | ICP Pro Max (avatar) | DONE | generate-persona + prompt persona-forge, **bio fictive ultra-détaillée + journée type + canaux médias consommés + export PDF persona card** |
| 8 | Analyse sophistication Schwartz | DONE | analyze-schwartz + schwartz-display |
| 9 | Analyse concurrentielle | DONE | Analyse IA enrichie : insights pub (Meta/IG/YT/TikTok), contenu organique, benchmarks sectoriels, funnels, CA estimé |
| 10 | Audit business existant | DONE | Vault extraction + competitive advantage |

## CRÉATION D'OFFRE (7/7 DONE)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 11 | Générateur positionnement (Category OS) | DONE | category-os-wizard + prompt |
| 12 | Générateur mécanisme unique | DONE | Intégré dans offer-creation |
| 13 | Générateur offre complète | DONE | offer-generator + prompt complet |
| 14 | Calculateur de pricing | DONE | pricing-builder, anchor price, value breakdown |
| 15 | Générateur de garantie | DONE | Intégré dans offer-creation (guarantees + risk_reversal) |
| 16 | Structure de delivery | DONE | delivery-designer + prompt |
| 17 | Validation score offre | DONE | score-offer + offer-score-card (/100, 6 critères) |

## IDENTITÉ DE MARQUE (4/4 DONE)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 18 | Générateur de nom | DONE | generate-brand + name-generator |
| 19 | Générateur de DA | DONE | Palette, typos, style visuel, moodboard |
| 20 | Générateur de logo | DONE | Concept texte + **3 variations typées (principal, icône, monochrome) en PNG** via Replicate Flux |
| 21 | Kit de marque | DONE | Mission, vision, valeurs, ton, do/don't |

## FUNNEL VSL (5/5 DONE)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 22 | Générateur landing page | DONE | funnel-builder, type opt-in |
| 23 | Générateur page VSL | DONE | funnel-builder, type VSL |
| 24 | Générateur script VSL | DONE | generate-assets type vsl_script |
| 25 | Page remerciements + OTO | DONE | Funnel thankyou + oto-generator |
| 26 | A/B Testing setup | DONE | ab-test-manager, **auto-déclaration gagnant quand 100+ visites/variante + confiance ≥90%** |

## FUNNEL SOCIAL (7/7 DONE)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 27 | Optimisateur profil Instagram | DONE | optimize-instagram + instagram-optimizer |
| 28 | Stratégie contenu K/L/T | DONE | strategy-overview + content-strategy |
| 29 | Scripteur de Reels | DONE | reels-generator + prompt |
| 30 | Scripteur YouTube | DONE | youtube-generator + prompt |
| 31 | Générateur de Stories | DONE | stories-generator + prompt |
| 32 | Générateur de carousels | DONE | carousel-generator + prompt |
| 33 | Plan éditorial automatisé | DONE | editorial-calendar + content-calendar + API |

## SALES ASSETS (9/9 DONE)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 34 | Générateur pitch deck | DONE | generate-assets type pitch_deck |
| 35 | Générateur sales letter | DONE | generate-assets type sales_letter |
| 36 | Générateur script de vente | DONE | generate-assets type sales_script |
| 37 | Générateur script de setting | DONE | generate-assets type setting_script |
| 38 | Générateur emails nurturing | DONE | generate-assets type email_sequence |
| 39 | Générateur SMS | DONE | generate-assets type sms_sequence |
| 40 | Générateur études de cas | DONE | generate-assets type case_study |
| 41 | Générateur lead magnets | DONE | generate-assets type lead_magnet |
| 42 | Générateur social assets | DONE | social-assets-generator + prompt, onglet dans assets page |

## CRÉATIVES & ADS (9/9 DONE)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 43 | Ad Spy | DONE | UI + analyse IA complète, onglet Ad Spy dans ads page, API handler generate-ads |
| 44 | Content Spy | DONE | UI + analyse IA complète, onglet Content Spy dans content page, API handler generate-content |
| 45 | Générateur textes publicitaires | DONE | generate-ads + ad-copy + ad-hooks (75+ variations) |
| 46 | Générateur images ads | DONE | Replicate Flux via bouton "Generer visuels IA" dans creative-generator |
| 47 | Générateur scripts ads vidéo | DONE | video-ad-generator + prompt |
| 48 | Contenu organique par pilier | DONE | K/L/T/C pillars dans content page |
| 49 | Follower Ads | DONE | follower-ads-generator + prompt, onglet dans ads page |
| 50 | DM Ads retargeting | DONE | dm-retargeting-generator + prompt + automation DM + audiences |
| 51 | Scripts setting DM | DONE | dm-script-generator + dm-scripts (prospection) |

## INTÉGRATIONS & LANCEMENT (4 DONE / 3 PARTIAL / 3 MISSING — Settings UI ajoutée pour GHL/Meta/Stripe)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 52 | Connect GHL | PARTIAL | Webhook inbound leads + Settings UI (webhook sortant + URL entrant copiable). Pas d'OAuth complet |
| 53 | Connect Meta Ads | PARTIAL | Token + Ad Account ID configurables dans Settings. Pas OAuth |
| 54 | Install Pixel + CAPI | DONE | Generateur de code Pixel + CAPI avec config, events, checklist dans launch/pixel |
| 55 | Connect Stripe / Whop | PARTIAL | Stripe plateforme ok + Settings UI pour Stripe Connect account ID. Pas d'OAuth Stripe Connect complet |
| 56 | Connect Socials | MISSING | Pas d'OAuth IG/YT/LinkedIn |
| 57 | Deploy Funnel | DONE | Export PDF + HTML standalone (dark theme, responsive, 3 pages) |
| 58 | Config audiences Meta | MISSING | Pas d'accès écriture Meta API |
| 59 | Launch Ads automatique | MISSING | Pas de création de campagnes via API |
| 60 | Checklist pré-lancement | DONE | launch/page.tsx (558 lignes) |
| 61 | Guide 10 premiers jours | DONE | Intégré dans launch page |

## TRACKING & ANALYTICS (7/7 DONE)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 62 | Dashboard temps réel | DONE | Auto-refresh 5min + Supabase + export CSV + bouton rafraîchir |
| 63 | Tracking multi-touch | DONE | Attribution model avec revenu réel Supabase, 4 modèles, parcours clients, **export JSON complet** |
| 64 | Tracking calls | DONE | Analyse IA + import fichier (.txt/.srt/.vtt) + collage transcript |
| 65 | Tracking revenue | DONE | metrics-history connecté à Supabase daily_performance_metrics |
| 66 | Vrai ROAS | DONE | ROAS calculé depuis daily_performance_metrics Supabase |
| 67 | Détection bottlenecks | DONE | optimization-recommendations (413 lignes) |
| 68 | Alertes intelligentes | DONE | 7 règles KPI, cooldown 24h, notifications + email Resend |

## MANAGING AUTOMATISÉ ADS (4/4 DONE)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 69 | Monitoring continu | DONE | AdsAutomation : health check 7j, statut auto (sain/warning/critique/scaling) |
| 70 | Décisions automatiques | DONE | Actions recommandées auto (pause, optimise, scale) + analyse IA approfondie |
| 71 | Cycle créatif auto | DONE | Détection fatigue créative + recommandation rotation hooks/angles |
| 72 | Scaling progressif | DONE | Recommandations budget +20-30%, duplication gagnantes |

## CONTENU & VENTE CONTINU (5/5 DONE)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 73 | Contenu continu | DONE | Calendrier 30 jours + statut brouillon/planifié/publié avec compteurs |
| 74 | Adaptation intelligente | DONE | Top creatives + KPIs ads injectés dans prompts contenu |
| 75 | Contenu depuis data vente | DONE | Objections, signaux d'achat et triggers injectés dans prompts contenu |
| 76 | Analyse calls de vente | DONE | call-analyzer + analyze-call + scoring |
| 77 | Métriques vente agrégées | DONE | ltv-cac-tracker migré vers Supabase ltv_cac_entries + metrics-history vers daily_performance_metrics |

## SCALING & BUSINESS (2 DONE / 0 PARTIAL / 1 MISSING)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 78 | Paliers de croissance | DONE | UI dédiée avec **5 paliers CDC** (0-5K, 5-10K, 10-30K, 30-50K, 50K+), checkpoints, actions recommandées + migration DB |
| 79 | Whitelabel complet | MISSING | Pas d'architecture multi-tenant |
| 80 | Générateur OTO | DONE | oto-generator + prompt oto-offer |

## MODULES TRANSVERSAUX (9/9 DONE)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 81 | Knowledge Base (RAG) | DONE | knowledge-base API + rag.ts (chunking, embeddings) |
| 82 | Academy | DONE | academy page + module-list + video-player |
| 83 | Roadmap personnalisée | DONE | roadmap page + daily-tasks + milestone-tracker |
| 84 | Gamification | DONE | Leaderboard, badges, XP, streaks, achievements |
| 85 | Communauté | DONE | Feed, posts, interactions |
| 86 | Agent IA Offre | DONE | Spécialisé positionnement, pricing, mécanisme, garantie |
| 87 | Agent IA Funnel | DONE | Spécialisé copywriting, landing, emails, VSL |
| 88 | Agent IA Ads | DONE | Spécialisé créatives, hooks, angles, audiences |
| 89 | Agent IA Vente | DONE | Spécialisé scripts, setting, objections, closing |
| 90 | Agent IA Contenu | DONE | Spécialisé Reels, YouTube, carousels, stories |
| 91 | Agent IA Stratégie | DONE | Spécialisé vision business, paliers, scaling |
| 92 | Agent IA Recherche | DONE | Spécialisé marché, concurrence, tendances |
| 93 | Agent IA Général | DONE | Support technique et questions libres |

---

## Résumé des 7 features restantes

### PARTIAL (3) — Fonctionnent partiellement
- [~] #52 Connect GHL — Webhook + Settings UI, pas d'OAuth GHL complet
- [~] #53 Connect Meta Ads — Token + Account ID dans Settings, pas OAuth
- [~] #55 Connect Stripe/Whop — Stripe Connect account ID dans Settings, pas d'OAuth complet

### MISSING (4) — Intégrations lourdes nécessitant APIs tierces
- [ ] #56 Connect Socials (OAuth IG/YT/LinkedIn)
- [ ] #58 Config audiences Meta (API write)
- [ ] #59 Launch Ads automatique (API write)
- [ ] #79 Whitelabel (multi-tenant)

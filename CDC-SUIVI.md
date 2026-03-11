# ScalingFlow — Suivi Cahier des Charges (93 fonctionnalités)

> Dernière mise à jour : 2026-03-11
> Bilan : **51 DONE** / **20 PARTIAL** / **22 MISSING**

---

## ONBOARDING & VAULT (4/4 DONE)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Onboarding guidé | DONE | Wizard multi-étapes, 50+ champs, store Zustand |
| 2 | Vault de compétences | DONE | Skill map, extraction, avantage concurrentiel, documents |
| 3 | Sélection de parcours | DONE | Parcours selector intégré à l'onboarding |
| 4 | Upload de ressources | DONE | PDF/text/csv, extraction texte, Supabase Storage |

## RECHERCHE MARCHÉ & AVATAR (4 DONE / 1 PARTIAL / 1 MISSING)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 5 | Exploration de marché | DONE | Page market 5 onglets, API analyze-market |
| 6 | Scraper d'insights | MISSING | Aucun scraping réel (Reddit, forums, YouTube, reviews) |
| 7 | ICP Pro Max (avatar) | DONE | generate-persona + prompt persona-forge |
| 8 | Analyse sophistication Schwartz | DONE | analyze-schwartz + schwartz-display |
| 9 | Analyse concurrentielle | PARTIAL | Analyse IA ok, pas de scraping Meta Ad Library/IG/YT |
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

## IDENTITÉ DE MARQUE (3 DONE / 1 PARTIAL)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 18 | Générateur de nom | DONE | generate-brand + name-generator |
| 19 | Générateur de DA | DONE | Palette, typos, style visuel, moodboard |
| 20 | Générateur de logo | PARTIAL | Concept texte uniquement, pas de génération d'image (Replicate non branché) |
| 21 | Kit de marque | DONE | Mission, vision, valeurs, ton, do/don't |

## FUNNEL VSL (5/5 DONE)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 22 | Générateur landing page | DONE | funnel-builder, type opt-in |
| 23 | Générateur page VSL | DONE | funnel-builder, type VSL |
| 24 | Générateur script VSL | DONE | generate-assets type vsl_script |
| 25 | Page remerciements + OTO | DONE | Funnel thankyou + oto-generator |
| 26 | A/B Testing setup | DONE | ab-test-manager (702 lignes) |

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

## SALES ASSETS (8 DONE / 1 MISSING)

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

## CRÉATIVES & ADS (3 DONE / 2 PARTIAL / 4 MISSING)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 43 | Ad Spy | PARTIAL | UI + analyse IA, pas de scraping Meta Ad Library réel |
| 44 | Content Spy | PARTIAL | UI + analyse IA, pas de scraping IG/YT réel |
| 45 | Générateur textes publicitaires | DONE | generate-ads + ad-copy + ad-hooks (75+ variations) |
| 46 | Générateur images ads | MISSING | Pas de génération d'images (Replicate non branché) |
| 47 | Générateur scripts ads vidéo | DONE | video-ad-generator + prompt |
| 48 | Contenu organique par pilier | DONE | K/L/T/C pillars dans content page |
| 49 | Follower Ads | DONE | follower-ads-generator + prompt, onglet dans ads page |
| 50 | DM Ads retargeting | DONE | dm-retargeting-generator + prompt + automation DM + audiences |
| 51 | Scripts setting DM | DONE | dm-script-generator + dm-scripts (prospection) |

## INTÉGRATIONS & LANCEMENT (2 DONE / 2 PARTIAL / 6 MISSING)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 52 | Connect GHL | MISSING | Aucune intégration GoHighLevel |
| 53 | Connect Meta Ads | PARTIAL | Sync manuelle via token, pas OAuth |
| 54 | Install Pixel + CAPI | MISSING | Aucun code pixel/CAPI |
| 55 | Connect Stripe / Whop | PARTIAL | Stripe plateforme ok, pas pour le business de l'user |
| 56 | Connect Socials | MISSING | Pas d'OAuth IG/YT/LinkedIn |
| 57 | Deploy Funnel | MISSING | Copie texte uniquement, pas de déploiement |
| 58 | Config audiences Meta | MISSING | Pas d'accès écriture Meta API |
| 59 | Launch Ads automatique | MISSING | Pas de création de campagnes via API |
| 60 | Checklist pré-lancement | DONE | launch/page.tsx (558 lignes) |
| 61 | Guide 10 premiers jours | DONE | Intégré dans launch page |

## TRACKING & ANALYTICS (1 DONE / 5 PARTIAL / 1 MISSING)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 62 | Dashboard temps réel | PARTIAL | performance-dashboard existe, données pas temps réel |
| 63 | Tracking multi-touch | PARTIAL | attribution-model UI, données manuelles |
| 64 | Tracking calls | PARTIAL | Analyse IA de transcriptions, pas d'intégration téléphonie |
| 65 | Tracking revenue | PARTIAL | Charts ok, données manuelles |
| 66 | Vrai ROAS | PARTIAL | ROAS affiché, calcul basique Meta |
| 67 | Détection bottlenecks | DONE | optimization-recommendations (413 lignes) |
| 68 | Alertes intelligentes | MISSING | Pas de système d'alertes sur seuils KPI |

## MANAGING AUTOMATISÉ ADS (0 DONE / 1 PARTIAL / 3 MISSING)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 69 | Monitoring continu | PARTIAL | Dashboard campagnes, pas de monitoring auto |
| 70 | Décisions automatiques | MISSING | Recommandations IA ok, pas d'exécution auto |
| 71 | Cycle créatif auto | MISSING | Aucune rotation/fatigue créative automatisée |
| 72 | Scaling progressif | MISSING | Décrit dans prompts agents, pas implémenté |

## CONTENU & VENTE CONTINU (1 DONE / 2 PARTIAL / 2 MISSING)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 73 | Contenu continu | PARTIAL | Calendrier 30 jours ok, pas de scheduling auto |
| 74 | Adaptation intelligente | MISSING | Pas de lien analytics → stratégie contenu auto |
| 75 | Contenu depuis data vente | MISSING | Pas de pipeline calls → contenu |
| 76 | Analyse calls de vente | DONE | call-analyzer + analyze-call + scoring |
| 77 | Métriques vente agrégées | PARTIAL | ltv-cac-tracker + metrics-history, données manuelles |

## SCALING & BUSINESS (1 DONE / 1 PARTIAL / 1 MISSING)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 78 | Paliers de croissance | PARTIAL | Dans prompts agents + roadmap, pas de UI dédiée |
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

## Résumé par priorité

### Quick wins
- [x] #42 Social assets — DONE
- [x] #49 Follower Ads — DONE
- [x] #50 DM Ads retargeting — DONE
- [ ] #68 Alertes intelligentes (notifications sur seuils KPI)
- [ ] #74 Adaptation intelligente (connecter analytics → contenu)
- [ ] #75 Contenu depuis data vente (connecter calls → contenu)

### Complexité moyenne
- [ ] #20 Logo complet (brancher Replicate pour génération d'images)
- [ ] #46 Images ads (idem Replicate)
- [ ] #6 Scraper d'insights (Reddit API, YouTube Data API)
- [ ] #57 Deploy Funnel (export HTML/PDF)
- [ ] #70 Décisions automatiques ads
- [ ] #71 Cycle créatif auto
- [ ] #72 Scaling progressif

### Intégrations lourdes
- [ ] #52 Connect GHL (OAuth + webhooks GoHighLevel)
- [ ] #53 Connect Meta Ads complet (OAuth flow)
- [ ] #54 Install Pixel + CAPI
- [ ] #55 Connect Stripe pour business user
- [ ] #56 Connect Socials (OAuth IG/YT/LinkedIn)
- [ ] #58 Config audiences Meta (API write)
- [ ] #59 Launch Ads automatique (API write)
- [ ] #79 Whitelabel (multi-tenant)

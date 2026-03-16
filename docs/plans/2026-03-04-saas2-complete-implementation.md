# Plan d'implémentation SaaS-2 complet

**Date** : 2026-03-04
**Scope** : ~40 features manquantes, toutes phases (0 → 6)

---

## Tier 1 — Quick Wins (complètent l'existant)

### 1.1 — Vault : Upload de documents (Phase 0.4)

- Ajouter tab "Documents" dans `/vault`
- Upload via Supabase Storage (bucket `vault-documents`)
- Types acceptés : PDF, DOCX, images, audio
- Table `vault_documents` (id, user_id, file_name, file_url, file_type, category, created_at)
- Catégories : case study, SOP, transcript, process, testimonial
- UI : liste de fichiers + bouton upload + preview

### 1.2 — Vault : Questionnaire d'extraction guidée (Phase 0.5)

- Nouveau tab "Extraction IA" dans `/vault`
- Flow conversationnel IA : 10-15 questions dynamiques basées sur le profil
- API route `/api/ai/vault-extraction`
- Prompt template `vault-extraction.ts`
- Sauvegarde des réponses dans `vault_extractions`
- Résultat : document structuré d'expertise actionnable

### 1.3 — Vault : Cartographie visuelle (Phase 0.6)

- Nouveau tab "Cartographie" dans `/vault`
- Visualisation radar/network des compétences
- Recharts RadarChart pour les catégories de compétences
- Liens entre compétences connexes
- Données issues du profil onboarding

### 1.4 — Vault : Score d'avantage compétitif (Phase 0.7)

- Nouveau tab "Avantage" dans `/vault`
- API route `/api/ai/competitive-advantage`
- Calcul IA du score par niche potentielle
- Prompt template `competitive-advantage.ts`
- Affichage : score cards par niche avec radar comparatif

### 1.5 — Études de cas generator (Phase 3.8)

- Nouveau tab "Études de cas" dans `/assets`
- Component `case-study-generator.tsx`
- API route : réutiliser `/api/ai/generate-assets` avec type `case-study`
- Prompt template `case-study.ts` (existe déjà)
- Formulaire : contexte client, problème, solution, résultats

### 1.6 — SMS Sequences (Phase 3.7)

- Implémenter le tab SMS dans `/assets` (actuellement "coming soon")
- Component `sms-sequence-generator.tsx`
- Réutiliser `/api/ai/generate-assets` avec type `sms`
- Prompt template `sms-sequence.ts` (existe déjà)

### 1.7 — Offre OTO dédiée (Phase 2.8)

- Nouveau tab "OTO" dans `/offer`
- Component `oto-generator.tsx`
- Génère : page OTO, upsell copy, pricing, urgency elements
- API : étendre `/api/ai/generate-offer` avec type `oto`

---

## Tier 2 — Valeur ajoutée forte

### 2.1 — Sélection du parcours (Phase 1.1)

- Page `/market` : ajouter step de sélection parcours avant analyse
- Parcours A1 (expert confirmé), A2 (expert émergent), A3 (généraliste), B (freelance), C (agence)
- Le parcours sélectionné influence les prompts IA suivants
- Sauvegarder dans profil utilisateur

### 2.2 — Bleeding-Neck Pains (Phase 1.3)

- Nouveau tab "Pains" dans `/market`
- Framework 4 couches : surface, économique, psychologique, opportunité
- Component `pain-identifier.tsx`
- API route `/api/ai/identify-pains`
- Prompt template `bleeding-neck-pains.ts`

### 2.3 — Structure de delivery (Phase 2.6)

- Nouveau tab "Delivery" dans `/offer`
- Design du système de livraison : agents IA, process, architecture
- Component `delivery-designer.tsx`
- API route : étendre `/api/ai/generate-offer` avec type `delivery`

### 2.4 — Analyse calls de vente (Phase 5 + 6.4)

- Nouvelle page `/sales/call-analysis`
- Upload audio → Transcription (Whisper API ou alternative)
- Analyse IA du call : scoring discovery, objection handling, closing
- Component `call-analyzer.tsx`
- API route `/api/ai/analyze-call`
- Table `call_analyses`

### 2.5 — Logo IA (Phase 3.12)

- Améliorer le tab Logo dans `/brand`
- Intégration Replicate API (SDXL/Flux) pour génération d'images
- Component `logo-generator-ai.tsx`
- API route `/api/ai/generate-logo`

---

## Tier 3 — Intégrations externes

### 3.1 — Ad Spy (Phase 4.1.1)

- Nouvelle page `/ads/spy`
- Scraping Meta Ad Library API
- Component `ad-spy.tsx`
- API route `/api/ads/spy`
- Affichage : grille d'ads concurrentes avec métriques

### 3.2 — Content Spy (Phase 4.1.2)

- Nouvelle page `/content/spy`
- Analyse YouTube (API), Instagram outliers
- Component `content-spy.tsx`
- API route `/api/content/spy`

### 3.3 — Meta Ads Integration (Phase 4.1.4 + 5.5)

- Connexion Meta Business Manager via OAuth
- API routes `/api/meta/connect`, `/api/meta/campaigns`, `/api/meta/metrics`
- Dashboard ads réel (remplacer mock data)
- Pixel tracking setup guide
- Launch ads automatique

### 3.4 — GHL Integration (Phase 5.5.1)

- API route `/api/integrations/ghl`
- CRM sync, lead management
- Settings page section pour connexion GHL

### 3.5 — Prospection & Setting (Phase 4.2)

- Nouvelle page `/prospection`
- Modules : stratégie acquisition, warm call scripts, outbound workflow
- Sub-pages : `/prospection/strategy`, `/prospection/scripts`, `/prospection/workflow`
- Components pour chaque module de formation
- Intégration avec Academy pour les contenus éducatifs

### 3.6 — Guide 10 premiers jours (Phase 5.5.9)

- Nouvelle page `/launch/guide`
- Checklist interactive jour par jour
- KPI targets + quick wins
- Component `launch-guide.tsx`

---

## Tier 4 — Phase 6 Scale (Différenciateur)

### 4.1 — Dashboard performances temps réel (Phase 6.1)

- Nouvelle page `/analytics`
- Agrégation Meta Ads + Stripe + données internes
- Métriques : spend, CPM, CTR, CPC, leads, CPL, revenue, CPA, ROAS
- Recharts : funnel viz, heatmap, trends
- Component `performance-dashboard.tsx`

### 4.2 — Recommandations optimisation IA (Phase 6.2)

- Section dans `/analytics`
- Analyse IA des performances → recommandations
- Component `optimization-recommendations.tsx`
- API route `/api/ai/optimize-ads`

### 4.3 — A/B Testing funnel (Phase 6.3)

- Nouvelle page `/analytics/ab-testing`
- Framework de test : landing page, VSL, emails, CTAs
- Calcul statistique (confidence intervals)
- Component `ab-test-manager.tsx`

### 4.4 — Gestion créative (Phase 6.5)

- Section dans `/ads`
- Rotation schedule, fatigue detection
- Budget reallocation rules
- Component `creative-manager.tsx`

### 4.5 — Détection sophistication marché (Phase 6.6)

- Widget dans dashboard + `/market`
- Analyse IA du niveau Schwartz actuel
- Trigger de switch funnel
- Component `sophistication-detector.tsx`

### 4.6 — Suivi résultats clients (Phase 6.7)

- Nouvelle page `/analytics/clients`
- Tracking : revenue, leads, calls, conversions par client
- Reports mensuels
- Component `client-results-tracker.tsx`

### 4.7 — Multi-touch attribution (Phase 6.8)

- Section dans `/analytics`
- Modèles : first-touch, last-touch, multi-touch, time-decay
- Visualisation du parcours client
- Component `attribution-model.tsx`

### 4.8 — LTV/CAC Optimization (Phase 6.9)

- Section dans `/analytics`
- Métriques : CAC, LTV, ratio, payback period
- Recommandations IA pour optimiser
- Component `ltv-cac-tracker.tsx`

### 4.9 — Scaling automatique (Phase 6.10)

- Section dans `/ads`
- Rules engine : identifier winners, dupliquer, expand audiences, increase budget
- Component `auto-scaler.tsx`
- Nécessite Meta API intégration

---

## Migrations Supabase nécessaires

```sql
-- Vault documents
CREATE TABLE vault_documents (...)

-- Vault extractions
CREATE TABLE vault_extractions (...)

-- Bleeding-neck pains
-- Reuse market_analyses table with type field

-- Call analyses
CREATE TABLE call_analyses (...)

-- A/B Tests
CREATE TABLE ab_tests (...)

-- Client results
CREATE TABLE client_results (...)

-- Integrations
CREATE TABLE integrations (...)
```

---

## Ordre d'exécution

1. Tier 1 features (1.1 → 1.7) — toutes indépendantes, parallélisables
2. Tier 2 features (2.1 → 2.5)
3. Tier 3 features (3.1 → 3.6)
4. Tier 4 features (4.1 → 4.9)

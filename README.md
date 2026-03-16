# ScalingFlow

Plateforme SaaS tout-en-un propulsée par l'IA pour structurer, lancer et scaler ton business. Interface en français.

## Tech Stack

- **Frontend** : React 19, TypeScript 5.9, Next.js 16 (App Router), Tailwind CSS 4
- **Backend** : Supabase (PostgreSQL, Auth, RLS, Realtime)
- **IA** : Anthropic Claude SDK + OpenRouter fallback (47 templates de prompts, 39 API routes IA, streaming)
- **Scraping** : Apify (10+ actors — Meta Ad Library, Instagram, TikTok, Google Trends, YouTube, etc.)
- **Paiements** : Stripe (checkout, portail, webhooks, gating par plan, Connect)
- **Emails** : Resend
- **Messaging** : Unipile (multi-canal)
- **State** : Zustand (4 stores)
- **Charts** : Recharts
- **UI** : shadcn/ui (18 composants), Lucide icons
- **PWA** : @ducanh2912/next-pwa + Web Push (VAPID)
- **Deploy** : Vercel

## Fonctionnalités

### Génération IA (39 endpoints)

- **Marché** : Analyse de marché, concurrents, persona, Schwartz analysis, category OS
- **Offre** : Création complète (positionnement, pricing, garanties, OTO, mécanisme unique, scoring)
- **Funnel** : Pages de vente (landing, VSL, thank you), quiz funnel
- **Publicités** : Hooks, copy, scripts vidéo, DM retargeting, génération d'images, optimisation auto
- **Contenu** : Reels, Stories, YouTube, carrousels, calendrier éditorial, contenu continu
- **Assets** : VSL, emails, SMS, sales letters, pitch decks, lead magnets, case studies
- **Marque** : Noms, direction artistique, brand kit, génération de logo
- **Roadmap** : Roadmap business personnalisée, plan quotidien
- **Sales** : Analyse d'appels (scoring 7D), scripts de setting/closing, objections→contenu
- **Audit** : Business audit, vault analysis, diagnostic public
- **Assistant IA** : Chat multi-agents (strategist, copywriter, ad expert, sales coach)

### Ads Automation

- **Spy** : Scraping concurrentiel via Apify (Meta Ad Library, Instagram, TikTok)
- **Monitor** : Surveillance automatique des performances publicitaires
- **Auto-decisions** : Décisions IA (pause, scale, rotate créatives)
- **Creative Cycle** : Rotation et optimisation automatique des créatives
- **Smart Alerts** : Détection de bottlenecks et alertes intelligentes

### Plateforme

- **Onboarding** multi-étapes avec collecte de profil business
- **Vault** personnel (compétences, ressources, analyse IA)
- **Dashboard** personnalisé (KPIs, pipeline business, progression, recommandations intelligentes)
- **Gamification** (XP, niveaux, badges, streak, leaderboard, daily tasks)
- **Roadmap** interactive (4 phases, milestones, tâches quotidiennes, auto-détection)
- **Academy** (modules vidéo, progression)
- **Communauté** (posts, commentaires, likes)
- **Notifications temps réel** (Supabase Realtime + toast + Web Push)
- **Diagnostic public** (scan de funnel sans inscription, rate limiting par IP)
- **Admin dashboard** (métriques, abonnements, activité — accès restreint par rôle)

### Intégrations

- **Meta Ads** : Sync campagnes, audiences, pixel auto-install
- **GHL (GoHighLevel)** : CRM sync, contacts, pipelines
- **Google Calendar** : Sync événements
- **Instagram** : Optimisation de profil
- **Unipile** : Messaging multi-canal
- **Stripe Connect** : Paiements partenaires
- **Whitelabel** : Multi-tenant avec branding custom

### Monétisation

- 3 plans : Free (5 générations/mois), Pro, Premium
- Stripe Checkout + Billing Portal
- Gating IA avec UpgradeWall (403 → composant upgrade)
- Suivi d'usage via `activity_log`

### Auth & Sécurité

- Supabase Auth (email/password, social auth)
- 3 rôles : `student`, `admin`, `coach`
- Middleware de session avec protection des routes
- Redirection onboarding obligatoire
- Flux mot de passe oublié / réinitialisation
- Landing page publique (`/welcome`)
- RLS sur toutes les tables

## Structure du projet

```
src/
  app/
    (auth)/            # Login, register, forgot-password, reset-password
    (dashboard)/       # Routes protégées (dashboard, offer, market, ads, etc.)
    (marketing)/       # Pages publiques (welcome, diagnostic)
    (onboarding)/      # Wizard d'onboarding
    api/
      ai/              # 39 endpoints de génération IA
      ads/             # Automation publicitaire (monitor, decisions, scale)
      integrations/    # GHL, Google Calendar, Instagram, Meta, Unipile
      stripe/          # Checkout, portal, webhook, usage, connect
      email/           # Envoi d'emails via Resend
      gamification/    # Award XP, recalculate
      vault/           # Upload et resources vault
  components/
    ui/                # 18 composants shadcn/ui
    layout/            # AppShell, Sidebar, Header, Notifications
    dashboard/         # Widgets (stats, pipeline, charts, recommendations)
    ads/               # Ad spy, content spy, campaigns, creatives
    roadmap/           # Milestones, daily tasks, phase tracker
    [module]/          # Composants par feature (offer, content, funnel, etc.)
  hooks/               # useUser, useUsage, useNotifications
  lib/
    ai/
      anthropic.ts     # Client Anthropic
      generate.ts      # generateText, generateJSON, streamText, createStreamingResponse
      prompts/         # 47 templates de prompts spécialisés
    supabase/          # Client browser/server, middleware, admin
    scraping/          # Apify + Firecrawl clients
    stripe/            # Plans, check-usage
    notifications/     # Création de notifications serveur
    gamification/      # Moteur XP (rewards, levels, badges)
  stores/              # Zustand (app, onboarding, ui, achievements)
  types/               # TypeScript definitions
docs/
  specs/               # Spécifications fonctionnelles
  cdc/                 # Cahier des charges et suivi
supabase/
  migrations/          # Schéma PostgreSQL + RLS
```

## Démarrage

```bash
# Installation
npm install

# Variables d'environnement
cp .env.example .env.local
# Remplir les variables (voir section ci-dessous)

# Développement
npm run dev

# Build production
npm run build
npm run start

# Lint
npm run lint
```

## Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# IA
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=

# Scraping
APIFY_TOKEN=

# Messaging
UNIPILE_API_URL=
UNIPILE_ACCESS_TOKEN=

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

## Base de données

Les migrations Supabase sont dans `supabase/migrations/`. Tables principales :

- `profiles` — Profils utilisateurs (rôle, plan, XP, badges, onboarding, vault)
- `market_analyses` — Analyses de marché générées
- `offers` — Offres créées (positionnement, pricing, garanties)
- `funnels` / `funnel_pages` — Funnels de vente et pages
- `ad_creatives` / `ad_campaigns` — Créatives et campagnes publicitaires
- `sales_assets` — Assets marketing (VSL, emails, call analysis, etc.)
- `content_pieces` — Contenus générés (reels, stories, carrousels)
- `brand_identities` — Identités de marque
- `tasks` — Tâches quotidiennes roadmap
- `activity_log` — Journal d'activité (XP, usage IA)
- `notifications` — Notifications temps réel
- `academy_modules` / `academy_videos` — Contenu formation
- `community_posts` / `community_comments` — Communauté
- `organizations` — Multi-tenant et whitelabel

## Thème

Dark mode par défaut. Couleurs principales :

- Accent : `#34D399` (emerald)
- Backgrounds : `#0B0E11`, `#141719`, `#1C1F23`
- Fonts : Inter (sans) + JetBrains Mono (mono)

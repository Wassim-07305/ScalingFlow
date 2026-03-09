# ScalingFlow

Plateforme SaaS tout-en-un propulsee par l'IA pour structurer, lancer et scaler ton business. Interface en francais.

## Tech Stack

- **Frontend** : React 19, TypeScript 5.9, Next.js 16 (App Router), Tailwind CSS 4
- **Backend** : Supabase (PostgreSQL, Auth, RLS, Realtime)
- **IA** : Anthropic Claude SDK (11 templates de prompts, 15 API routes, streaming)
- **Paiements** : Stripe (checkout, portail, webhooks, gating par plan)
- **Emails** : Resend
- **State** : Zustand (3 stores)
- **Charts** : Recharts
- **UI** : shadcn/ui (16 composants), Lucide icons
- **PWA** : @ducanh2912/next-pwa
- **Deploy** : Vercel

## Fonctionnalites

### Generation IA
- Analyse de marche, concurrents, persona
- Creation d'offre complete (positionnement, pricing, garanties, OTO)
- Funnel de vente (landing, VSL, thank you)
- Publicites (hooks, copy, scripts video, DM)
- Contenu (Reels, Stories, YouTube, carrousels, calendrier editorial)
- Assets marketing (VSL, emails, SMS, sales letters, pitch decks, lead magnets)
- Identite de marque (noms, direction artistique, brand kit)
- Roadmap business personnalisee
- Assistant IA multi-agents (strategist, copywriter, ad expert, sales coach...)

### Plateforme
- **Onboarding** multi-etapes avec collecte de profil business
- **Vault** personnel (competences, ressources, analyse IA)
- **Dashboard** personnalise (KPIs, pipeline business, progression, charts)
- **Gamification** (XP, niveaux, badges, streak, leaderboard)
- **Academy** (modules video, progression)
- **Communaute** (posts, commentaires, likes)
- **Notifications temps reel** (Supabase Realtime + toast)
- **Admin dashboard** (metriques, abonnements, activite — acces restreint par role)

### Monetisation
- 3 plans : Free (5 generations/mois), Pro, Premium
- Stripe Checkout + Billing Portal
- Gating IA avec UpgradeWall (403 → composant upgrade)
- Suivi d'usage via `activity_log`

### Auth & Securite
- Supabase Auth (email/password)
- Middleware de session avec protection des routes
- Redirection onboarding obligatoire
- Flux mot de passe oublie / reinitialisation
- Landing page publique (`/welcome`)
- RLS sur toutes les tables

## Structure du projet

```
src/
  app/
    (auth)/          # Login, register, forgot-password, reset-password
    (dashboard)/     # Routes protegees (dashboard, offer, market, ads, etc.)
    (marketing)/     # Landing page publique (/welcome)
    (onboarding)/    # Wizard d'onboarding
    api/
      ai/            # 15 endpoints de generation IA
      stripe/        # Checkout, portal, webhook, usage
      email/         # Envoi d'emails via Resend
      vault/         # Upload et resources vault
  components/
    ui/              # 16 composants shadcn/ui
    layout/          # AppShell, Sidebar, Header, Notifications
    dashboard/       # Widgets dashboard (stats, pipeline, charts, etc.)
    [module]/        # Composants par feature (offer, ads, content, etc.)
  hooks/             # useUser, useUsage, useNotifications
  lib/
    ai/              # Client Anthropic, generate utils, 30+ prompt templates
    supabase/        # Client browser/server, middleware
    stripe/          # Plans, check-usage
    notifications/   # Creation de notifications serveur
    gamification/    # Moteur XP (rewards, levels, badges)
  stores/            # Zustand (UI, onboarding, app)
  types/             # TypeScript definitions (database, AI)
```

## Demarrage

```bash
# Installation
npm install

# Variables d'environnement
cp .env.example .env.local
# Remplir les variables (voir section ci-dessous)

# Developpement
npm run dev

# Build production
npm run build
npm run start

# Lint
npm run lint
```

## Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## Base de donnees

Les migrations Supabase sont dans `supabase/migrations/`. Tables principales :

- `profiles` — Profils utilisateurs (role, plan, XP, onboarding, vault)
- `market_analyses` — Analyses de marche generees
- `offers` — Offres creees
- `funnels` — Funnels de vente
- `ad_creatives` / `ad_campaigns` — Publicites
- `sales_assets` — Assets marketing (VSL, emails, etc.)
- `content_pieces` — Contenus generes
- `brand_identities` — Identites de marque
- `activity_log` — Journal d'activite (XP, usage IA)
- `notifications` — Notifications temps reel
- `academy_modules` / `academy_videos` — Contenu formation
- `community_posts` / `community_comments` — Communaute

## Theme

Dark mode par defaut. Couleurs principales :

- Accent : `#34D399` (emerald)
- Backgrounds : `#0B0E11`, `#141719`, `#1C1F23`
- Fonts : Inter (sans) + JetBrains Mono (mono)

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ScalingFlow is an AI-powered SaaS platform for business scaling (French-language UI). Built with Next.js 16 App Router + Supabase + TypeScript strict mode. It uses Claude AI (Haiku/Sonnet routing) to generate marketing assets across 35+ API endpoints. Features include multi-step onboarding, 8 specialized AI agents, Stripe payments with 5 plan tiers, gamification, community, academy, Meta Ads integration, CRM pipeline, whitelabel, and affiliate program.

## Commands

```bash
npm run dev              # Start dev server (webpack mode for PWA compat)
npm run build            # Production build
npm run lint             # ESLint
npm run test             # Vitest (unit + integration, 169 tests)
npm run test:unit        # Unit tests only (tests/unit/)
npm run test:integration # Integration tests only (tests/integration/)
npm run test:e2e         # Playwright E2E tests
npm run test:coverage    # Vitest with coverage
```

## Architecture

### Tech Stack

React 19 + TypeScript 5.9 + Next.js 16 (App Router) + Tailwind CSS 4 + Supabase (PostgreSQL + Auth + RLS). State: Zustand (4 stores). AI: Anthropic Claude SDK with Haiku/Sonnet routing. Payments: Stripe. Email: Resend. Charts: Recharts. PWA: @ducanh2912/next-pwa. Deployed on Vercel. Node >=22.

### Key Directories

```
src/
  app/
    (auth)/              # Public: login, register, forgot-password
    (dashboard)/         # Protected: 32 feature areas (market, offer, funnel, ads, content, etc.)
    (marketing)/         # Public: welcome/pricing page
    api/                 # 124 route handlers
      ai/                # 39 AI generation routes
      stripe/            # Checkout, webhook, portal, usage
      integrations/      # Meta, GHL, Google Calendar, Unipile, whitelabel
      admin/             # Settings, ai-costs monitoring
      affiliates/        # Register, track, payout
  components/
    ui/                  # 18 shadcn/ui primitives (Radix-based)
    [feature]/           # Feature-specific components (30+ directories)
  lib/
    ai/                  # generate.ts, model-router.ts, agents/, prompts/ (51 templates)
    stripe/              # plans.ts, check-usage.ts, feature-access.ts
    supabase/            # client.ts, server.ts, admin.ts, middleware.ts
    gamification/        # xp-engine.ts, badges.ts, feature-gates.ts
    admin/               # cost-config.ts
  hooks/                 # 10 custom hooks (use-user, use-usage, etc.)
  stores/                # 4 Zustand stores
  types/                 # database.ts, ai.ts
```

### AI Generation Pipeline

Every AI route follows this pattern:
1. Authenticate user via `createClient()` → `supabase.auth.getUser()`
2. Rate limit via `rateLimit(userId, routeName)`
3. Check quota via `checkAIUsage(userId)` — enforces monthly plan limits
4. Select model via `getModelForGeneration(type)` — Haiku for light tasks, Sonnet for complex
5. Build prompt from templates in `lib/ai/prompts/`
6. Call `generateJSON()`, `generateText()`, or `streamText()` with `model` param
7. Save result to Supabase
8. Log usage via `incrementAIUsage()` (only on success)
9. Award XP via `awardXP()` (non-blocking)

AI module in `lib/ai/generate.ts` tries Anthropic direct API first, falls back to OpenRouter.

### Plan & Quota System

3 plans defined in `lib/stripe/plans.ts` (free hidden + 2 paid):
- **Free** (0€, hidden): 10 gen/month, general agent only — fallback for non-subscribed users
- **Scale** (149€): 500 gen/month, all features (Meta Ads, CRM, CRONs, whitelabel, API, scoring, attribution)
- **Agency** (297€): 1500 gen/month, everything + 5 sub-accounts, coaching, priority queue, Slack support

Usage tracked in `ai_generations` table. Feature gating via `hasFeatureAccess(userId, feature)` in `lib/stripe/feature-access.ts`. Legacy plans map via `resolvePlanId()`: premium→scale, starter→free, pro→free. Old Stripe price IDs kept in `legacyPriceIds` for webhook backward compat.

### Authentication & Authorization

- Supabase Auth with cookie-based sessions
- Middleware in `src/middleware.ts` refreshes sessions, redirects unauthenticated users
- All tables use RLS (Row-Level Security) — **always include `user_id` in client-side inserts**
- Admin routes check `profile.role === 'admin'`
- API routes use `createClient()` from `lib/supabase/server.ts` (server-side, cookie-based)
- Direct DB calls from client use `createClient()` from `lib/supabase/client.ts`
- Admin operations use `createAdminClient()` from `lib/supabase/admin.ts` (service role)

### Stripe Integration

- Webhook at `api/stripe/webhook/route.ts` handles: checkout.session.completed, subscription updates/deletions, invoice events
- Webhook uses `@supabase/supabase-js` createClient directly (not the server.ts wrapper) with service role
- `getPlanByPriceId()` searches both monthly and annual price IDs
- Affiliate commission processing runs inside the webhook

## Conventions

- All UI text in French
- Path alias: `@/*` → `./src/*`
- Theme: dark mode — emerald accent (#34D399), backgrounds (#0B0E11, #141719, #1C1F23)
- `cn()` helper from `lib/utils/cn.ts` for conditional Tailwind classes
- Icons: `lucide-react`
- Toast: Sonner
- Fonts: Inter (sans) + JetBrains Mono (mono)
- Client-side dominant: mutations via API routes or direct Supabase calls (no Server Actions)
- All AI/Stripe/Resend calls go through API routes (never client-side)

## Testing

Tests in `tests/` with helpers in `tests/helpers/`:
- `supabase-mock.ts` — Chainable Supabase client mock with configurable returns
- `supabase-spy-mock.ts` — Records all DB calls for argument verification
- `auth.ts` — `mockAuthenticatedUser()` / `mockUnauthenticatedUser()`
- `factories.ts` — Data factories for Profile, Offer, MarketAnalysis, etc.
- `api-test-utils.ts` — `createMockRequest()` for route testing
- `rls-safety.test.ts` — Static scan that catches missing `user_id` in client-side inserts

Use `vi.hoisted()` for mock variables referenced inside `vi.mock()` factories (Vitest hoisting).

## Database

56 migrations in `supabase/migrations/`. Key tables:
- `profiles` — Users with subscription, XP, badges, onboarding state
- `ai_generations` — Every AI call logged (model, tokens, cost, is_cron)
- `market_analyses`, `offers`, `funnels`, `sales_assets` — Generated content
- `ad_creatives`, `ad_campaigns`, `content_pieces` — Marketing assets
- `community_posts`, `community_comments` — Social features
- `pipeline_leads`, `clients` — CRM
- `affiliates`, `commissions`, `referrals` — Affiliate program
- `rate_limits` — Persistent rate limiting (fail-closed)
- `monthly_reports` — Archived admin AI cost reports

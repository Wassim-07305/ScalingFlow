# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ScalingFlow is an AI-powered SaaS platform for business scaling (French-language UI). Built with Next.js App Router and Supabase, it leverages Claude AI to generate marketing assets: market analysis, ad copy, sales funnels, content ideas, offers, and VSL scripts. Features: multi-step onboarding, AI content generation with streaming, learning academy, community, gamification (leaderboard, progress tracking), Stripe payments, and email notifications via Resend.

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — ESLint across the project

## Architecture

### Tech Stack
React 19 + TypeScript 5.9 + Next.js 16 (App Router) + Tailwind CSS 4 + Supabase (PostgreSQL + Auth + RLS). State: Zustand (2 stores). AI: Anthropic Claude SDK (6 endpoints, 11 prompt templates). Payments: Stripe. Email: Resend. Charts: Recharts. PWA: @ducanh2912/next-pwa. Deployed on Vercel.

### Directory Layout
```
src/
  app/
    layout.tsx             # Root layout (fonts, providers, QueryClientProvider)
    page.tsx               # Landing/redirect
    (auth)/                # Public auth routes
      login/, register/
    (dashboard)/           # Protected routes
      layout.tsx           # Dashboard layout with sidebar
      page.tsx             # Main dashboard
      academy/             # Learning content
      admin/               # Admin overview
      ads/                 # Ad generation (analytics, campaigns, creatives)
      assets/              # Marketing asset generation
      community/           # Community feed
      content/             # Content idea generation
      funnel/              # Sales funnel builder
      leaderboard/         # Gamification rankings
      offer/               # Offer packaging tool
      onboarding/          # Multi-step onboarding wizard
      progress/            # Progress tracking
      roadmap/             # Business roadmap
      sales/               # Sales tools
      settings/            # User settings
    api/
      ai/
        analyze-market/route.ts    # Market analysis (streaming)
        generate-ads/route.ts      # Ad copy generation
        generate-assets/route.ts   # Marketing asset creation
        generate-content/route.ts  # Content idea generation
        generate-funnel/route.ts   # Sales funnel copy
        generate-offer/route.ts    # Complete offer packaging
  components/
    ui/                    # 16 shadcn/ui components
    academy/, ads/, assets/, community/, content/, dashboard/,
    funnel/, gamification/, layout/, offer/, onboarding/, shared/
    providers.tsx          # QueryClientProvider wrapper
  hooks/
    use-user.ts            # Client-side auth state hook
  lib/
    ai/
      anthropic.ts         # Anthropic client initialization
      generate.ts          # generateText(), generateJSON(), streamText(), createStreamingResponse()
      prompts/             # 11 prompt template files
        market-analysis.ts, offer-creation.ts, funnel-copy.ts, vsl-script.ts,
        email-sequence.ts, sms-sequence.ts, ad-copy.ts, ad-hooks.ts,
        content-ideas.ts, sales-script.ts, case-study.ts
    supabase/
      client.ts            # Browser Supabase client
      server.ts            # Server Supabase client
      middleware.ts         # Session refresh
    utils/                 # cn(), color constants
  stores/
    app-store.ts           # Sidebar collapsed/mobile states
    onboarding-store.ts    # Multi-step onboarding data (skills, experience, revenue, industries, objectives, budget)
  types/                   # TypeScript definitions
  middleware.ts            # Next.js middleware entry
```

### Key Patterns

**AI generation pipeline**: 6 API routes in `app/api/ai/`. Each route: authenticate user → build prompt from templates → call Claude API → stream response or return JSON. AI module in `lib/ai/` provides `generateText()` (basic), `generateJSON()` (structured output), `streamText()` (real-time), and `createStreamingResponse()` (ReadableStream conversion).

**Prompt templates**: 11 specialized templates in `lib/ai/prompts/`. Each exports a function that builds a system prompt with user context (skills, market data, business profile). Templates cover: market analysis, offer creation (positioning, pricing, guarantees, risk reversal, OTO), funnel copy, VSL scripts, email/SMS sequences, ad copy, hooks, content ideas, sales scripts, case studies.

**Onboarding flow**: Multi-step wizard managed by `useOnboardingStore` (Zustand). Collects: skills, experience level, revenue targets, target industries, business objectives, budget range. Data saved to Supabase profile + used as AI context.

**Streaming responses**: AI endpoints return `ReadableStream` for real-time text display. Client components consume streams for progressive rendering of generated content.

**Client-side dominant**: 64 files with `"use client"`. No Server Actions — mutations go through API routes or direct Supabase calls.

### Path Alias
`@/*` maps to `./src/*` (configured in `tsconfig.json`). Always use `@/` imports.

### Environment Variables
Defined in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-side only)
- `ANTHROPIC_API_KEY` — Claude AI API key (server-side only)
- `STRIPE_SECRET_KEY` — Stripe secret key (server-side only)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe public key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `RESEND_API_KEY` — Resend email API key (server-side only)
- `META_ACCESS_TOKEN` — Meta/Facebook API token
- `META_AD_ACCOUNT_ID` — Meta Ads account ID
- `REPLICATE_API_TOKEN` — Replicate AI token
- `UNIPILE_API_URL` — Unipile API base URL (e.g., https://api4.unipile.com:13443)
- `UNIPILE_ACCESS_TOKEN` — Unipile API access token (server-side only)
- `NEXT_PUBLIC_APP_URL` — Public app URL

### Supabase
- Browser client in `lib/supabase/client.ts`, server client in `lib/supabase/server.ts`
- Session management via middleware
- Single migration file (19KB)
- Tables: profiles, market_analyses, offers, and related content tables

## Conventions

- All UI text is in French
- TypeScript strict mode
- Toast notifications via Sonner
- Icons from `lucide-react`
- Fonts: Inter (sans) + JetBrains Mono (mono) via Google Fonts
- Theme: dark mode — emerald accent (#34D399), dark backgrounds (#0B0E11, #141719, #1C1F23)
- `cn()` helper for conditional Tailwind classes
- shadcn/ui for all UI primitives (16 components)
- PWA via @ducanh2912/next-pwa
- Never expose API keys client-side — all AI/Stripe/Resend calls go through API routes

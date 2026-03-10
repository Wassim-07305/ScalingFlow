# CONTEXT.md — ScalingFlow

## Identité du projet

- **Client :** Timothée Fortin
- **Deadline :** 19 mars 2026
- **Acompte :** 2 000 €
- **Statut :** 99% CDC réalisé
- **GitHub :** https://github.com/Wassim-07305/ScalingFlow
- **Vercel (prod) :** https://scalingflow-ahmanewassim6-2668s-projects.vercel.app

## Stack technique

- Next.js 16 (App Router) + React 19 + TypeScript 5.9 + Tailwind CSS 4
- Supabase (PostgreSQL + Auth + RLS)
- Zustand (état UI) + TanStack React Query (état serveur)
- Claude AI (Anthropic SDK) — génération de contenu IA en streaming
- Stripe (paiements) + Resend (emails)
- Recharts, @ducanh2912/next-pwa, déployé sur Vercel

## Supabase

- **Project ref :** mgagpfexswovfzydlqgm
- **Password :** gogvag-5favqu-haxXyf
- **Connection string :**
  ```
  postgresql://postgres.mgagpfexswovfzydlqgm:gogvag-5favqu-haxXyf@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
  ```

## Comptes de test

| Rôle  | Email                    | Mot de passe |
|-------|--------------------------|--------------|
| Admin | admin@scalingflow.com    | Test1234x    |

## Commandes utiles

```bash
npm run dev     # Démarrer le serveur Next.js
npm run build   # Build de production
npm run lint    # ESLint
```

## Équipe

- **Wassim** — dev principal
- **Gilles Hayibor** (GitHub: ghayibor) — dev délégué, travaille sur branches dev

## Instructions Claude Code

- Modèle : `claude-opus-4-5`
- Toujours utiliser : `--permission-mode bypassPermissions`
- Lire ce CONTEXT.md en premier, puis `git log`, puis `npm run build`
- Corriger TOUTES les erreurs TypeScript/ESLint
- Pusher sur GitHub après chaque lot de changements
- Utiliser les vraies données Supabase (pas de mocks)
- Appliquer les migrations si des tables manquent
- Ne jamais casser les fonctionnalités existantes

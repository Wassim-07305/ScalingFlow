import Link from "next/link";
import Image from "next/image";
import { PLANS } from "@/lib/stripe/plans";
import {
  ArrowRight,
  Check,
  Sparkles,
  Target,
  Zap,
  BarChart3,
  FileText,
  Megaphone,
  Filter,
  Bot,
  Shield,
  Crown,
  Star,
} from "lucide-react";

import type { Metadata } from "next";

const title = "ScalingFlow — Scale ton business avec l'IA";
const description =
  "La plateforme tout-en-un pour structurer, lancer et scaler ton business. Offres, funnels, ads, contenu — tout généré par l'IA en quelques clics.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "/welcome",
    siteName: "ScalingFlow",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/icons/icon-1024.png",
        width: 1024,
        height: 1024,
        alt: "ScalingFlow — Scale ton business avec l'IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/icons/icon-1024.png"],
  },
  alternates: {
    canonical: "/welcome",
  },
  keywords: [
    "ScalingFlow",
    "IA",
    "business",
    "scaling",
    "offre",
    "funnel",
    "ads",
    "marketing",
    "SaaS",
    "intelligence artificielle",
  ],
};

const FEATURES = [
  {
    icon: Target,
    title: "Analyse de marché",
    description:
      "Identifie ton marché idéal, crée ton avatar client et analyse tes concurrents avec l'IA.",
  },
  {
    icon: Sparkles,
    title: "Offre irrésistible",
    description:
      "Génère une offre complète : positionnement, pricing, garanties, mécanisme unique.",
  },
  {
    icon: Filter,
    title: "Funnel de vente",
    description:
      "Construis ton funnel de A à Z : landing page, page de vente, upsells, emails.",
  },
  {
    icon: Megaphone,
    title: "Ads & Créatives",
    description:
      "Crée des publicités qui convertissent : hooks, copy, scripts vidéo, DM automatisés.",
  },
  {
    icon: FileText,
    title: "Assets marketing",
    description:
      "VSL, emails, SMS, sales letters, pitch decks — tout ce qu'il te faut pour closer.",
  },
  {
    icon: Bot,
    title: "Assistant IA",
    description:
      "Un coach IA disponible 24/7 qui connaît ton business et t'accompagne à chaque étape.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Remplis ton Vault",
    description:
      "Décris ton expertise, tes compétences et tes objectifs en 5 minutes.",
  },
  {
    step: "02",
    title: "L'IA analyse ton marché",
    description:
      "ScalingFlow identifie tes opportunités, ton avatar client et tes concurrents.",
  },
  {
    step: "03",
    title: "Génère tes assets",
    description:
      "Offre, funnel, ads, contenu — tout est créé automatiquement, prêt à déployer.",
  },
];

const TESTIMONIALS = [
  {
    name: "Thomas D.",
    role: "Coach business",
    text: "En 2 heures j'avais mon offre, mon funnel et mes 5 premières pubs. Ce qui m'aurait pris 3 semaines.",
    stars: 5,
  },
  {
    name: "Sarah M.",
    role: "Consultante marketing",
    text: "La qualité des textes générés est bluffante. Mes clients pensent que j'ai une équipe de copywriters.",
    stars: 5,
  },
  {
    name: "Kevin L.",
    role: "Agence digitale",
    text: "On utilise ScalingFlow pour onboarder nos clients 10x plus vite. Un game-changer pour notre agence.",
    stars: 5,
  },
];

const PLAN_ICONS: Record<string, typeof Zap> = {
  scale: Crown,
  agency: Crown,
};

const PLAN_COLORS: Record<string, { icon: string; check: string }> = {
  scale: { icon: "bg-[rgba(139,92,246,0.12)] text-[#A78BFA]", check: "text-[#A78BFA]" },
  agency: { icon: "bg-amber-500/10 text-amber-400", check: "text-amber-400" },
};

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 border-b border-border-default/50 bg-bg-primary/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-192.png"
              alt="ScalingFlow"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-lg font-bold text-text-primary">
              ScalingFlow
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-all shadow-lg shadow-accent/15 hover:shadow-accent/25"
            >
              Commencer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-accent/8 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-40 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-20 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 pt-28 pb-24 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-medium mb-8 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Infrastructure IA Plug &amp; Play
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-text-primary leading-[1.1] mb-6 tracking-tight">
            Scale ton business
            <br />
            <span className="bg-gradient-to-r from-accent via-emerald-300 to-accent bg-clip-text text-transparent">
              avec l&apos;IA
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            Offre, funnel, ads, contenu, emails — tout ce dont tu as besoin pour
            lancer et scaler, généré par l&apos;IA en quelques clics.{" "}
            <span className="text-text-primary font-medium">
              Commence dès maintenant.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-white font-semibold text-base hover:bg-accent/90 transition-all shadow-[0_0_32px_rgba(52,211,153,0.2)] hover:shadow-[0_0_48px_rgba(52,211,153,0.3)]"
            >
              Commencer maintenant
              <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-border-default text-text-secondary font-medium text-base hover:text-text-primary hover:border-border-hover transition-all"
            >
              Voir les fonctionnalités
            </Link>
          </div>

          <p className="text-xs text-text-muted mt-8">
            Accès immédiat &middot; Annulable à tout moment
          </p>
        </div>
      </section>

      {/* ─── Social proof bar ─── */}
      <section className="border-y border-border-default/50 bg-bg-secondary/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-wrap items-center justify-center gap-8 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            <span>
              <span className="text-text-primary font-semibold">11</span> agents
              IA spécialisés
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            <span>
              <span className="text-text-primary font-semibold">15+</span> types
              d&apos;assets générés
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            <span>
              Résultats en{" "}
              <span className="text-text-primary font-semibold">
                30 secondes
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Tout pour scaler, en un seul endroit
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto text-lg">
            De l&apos;analyse de marché au closing, ScalingFlow génère tous les
            assets dont tu as besoin pour lancer et scaler ton business.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl border border-border-default/50 bg-bg-secondary/30 hover:border-accent/20 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 backdrop-blur-sm"
            >
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/15 group-hover:scale-110 transition-all duration-300">
                <feature.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2 text-lg">
                {feature.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="bg-bg-secondary/30 border-y border-border-default/50">
        <div className="max-w-4xl mx-auto px-4 py-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Comment ça marche
            </h2>
            <p className="text-text-secondary text-lg">
              3 étapes pour passer de zéro à un business structuré.
            </p>
          </div>

          <div className="space-y-12">
            {STEPS.map((step, i) => (
              <div key={i} className="flex gap-6 items-start group">
                <div className="shrink-0 h-14 w-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/15 group-hover:scale-105 transition-all duration-300">
                  <span className="text-base font-bold text-accent">
                    {step.step}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary text-xl mb-2">
                    {step.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed text-lg">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="max-w-6xl mx-auto px-4 py-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Ils scalent avec ScalingFlow
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl border border-border-default/50 bg-bg-secondary/30 hover:border-accent/20 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 backdrop-blur-sm"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, si) => (
                  <Star
                    key={si}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mb-5">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {t.name}
                  </p>
                  <p className="text-xs text-text-muted">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section
        id="pricing"
        className="bg-bg-secondary/30 border-y border-border-default/50"
      >
        <div className="max-w-5xl mx-auto px-4 py-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Tarifs simples, pas de surprise
            </h2>
            <p className="text-text-secondary text-lg">
              Deux formules, tout inclus. Choisis celle qui te correspond.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            {PLANS.filter((p) => p.price > 0).map((plan) => {
              const Icon = PLAN_ICONS[plan.id] || Crown;
              const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.scale;
              return (
                <div
                  key={plan.id}
                  className={`relative p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                    plan.popular
                      ? "border-accent/50 shadow-[0_0_40px_rgba(52,211,153,0.1)] hover:shadow-accent/15"
                      : "border-border-default hover:border-border-hover"
                  } bg-bg-primary`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-accent text-white text-[10px] font-semibold shadow-lg shadow-accent/25">
                        Populaire
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center ${colors.icon}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-text-primary">
                      {plan.name}
                    </h3>
                  </div>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold text-text-primary">
                      {plan.price}€
                    </span>
                    {plan.price > 0 && (
                      <span className="text-xs text-text-muted">/mois</span>
                    )}
                  </div>

                  {plan.annualPrice > 0 && plan.annualPrice < plan.price && (
                    <p className="text-[10px] text-accent mb-3">
                      ou {plan.annualPrice}€/mois en annuel
                    </p>
                  )}
                  {plan.price === 0 && <div className="mb-3" />}

                  <p className="text-[11px] text-text-muted mb-4 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="space-y-2 mb-5">
                    {plan.features.map((f) => (
                      <div
                        key={f}
                        className="flex items-start gap-2 text-xs text-text-secondary"
                      >
                        <Check
                          className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${colors.check}`}
                        />
                        <span className="leading-relaxed">{f}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/register"
                    className={`block w-full text-center py-2.5 rounded-xl text-sm font-medium transition-all ${
                      plan.popular
                        ? "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/15"
                        : "border border-border-default text-text-secondary hover:text-text-primary hover:border-border-hover"
                    }`}
                  >
                    Commencer
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="max-w-3xl mx-auto px-4 py-28">
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-4">
          Questions fréquentes
        </h2>
        <p className="text-text-secondary text-center mb-12 text-lg">
          Tout ce que tu dois savoir avant de commencer.
        </p>
        <div className="space-y-3">
          {[
            {
              q: "Combien de temps faut-il pour générer une offre complète ?",
              a: "Moins de 2 minutes. L'IA analyse ton marché, tes compétences et ton positionnement pour générer une offre structurée avec pricing, garantie et arguments de vente.",
            },
            {
              q: "Puis-je modifier les textes générés par l'IA ?",
              a: "Absolument. Tous les textes générés (offres, funnels, ads, emails) sont entièrement éditables. L'IA te donne une base solide que tu peux affiner selon tes besoins.",
            },
            {
              q: "Puis-je tester avant de m'engager ?",
              a: "Tu peux créer ton compte et explorer la plateforme. L'abonnement Scale ou Agency débloque toutes les générations IA et les fonctionnalités avancées. Annulable à tout moment.",
            },
            {
              q: "Quels types de contenu l'IA peut-elle générer ?",
              a: "ScalingFlow génère : analyses de marché, offres complètes, pages de funnel, créatives publicitaires, scripts de vente, VSL, séquences email/SMS, posts reels, scripts YouTube, et plus encore.",
            },
            {
              q: "Mes données sont-elles sécurisées ?",
              a: "Oui. Toutes les données sont chiffrées et stockées sur Supabase (infrastructure AWS). Les paiements sont sécurisés par Stripe. Nous ne partageons jamais tes données avec des tiers.",
            },
            {
              q: "Puis-je annuler mon abonnement à tout moment ?",
              a: "Oui, sans engagement. Tu peux annuler ton abonnement depuis les paramètres de ton compte. Tu conserves l'accès jusqu'à la fin de la période de facturation en cours.",
            },
          ].map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-border-default/60 bg-bg-secondary/50 transition-all duration-300 open:bg-bg-secondary open:border-accent/20 open:shadow-lg open:shadow-accent/5 hover:border-border-hover"
            >
              <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-sm font-medium text-text-primary list-none [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="ml-4 shrink-0 text-text-muted transition-transform duration-300 group-open:rotate-45 text-lg">
                  +
                </span>
              </summary>
              <div className="px-6 pb-5 text-sm text-text-secondary leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-accent/[0.03] to-bg-primary pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 py-28 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Prêt à scaler ?
          </h2>
          <p className="text-text-secondary text-lg mb-10 max-w-lg mx-auto">
            Rejoins ScalingFlow et lance ton business structuré par l&apos;IA en
            moins de 30 minutes.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-accent text-white font-semibold text-lg hover:bg-accent/90 transition-all shadow-[0_0_40px_rgba(52,211,153,0.2)] hover:shadow-[0_0_60px_rgba(52,211,153,0.3)]"
          >
            Commencer maintenant
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border-default/50">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/icons/icon-192.png"
              alt="ScalingFlow"
              width={24}
              height={24}
              className="rounded-md"
            />
            <span className="text-sm font-medium text-text-secondary">
              ScalingFlow
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <Link
              href="/login"
              className="hover:text-text-secondary transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="hover:text-text-secondary transition-colors"
            >
              Inscription
            </Link>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Paiements sécurisés via Stripe
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

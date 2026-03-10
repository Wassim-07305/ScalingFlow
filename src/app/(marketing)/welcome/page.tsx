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
} from "lucide-react";

import type { Metadata } from "next";

const title = "ScalingFlow — Scale ton business avec l'IA";
const description =
  "La plateforme tout-en-un pour structurer, lancer et scaler ton business. Offres, funnels, ads, contenu — tout genere par l'IA en quelques clics.";

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
    title: "Analyse de marche",
    description: "Identifie ton marche ideal, cree ton avatar client et analyse tes concurrents avec l'IA.",
  },
  {
    icon: Sparkles,
    title: "Offre irresistible",
    description: "Genere une offre complete : positionnement, pricing, garanties, mecanisme unique.",
  },
  {
    icon: Filter,
    title: "Funnel de vente",
    description: "Construis ton funnel de A a Z : landing page, page de vente, upsells, emails.",
  },
  {
    icon: Megaphone,
    title: "Ads & Creatives",
    description: "Cree des publicites qui convertissent : hooks, copy, scripts video, DM automatises.",
  },
  {
    icon: FileText,
    title: "Assets marketing",
    description: "VSL, emails, SMS, sales letters, pitch decks — tout ce qu'il te faut pour closer.",
  },
  {
    icon: Bot,
    title: "Assistant IA",
    description: "Un coach IA disponible 24/7 qui connait ton business et t'accompagne a chaque etape.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Remplis ton Vault",
    description: "Decris ton expertise, tes competences et tes objectifs en 5 minutes.",
  },
  {
    step: "02",
    title: "L'IA analyse ton marche",
    description: "ScalingFlow identifie tes opportunites, ton avatar client et tes concurrents.",
  },
  {
    step: "03",
    title: "Genere tes assets",
    description: "Offre, funnel, ads, contenu — tout est cree automatiquement, pret a deployer.",
  },
];

const TESTIMONIALS = [
  {
    name: "Thomas D.",
    role: "Coach business",
    text: "En 2 heures j'avais mon offre, mon funnel et mes 5 premieres pubs. Ce qui m'aurait pris 3 semaines.",
  },
  {
    name: "Sarah M.",
    role: "Consultante marketing",
    text: "La qualite des textes generes est bluffante. Mes clients pensent que j'ai une equipe de copywriters.",
  },
  {
    name: "Kevin L.",
    role: "Agence digitale",
    text: "On utilise ScalingFlow pour onboarder nos clients 10x plus vite. Un game-changer pour notre agence.",
  },
];

const PLAN_ICONS: Record<string, typeof Zap> = {
  free: Zap,
  pro: Sparkles,
  premium: Crown,
};

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 border-b border-border-default/50 bg-bg-primary/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/icons/icon-192.png" alt="ScalingFlow" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-bold text-text-primary">ScalingFlow</span>
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Commencer gratuitement
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 pt-24 pb-20 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-medium mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            Infrastructure IA Plug &amp; Play
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight mb-6">
            Scale ton business
            <br />
            <span className="text-accent">avec l&apos;IA</span>
          </h1>

          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Offre, funnel, ads, contenu, emails — tout ce dont tu as besoin pour
            lancer et scaler, genere par l&apos;IA en quelques clics.{" "}
            <span className="text-text-primary font-medium">Gratuit pour commencer.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-semibold text-base hover:bg-accent/90 transition-all shadow-[0_0_24px_rgba(52,211,153,0.15)]"
            >
              Commencer gratuitement
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border-default text-text-secondary font-medium text-base hover:text-text-primary hover:border-border-hover transition-all"
            >
              Voir les fonctionnalites
            </Link>
          </div>

          <p className="text-xs text-text-muted mt-6">
            5 generations IA gratuites &middot; Pas de carte bancaire requise
          </p>
        </div>
      </section>

      {/* ─── Social proof bar ─── */}
      <section className="border-y border-border-default/50 bg-bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-wrap items-center justify-center gap-8 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            <span><span className="text-text-primary font-semibold">11</span> agents IA specialises</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            <span><span className="text-text-primary font-semibold">15+</span> types d&apos;assets generes</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            <span>Resultats en <span className="text-text-primary font-semibold">30 secondes</span></span>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Tout pour scaler, en un seul endroit
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            De l&apos;analyse de marche au closing, ScalingFlow genere tous les assets
            dont tu as besoin pour lancer et scaler ton business.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl border border-border-default bg-bg-secondary/30 hover:border-accent/20 transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/15 transition-colors">
                <feature.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="bg-bg-secondary/30 border-y border-border-default/50">
        <div className="max-w-4xl mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Comment ca marche
            </h2>
            <p className="text-text-secondary">
              3 etapes pour passer de zero a un business structure.
            </p>
          </div>

          <div className="space-y-12">
            {STEPS.map((step, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="shrink-0 h-12 w-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-accent">{step.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary text-lg mb-1">{step.title}</h3>
                  <p className="text-text-secondary">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Ils scalent avec ScalingFlow
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-border-default bg-bg-secondary/30"
            >
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                &ldquo;{t.text}&rdquo;
              </p>
              <div>
                <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                <p className="text-xs text-text-muted">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="bg-bg-secondary/30 border-y border-border-default/50">
        <div className="max-w-5xl mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Tarifs simples, pas de surprise
            </h2>
            <p className="text-text-secondary">
              Commence gratuitement, upgrade quand tu es pret.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => {
              const Icon = PLAN_ICONS[plan.id] || Zap;
              return (
                <div
                  key={plan.id}
                  className={`relative p-6 rounded-2xl border ${
                    plan.popular
                      ? "border-accent/50 shadow-[0_0_32px_rgba(52,211,153,0.08)]"
                      : "border-border-default"
                  } bg-bg-primary`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-accent text-white text-xs font-semibold">
                        Le plus populaire
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        plan.id === "free"
                          ? "bg-bg-tertiary text-text-secondary"
                          : plan.id === "pro"
                          ? "bg-accent/10 text-accent"
                          : "bg-[rgba(139,92,246,0.12)] text-[#A78BFA]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-text-primary">{plan.name}</h3>
                  </div>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-text-primary">{plan.price}</span>
                    <span className="text-sm text-text-muted">
                      {plan.price === 0 ? "EUR" : "EUR/mois"}
                    </span>
                  </div>

                  <p className="text-xs text-text-muted mb-4">{plan.description}</p>

                  <div className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                        <Check
                          className={`h-4 w-4 mt-0.5 shrink-0 ${
                            plan.id === "premium" ? "text-[#A78BFA]" : "text-accent"
                          }`}
                        />
                        {f}
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/register"
                    className={`block w-full text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      plan.popular
                        ? "bg-accent text-white hover:bg-accent/90"
                        : "border border-border-default text-text-secondary hover:text-text-primary hover:border-border-hover"
                    }`}
                  >
                    {plan.price === 0 ? "Commencer gratuitement" : "Commencer"}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="max-w-3xl mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold text-text-primary text-center mb-4">
          Questions frequentes
        </h2>
        <p className="text-text-secondary text-center mb-12">
          Tout ce que tu dois savoir avant de commencer.
        </p>
        <div className="space-y-3">
          {[
            {
              q: "Combien de temps faut-il pour generer une offre complete ?",
              a: "Moins de 2 minutes. L'IA analyse ton marche, tes competences et ton positionnement pour generer une offre structuree avec pricing, garantie et arguments de vente.",
            },
            {
              q: "Puis-je modifier les textes generes par l'IA ?",
              a: "Absolument. Tous les textes generes (offres, funnels, ads, emails) sont entierement editables. L'IA te donne une base solide que tu peux affiner selon tes besoins.",
            },
            {
              q: "Existe-t-il une periode d'essai gratuite ?",
              a: "Oui, le plan Free te permet de tester la plateforme avec 5 generations IA par mois. Tu peux upgrader a tout moment vers Pro ou Premium pour debloquer toutes les fonctionnalites.",
            },
            {
              q: "Quels types de contenu l'IA peut-elle generer ?",
              a: "ScalingFlow genere : analyses de marche, offres completes, pages de funnel, creatives publicitaires, scripts de vente, VSL, sequences email/SMS, posts reels, scripts YouTube, et plus encore.",
            },
            {
              q: "Mes donnees sont-elles securisees ?",
              a: "Oui. Toutes les donnees sont chiffrees et stockees sur Supabase (infrastructure AWS). Les paiements sont securises par Stripe. Nous ne partageons jamais tes donnees avec des tiers.",
            },
            {
              q: "Puis-je annuler mon abonnement a tout moment ?",
              a: "Oui, sans engagement. Tu peux annuler ton abonnement depuis les parametres de ton compte. Tu conserves l'acces jusqu'a la fin de la periode de facturation en cours.",
            },
          ].map((faq) => (
            <details
              key={faq.q}
              className="group rounded-xl border border-border-default/60 bg-bg-secondary/50 transition-all open:bg-bg-secondary"
            >
              <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-text-primary list-none [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="ml-4 shrink-0 text-text-muted transition-transform group-open:rotate-45 text-lg">+</span>
              </summary>
              <div className="px-6 pb-4 text-sm text-text-secondary leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold text-text-primary mb-4">
          Pret a scaler ?
        </h2>
        <p className="text-text-secondary mb-8 max-w-lg mx-auto">
          Rejoins ScalingFlow et lance ton business structure par l&apos;IA en moins de 30 minutes.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-white font-semibold text-lg hover:bg-accent/90 transition-all shadow-[0_0_32px_rgba(52,211,153,0.15)]"
        >
          Creer mon compte gratuitement
          <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border-default/50">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/icons/icon-192.png" alt="ScalingFlow" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-medium text-text-secondary">ScalingFlow</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <Link href="/login" className="hover:text-text-secondary transition-colors">Connexion</Link>
            <Link href="/register" className="hover:text-text-secondary transition-colors">Inscription</Link>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Paiements securises via Stripe
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, type ReactNode } from "react";
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
  Clock,
  ChevronDown,
  Quote,
  Star,
  TrendingUp,
  Menu,
  X,
  Rocket,
  Layers,
  LineChart,
  Flame,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Intersection Observer hook                                         */
/* ------------------------------------------------------------------ */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

/* ------------------------------------------------------------------ */
/*  FadeIn wrapper                                                     */
/* ------------------------------------------------------------------ */

function FadeIn({
  children,
  className = "",
  delay = 0,
  isInView,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  isInView: boolean;
}) {
  return (
    <div
      className={`transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */

function AnimatedCounter({
  target,
  suffix,
  isInView,
}: {
  target: number;
  suffix: string;
  isInView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let frame: number;
    const duration = 2000;
    const start = performance.now();

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isInView, target]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard Mockup                                                   */
/* ------------------------------------------------------------------ */

function DashboardMockup() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-default/50 bg-gradient-to-b from-accent/10 to-transparent p-px shadow-2xl shadow-accent/10">
      <div className="overflow-hidden rounded-[15px] bg-bg-primary">
        {/* Browser bar */}
        <div className="flex items-center gap-2 border-b border-border-default/30 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/60" />
            <span className="size-2.5 rounded-full bg-yellow-400/60" />
            <span className="size-2.5 rounded-full bg-green-400/60" />
          </div>
          <div className="ml-3 flex-1 rounded-md bg-bg-tertiary px-3 py-1 text-[11px] text-text-muted">
            scalingflow.vercel.app/dashboard
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3 p-4">
          {/* Sidebar */}
          <div className="col-span-2 hidden space-y-2 lg:block">
            <div className="h-3 w-16 rounded bg-accent/20" />
            <div className="mt-4 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2.5 rounded ${i === 0 ? "w-full bg-accent/15" : "w-3/4 bg-white/[0.04]"}`}
                />
              ))}
            </div>
          </div>

          {/* Main */}
          <div className="col-span-12 space-y-3 lg:col-span-10">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {["Agents IA", "Assets", "Funnels", "Offres"].map((label, i) => (
                <div
                  key={label}
                  className={`rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5 ${i === 3 ? "hidden sm:block" : ""}`}
                >
                  <div className="text-[9px] text-text-muted">{label}</div>
                  <div className="mt-1 text-sm font-bold text-text-primary/80">
                    {["11", "15+", "8", "12"][i]}
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <div className="h-1 flex-1 rounded-full bg-white/[0.04]">
                      <div
                        className="h-1 rounded-full bg-accent/40"
                        style={{ width: `${[85, 78, 65, 72][i]}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[10px] font-medium text-text-muted">
                  Générations IA
                </div>
                <div className="flex gap-2">
                  <div className="h-1.5 w-6 rounded bg-accent/30" />
                  <div className="h-1.5 w-6 rounded bg-emerald-300/30" />
                </div>
              </div>
              <div className="flex h-16 items-end gap-1 sm:h-24">
                {[30, 45, 35, 60, 50, 72, 55, 80, 65, 88, 75, 95].map(
                  (h, i) => (
                    <div key={i} className="flex flex-1 flex-col gap-0.5">
                      <div
                        className="rounded-t bg-accent/25 transition-all duration-500"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Pipeline */}
            <div className="grid grid-cols-3 gap-2">
              {["Marché", "Offre", "Funnel"].map((col, ci) => (
                <div
                  key={col}
                  className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-2"
                >
                  <div className="mb-2 text-[9px] font-medium text-text-muted">
                    {col}
                  </div>
                  {[...Array(ci === 0 ? 3 : ci === 1 ? 4 : 2)].map((_, j) => (
                    <div
                      key={j}
                      className="mb-1.5 rounded border border-white/[0.04] bg-white/[0.03] p-1.5"
                    >
                      <div className="h-1.5 w-3/4 rounded bg-white/[0.08]" />
                      <div className="mt-1 h-1 w-1/2 rounded bg-white/[0.04]" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const ACCENT = "#34D399";
const ACCENT_LIGHT = "#6EE7B7";
const ACCENT_GLOW = "rgba(52, 211, 153, 0.12)";

const navLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Comment ça marche", href: "#how-it-works" },
  { label: "Pourquoi ScalingFlow", href: "#why" },
  { label: "Témoignages", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

const stats = [
  { value: 500, suffix: "+", label: "Générations IA disponibles" },
  { value: 11, suffix: "", label: "Agents IA spécialisés" },
  { value: 15, suffix: "+", label: "Types d'assets générés" },
];

const features = [
  {
    icon: Target,
    title: "Analyse de marché",
    desc: "Identifie ton marché idéal, crée ton avatar client et analyse tes concurrents avec l'IA.",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    icon: Sparkles,
    title: "Offre irrésistible",
    desc: "Génère une offre complète : positionnement, pricing, garanties, mécanisme unique.",
    gradient: "from-purple-500/20 to-purple-500/5",
  },
  {
    icon: Filter,
    title: "Funnel de vente",
    desc: "Construis ton funnel de A à Z : landing page, page de vente, upsells, emails.",
    gradient: "from-blue-500/20 to-blue-500/5",
  },
  {
    icon: Megaphone,
    title: "Ads & Créatives",
    desc: "Crée des publicités qui convertissent : hooks, copy, scripts vidéo, DM automatisés.",
    gradient: "from-rose-500/20 to-rose-500/5",
  },
  {
    icon: FileText,
    title: "Assets marketing",
    desc: "VSL, emails, SMS, sales letters, pitch decks — tout ce qu'il te faut pour closer.",
    gradient: "from-cyan-500/20 to-cyan-500/5",
  },
  {
    icon: Bot,
    title: "Assistant IA",
    desc: "Un coach IA disponible 24/7 qui connaît ton business et t'accompagne à chaque étape.",
    gradient: "from-violet-500/20 to-violet-500/5",
  },
];

const steps = [
  {
    icon: Layers,
    number: "01",
    title: "Remplis ton Vault",
    desc: "Décris ton expertise, tes compétences et tes objectifs en 5 minutes. L'IA apprend tout ce qu'il faut savoir sur ton business.",
  },
  {
    icon: Target,
    number: "02",
    title: "L'IA analyse ton marché",
    desc: "ScalingFlow identifie tes opportunités, ton avatar client et tes concurrents. Tu obtiens une vision claire de ton positionnement.",
  },
  {
    icon: Rocket,
    number: "03",
    title: "Génère tes assets",
    desc: "Offre, funnel, ads, contenu — tout est créé automatiquement, prêt à déployer. Tu passes de l'idée au business structuré.",
  },
];

const valueProps = [
  {
    icon: Target,
    title: "Tout en un, zéro outil externe",
    desc: "Analyse de marché, offre, funnel, ads, contenu, emails — tout est généré dans un seul espace. Plus besoin de jongler entre 10 outils différents.",
    items: [
      "11 agents IA spécialisés dans un seul dashboard",
      "15+ types d'assets générés automatiquement",
      "Du brouillon au business structuré en quelques clics",
    ],
  },
  {
    icon: LineChart,
    title: "L'IA fait le travail, tu décides",
    desc: "Chaque génération est personnalisée à ton business. L'IA analyse ton marché, tes compétences et tes objectifs pour produire des assets sur-mesure.",
    items: [
      "Résultats en 30 secondes, pas en 3 semaines",
      "Tout est éditable et personnalisable",
      "Modèles IA routés intelligemment (Haiku/Sonnet)",
    ],
  },
  {
    icon: Flame,
    title: "Du brouillon au scaling",
    desc: "ScalingFlow t'accompagne de la première analyse de marché jusqu'au scaling. Chaque étape est structurée, chaque asset est prêt à déployer.",
    items: [
      "Pipeline complète : marché → offre → funnel → ads",
      "Gamification pour garder le momentum",
      "Historique de toutes tes générations",
    ],
  },
];

const testimonials = [
  {
    name: "Alex M.",
    role: "Consultant marketing",
    text: "Avant ScalingFlow, je passais 3 semaines à structurer une offre. Maintenant, en 2h j'ai mon analyse de marché, mon offre, et mon funnel complet. Le gain de temps est hallucinant.",
    rating: 5,
    metric: "Offre complète en 2h",
  },
  {
    name: "Sarah K.",
    role: "Coach business",
    text: "L'IA comprend vraiment mon positionnement. Les assets générés sont pertinents et personnalisés. J'ai pu lancer mon nouveau programme en une après-midi au lieu d'un mois.",
    rating: 5,
    metric: "Lancement en 1 après-midi",
  },
  {
    name: "Thomas B.",
    role: "Freelance copywriter",
    text: "Les scripts de vente, les emails, les ads — tout est cohérent et aligné avec mon offre. J'ai généré 15 assets en une journée. C'est devenu mon outil principal.",
    rating: 5,
    metric: "15 assets en 1 journée",
  },
];

const faqItems = [
  {
    question: "Combien de temps faut-il pour générer une offre complète ?",
    answer:
      "Moins de 2 minutes. L'IA analyse ton marché, tes compétences et ton positionnement pour générer une offre structurée avec pricing, garantie et arguments de vente.",
  },
  {
    question: "Puis-je modifier les textes générés par l'IA ?",
    answer:
      "Absolument. Tous les textes générés (offres, funnels, ads, emails) sont entièrement éditables. L'IA te donne une base solide que tu peux affiner selon tes besoins.",
  },
  {
    question: "Puis-je tester avant de m'engager ?",
    answer:
      "Tu peux créer ton compte et explorer la plateforme. L'abonnement Scale ou Agency débloque toutes les générations IA et les fonctionnalités avancées. Annulable à tout moment.",
  },
  {
    question: "Quels types de contenu l'IA peut-elle générer ?",
    answer:
      "ScalingFlow génère : analyses de marché, offres complètes, pages de funnel, créatives publicitaires, scripts de vente, VSL, séquences email/SMS, posts reels, scripts YouTube, et plus encore.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Oui. Toutes les données sont chiffrées et stockées sur Supabase (infrastructure AWS). Les paiements sont sécurisés par Stripe. Nous ne partageons jamais tes données avec des tiers.",
  },
  {
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer:
      "Oui, sans engagement. Tu peux annuler ton abonnement depuis les paramètres de ton compte. Tu conserves l'accès jusqu'à la fin de la période de facturation en cours.",
  },
];

const footerSections = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Pourquoi ScalingFlow", href: "#why" },
      { label: "Témoignages", href: "#testimonials" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "FAQ", href: "#faq" },
      { label: "Contact", href: "mailto:hello@scalingflow.com" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "CGV", href: "/cgv" },
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "Confidentialité", href: "/confidentialite" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function WelcomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const statsSection = useInView(0.3);
  const featuresSection = useInView(0.1);
  const howSection = useInView(0.1);
  const whySection = useInView(0.1);
  const testimonialsSection = useInView(0.1);
  const faqSection = useInView(0.1);
  const ctaSection = useInView(0.2);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary antialiased selection:bg-emerald-900/30 selection:text-emerald-200">
      {/* ================================================================ */}
      {/*  NAVIGATION                                                       */}
      {/* ================================================================ */}
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? "border-b border-border-default/50 bg-bg-primary/80 backdrop-blur-2xl backdrop-saturate-150"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/icons/icon-192.png"
              alt="ScalingFlow"
              width={36}
              height={36}
              className="shrink-0 rounded-lg"
            />
            <span className="text-lg font-bold tracking-tight text-text-primary">
              ScalingFlow
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-text-muted transition-colors duration-200 hover:bg-bg-secondary hover:text-text-primary"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:inline-flex">
              <button
                type="button"
                className="h-9 rounded-lg px-4 text-[13px] font-medium text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
              >
                Connexion
              </button>
            </Link>
            <Link href="/register" className="hidden sm:inline-flex">
              <button
                type="button"
                className="flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-semibold text-white transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`,
                  boxShadow: `0 0 24px ${ACCENT_GLOW}`,
                }}
              >
                Commencer
                <ArrowRight className="size-3.5" />
              </button>
            </Link>

            {/* Mobile toggle */}
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`overflow-hidden border-t border-border-default/50 bg-bg-primary/98 backdrop-blur-2xl transition-all duration-300 md:hidden ${
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 border-t border-border-default/50 pt-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <button
                  type="button"
                  className="w-full rounded-lg py-2.5 text-center text-[15px] font-medium text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
                >
                  Connexion
                </button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-[15px] font-semibold text-white transition-colors"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`,
                  }}
                >
                  Commencer
                  <ArrowRight className="size-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* ============================================================== */}
        {/*  1. HERO                                                        */}
        {/* ============================================================== */}
        <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-36">
          {/* Orbs */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-0 h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-accent/[0.06] blur-[160px]" />
            <div className="absolute right-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-purple-500/[0.04] blur-[100px]" />
            <div className="absolute left-1/4 top-1/3 h-[250px] w-[250px] rounded-full bg-blue-500/[0.04] blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-[13px] font-medium text-accent backdrop-blur-sm">
                <span
                  className="flex size-1.5 rounded-full"
                  style={{
                    backgroundColor: ACCENT,
                    boxShadow: `0 0 8px ${ACCENT_GLOW}`,
                  }}
                />
                Infrastructure IA Plug &amp; Play
              </div>

              {/* Headline */}
              <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-text-primary sm:text-[3.5rem] lg:text-[4rem]">
                Scale ton business
                <br />
                <span className="relative inline-block whitespace-nowrap">
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT}, ${ACCENT})`,
                    }}
                  >
                    avec l&apos;IA
                  </span>
                  <span
                    className="absolute -bottom-1 left-0 h-px w-full"
                    style={{
                      backgroundImage: `linear-gradient(to right, transparent, ${ACCENT}66, transparent)`,
                    }}
                    aria-hidden="true"
                  />
                </span>
              </h1>

              {/* Subheadline */}
              <p className="mx-auto mt-6 max-w-xl text-[1.125rem] leading-relaxed text-text-secondary sm:text-lg">
                Offre, funnel, ads, contenu, emails — tout ce dont tu as besoin
                pour lancer et scaler, généré par l&apos;IA en quelques clics.{" "}
                <span className="font-medium text-text-primary">
                  Commence dès maintenant.
                </span>
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/register">
                  <button
                    type="button"
                    className="group flex h-12 items-center gap-2 rounded-xl px-7 text-[15px] font-semibold text-white transition-all duration-300 hover:shadow-[0_0_60px_rgba(52,211,153,0.25)] active:scale-[0.98]"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`,
                      boxShadow: `0 0 40px ${ACCENT_GLOW}, 0 1px 2px rgba(0,0,0,0.2)`,
                    }}
                  >
                    Commencer maintenant
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </Link>
                <a href="#features">
                  <button
                    type="button"
                    className="h-12 rounded-xl border border-border-default bg-bg-secondary/50 px-7 text-[15px] font-medium text-text-secondary transition-all duration-200 hover:border-border-hover hover:bg-bg-secondary hover:text-text-primary"
                  >
                    Voir les fonctionnalités
                  </button>
                </a>
              </div>

              {/* Trust pills */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-[13px] text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Shield className="size-3.5" />
                  Accès immédiat
                </span>
                <span className="h-3 w-px bg-border-default" aria-hidden="true" />
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  Opérationnel en 5 min
                </span>
                <span className="h-3 w-px bg-border-default" aria-hidden="true" />
                <span className="flex items-center gap-1.5">
                  <Zap className="size-3.5" />
                  Annulable à tout moment
                </span>
              </div>
            </div>

            {/* Mockup */}
            <div className="mx-auto mt-16 max-w-4xl sm:mt-20">
              <DashboardMockup />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/*  2. STATS                                                       */}
        {/* ============================================================== */}
        <section
          ref={statsSection.ref}
          className="relative border-y border-border-default/50 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="mb-10 text-center text-[13px] font-medium uppercase tracking-[0.15em] text-text-muted">
              La puissance de l&apos;IA au service de ton business
            </p>
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
              {stats.map((stat, i) => (
                <div key={stat.label} className="text-center">
                  <div
                    className={`text-4xl font-bold tracking-tight text-accent sm:text-5xl transition-all duration-700 ${
                      statsSection.isInView
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${i * 150}ms` }}
                  >
                    <AnimatedCounter
                      target={stat.value}
                      suffix={stat.suffix}
                      isInView={statsSection.isInView}
                    />
                  </div>
                  <div
                    className={`mt-2 text-[13px] font-medium tracking-wide text-text-muted uppercase transition-all duration-700 ${
                      statsSection.isInView
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${i * 150 + 100}ms` }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/*  3. FEATURES                                                    */}
        {/* ============================================================== */}
        <section
          id="features"
          ref={featuresSection.ref}
          className="scroll-mt-20 py-24 sm:py-32 lg:py-40"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <FadeIn
              isInView={featuresSection.isInView}
              className="mx-auto max-w-2xl text-center"
            >
              <p
                className="mb-4 text-[13px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: `${ACCENT}B3` }}
              >
                Ce qui est inclus
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl lg:text-[2.75rem]">
                Tout pour scaler,{" "}
                <span className="text-text-muted">en un seul endroit</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-text-secondary sm:text-lg">
                De l&apos;analyse de marché au closing, ScalingFlow génère tous
                les assets dont tu as besoin pour lancer et scaler ton business.
              </p>
            </FadeIn>

            <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-20 lg:grid-cols-3">
              {features.map((feature, i) => (
                <article
                  key={feature.title}
                  className={`group relative overflow-hidden rounded-2xl border border-border-default/50 bg-bg-secondary/30 p-7 transition-all duration-500 hover:border-accent/20 hover:bg-bg-secondary/50 hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/5 sm:p-8 ${
                    featuresSection.isInView
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div
                    className={`pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br ${feature.gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent/15">
                      <feature.icon className="size-5" />
                    </div>
                    <h3 className="text-[15px] font-semibold tracking-tight text-text-primary">
                      {feature.title}
                    </h3>
                    <p className="mt-2.5 text-[14px] leading-relaxed text-text-secondary">
                      {feature.desc}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/*  4. HOW IT WORKS                                                */}
        {/* ============================================================== */}
        <section
          id="how-it-works"
          ref={howSection.ref}
          className="scroll-mt-20 border-y border-border-default/50 bg-bg-secondary/30 py-24 sm:py-32 lg:py-40"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <FadeIn
              isInView={howSection.isInView}
              className="mx-auto max-w-2xl text-center"
            >
              <p
                className="mb-4 text-[13px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: `${ACCENT}B3` }}
              >
                Le parcours
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                3 étapes pour passer de zéro{" "}
                <span className="text-text-muted">
                  à un business structuré
                </span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-text-secondary sm:text-lg">
                Un processus simple et guidé par l&apos;IA. Tu remplis, l&apos;IA
                génère, tu déploies.
              </p>
            </FadeIn>

            <div className="relative mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mt-20">
              <div
                className="pointer-events-none absolute top-16 left-[16.66%] hidden h-px w-[66.66%] md:block"
                aria-hidden="true"
                style={{
                  backgroundImage: `linear-gradient(to right, ${ACCENT}33, ${ACCENT}1A, ${ACCENT}33)`,
                }}
              />

              {steps.map((step, i) => (
                <FadeIn
                  key={step.number}
                  isInView={howSection.isInView}
                  delay={i * 120}
                  className="relative text-center"
                >
                  <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl border border-border-default/50 bg-bg-primary shadow-sm">
                    <step.icon className="size-6 text-accent/70" />
                  </div>
                  <div
                    className="mb-3 text-[12px] font-bold tracking-[0.2em]"
                    style={{ color: `${ACCENT}80` }}
                  >
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-text-primary">
                    {step.title}
                  </h3>
                  <p className="mx-auto mt-2.5 max-w-xs text-[14px] leading-relaxed text-text-secondary">
                    {step.desc}
                  </p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/*  5. POURQUOI SCALINGFLOW                                        */}
        {/* ============================================================== */}
        <section
          id="why"
          ref={whySection.ref}
          className="scroll-mt-20 py-24 sm:py-32 lg:py-40"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <FadeIn
              isInView={whySection.isInView}
              className="mx-auto max-w-2xl text-center"
            >
              <p
                className="mb-4 text-[13px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: `${ACCENT}B3` }}
              >
                La différence ScalingFlow
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                Pourquoi ceux qui commencent{" "}
                <span className="text-text-muted">ne s&apos;arrêtent plus</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-text-secondary sm:text-lg">
                Ce n&apos;est pas un outil IA de plus. C&apos;est une
                infrastructure complète qui structure ton business de A à Z.
              </p>
            </FadeIn>

            <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3 lg:mt-20">
              {valueProps.map((vp, i) => (
                <article
                  key={vp.title}
                  className={`group relative overflow-hidden rounded-2xl border border-border-default/50 bg-bg-secondary/30 p-7 transition-all duration-500 hover:border-accent/20 hover:bg-bg-secondary/50 hover:shadow-lg hover:shadow-accent/5 sm:p-8 ${
                    whySection.isInView
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <vp.icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-text-primary">
                    {vp.title}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-text-secondary">
                    {vp.desc}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {vp.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-[13px] text-text-secondary"
                      >
                        <Check className="mt-0.5 size-3.5 shrink-0 text-accent/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/*  6. TESTIMONIALS                                                */}
        {/* ============================================================== */}
        <section
          id="testimonials"
          ref={testimonialsSection.ref}
          className="scroll-mt-20 border-y border-border-default/50 bg-bg-secondary/30 py-24 sm:py-32 lg:py-40"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <FadeIn
              isInView={testimonialsSection.isInView}
              className="mx-auto max-w-2xl text-center"
            >
              <p
                className="mb-4 text-[13px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: `${ACCENT}B3` }}
              >
                Témoignages
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                Ils utilisent ScalingFlow au quotidien
              </h2>
              <p className="mt-5 text-base leading-relaxed text-text-secondary sm:text-lg">
                Des entrepreneurs qui ont structuré et scalé leur business grâce
                à l&apos;IA. Voilà ce qui a changé pour eux.
              </p>
            </FadeIn>

            <div className="mt-16 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3 lg:mt-20">
              {testimonials.map((t, i) => (
                <article
                  key={t.name}
                  className={`group relative overflow-hidden rounded-2xl border border-border-default/50 bg-bg-secondary/30 p-7 transition-all duration-500 hover:border-accent/20 hover:bg-bg-secondary/50 hover:shadow-lg hover:shadow-accent/5 sm:p-8 ${
                    testimonialsSection.isInView
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  {/* Metric badge */}
                  <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-[12px] font-medium text-accent">
                    <TrendingUp className="size-3" />
                    {t.metric}
                  </div>

                  <div className="mb-4 flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Star
                        key={idx}
                        className="size-3.5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  <blockquote className="text-[14px] leading-relaxed text-text-secondary">
                    <Quote className="mb-2 size-4 text-text-muted/30" />
                    {t.text}
                  </blockquote>

                  <div className="mt-6 flex items-center gap-3 border-t border-border-default/50 pt-5">
                    <div className="flex size-9 items-center justify-center rounded-full bg-accent/10 text-[13px] font-semibold text-accent">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-text-primary">
                        {t.name}
                      </div>
                      <div className="text-[12px] text-text-muted">
                        {t.role}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/*  7. FAQ                                                          */}
        {/* ============================================================== */}
        <section
          id="faq"
          ref={faqSection.ref}
          className="scroll-mt-20 py-24 sm:py-32 lg:py-40"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <FadeIn
              isInView={faqSection.isInView}
              className="mx-auto max-w-2xl text-center"
            >
              <p
                className="mb-4 text-[13px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: `${ACCENT}B3` }}
              >
                Questions fréquentes
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                Tout ce que tu veux savoir
              </h2>
              <p className="mt-5 text-base leading-relaxed text-text-secondary sm:text-lg">
                Les réponses aux questions qu&apos;on nous pose le plus souvent.
              </p>
            </FadeIn>

            <div className="mt-12 space-y-3 lg:mt-16">
              {faqItems.map((item, i) => (
                <div
                  key={i}
                  className={`overflow-hidden rounded-2xl border border-border-default/50 bg-bg-secondary/30 transition-all duration-500 hover:border-border-hover ${
                    faqSection.isInView
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-[15px] font-semibold text-text-primary">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`size-5 shrink-0 text-text-muted transition-transform duration-300 ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ${
                      openFaq === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-[14px] leading-relaxed text-text-secondary">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/*  8. CTA FINAL                                                   */}
        {/* ============================================================== */}
        <section
          ref={ctaSection.ref}
          className="relative overflow-hidden py-24 sm:py-32 lg:py-40"
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            <div
              className="absolute left-1/2 bottom-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-[160px]"
              style={{ backgroundColor: `${ACCENT}0C` }}
            />
          </div>
          <FadeIn
            isInView={ctaSection.isInView}
            className="relative mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8"
          >
            <div className="mb-6 inline-flex items-center justify-center">
              <Sparkles className="size-6 text-accent/60" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
              Prêt à scaler ?
              <br />
              <span className="text-text-muted">
                Ton business structuré par l&apos;IA.
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-text-secondary sm:text-lg">
              Rejoins ScalingFlow et lance ton business structuré par l&apos;IA
              en moins de 30 minutes.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <Link href="/register">
                <button
                  type="button"
                  className="group flex h-13 items-center gap-2 rounded-xl px-10 text-[15px] font-semibold text-white transition-all duration-300 hover:shadow-[0_0_60px_rgba(52,211,153,0.25)] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`,
                    boxShadow: `0 0 40px ${ACCENT_GLOW}`,
                  }}
                >
                  Commencer maintenant
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </Link>
              <span className="text-[13px] text-text-muted">
                Accès immédiat — annulable à tout moment
              </span>
            </div>
          </FadeIn>
        </section>
      </main>

      {/* ================================================================ */}
      {/*  FOOTER                                                           */}
      {/* ================================================================ */}
      <footer className="border-t border-border-default/50 bg-bg-primary py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5">
                <Image
                  src="/icons/icon-192.png"
                  alt="ScalingFlow"
                  width={30}
                  height={30}
                  className="shrink-0 rounded-md"
                />
                <span className="text-[15px] font-bold text-text-primary">
                  ScalingFlow
                </span>
              </Link>
              <p className="mt-4 max-w-[220px] text-[13px] leading-relaxed text-text-muted">
                La plateforme tout-en-un pour structurer, lancer et scaler ton
                business avec l&apos;IA.
              </p>
            </div>

            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-text-muted/60">
                  {section.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[13px] text-text-muted transition-colors duration-200 hover:text-text-secondary"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 flex items-center justify-center gap-2 border-t border-border-default/30 pt-8 text-center text-[12px] text-text-muted/60">
            <Shield className="size-3" aria-hidden="true" />
            Paiements sécurisés via Stripe &middot; &copy;{" "}
            {new Date().getFullYear()} ScalingFlow. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}

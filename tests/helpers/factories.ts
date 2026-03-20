import { TEST_USER_ID } from "./auth";

/**
 * Data factories for creating test entities.
 * Each factory returns a valid object with sensible defaults that can be overridden.
 */

export function buildProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_USER_ID,
    email: "test@example.com",
    full_name: "Test User",
    first_name: "Test",
    onboarding_completed: true,
    onboarding_step: 5,
    xp_points: 0,
    level: 1,
    badges: [],
    streak_days: 0,
    current_revenue: 0,
    subscription_status: "active",
    subscription_plan: "pro",
    stripe_customer_id: "cus_test123",
    skills: ["marketing", "copywriting"],
    situation: "freelance",
    situation_details: {},
    expertise_answers: {},
    parcours: "solo",
    target_revenue: 10000,
    industries: ["saas"],
    objectives: ["scale"],
    budget_monthly: 500,
    vault_completed: true,
    selected_market: "coaching",
    market_viability_score: 85,
    niche: "coaching business",
    referred_by: null,
    ...overrides,
  };
}

export function buildMarketAnalysis(overrides: Record<string, unknown> = {}) {
  return {
    id: "ma-test-123",
    user_id: TEST_USER_ID,
    market_name: "Coaching Business",
    problems: ["Pas de clients", "Prix trop bas"],
    target_avatar: { age: "25-45", pain: "Trouver des clients" },
    recommended_positioning: "Expert en acquisition client",
    viability_score: 85,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

export function buildOffer(overrides: Record<string, unknown> = {}) {
  return {
    id: "offer-test-123",
    user_id: TEST_USER_ID,
    market_analysis_id: "ma-test-123",
    offer_name: "Programme Scale",
    positioning: "Le programme #1 pour scaler",
    unique_mechanism: "La méthode Scale Engine",
    pricing_strategy: { price: 997 },
    guarantees: [{ type: "money-back", duration: "30 jours" }],
    no_brainer_element: "Bonus gratuit",
    risk_reversal: "Remboursé si pas de résultats",
    delivery_structure: { modules: 6 },
    oto_offer: { name: "VIP", price: 497 },
    status: "draft",
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

export function buildFunnel(overrides: Record<string, unknown> = {}) {
  return {
    id: "funnel-test-123",
    user_id: TEST_USER_ID,
    name: "Funnel de vente principal",
    status: "draft",
    pages: [],
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

export function buildContentPiece(overrides: Record<string, unknown> = {}) {
  return {
    id: "content-test-123",
    user_id: TEST_USER_ID,
    type: "reel",
    title: "5 astuces pour scaler",
    content: "Contenu test",
    platform: "instagram",
    status: "draft",
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

export function buildAffiliate(overrides: Record<string, unknown> = {}) {
  return {
    id: "affiliate-test-123",
    user_id: TEST_USER_ID,
    affiliate_code: "TEST-A3K9",
    status: "active",
    total_earned: 0,
    total_conversions: 0,
    custom_commission_rate: null,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

export function buildAffiliateProgram(overrides: Record<string, unknown> = {}) {
  return {
    id: "program-test-123",
    owner_id: TEST_USER_ID,
    commission_type: "recurring",
    commission_rate: 20,
    recurring_months: 12,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

export function buildSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_test123",
    customer: "cus_test123",
    status: "active",
    items: {
      data: [{ price: { id: "price_xxx_pro_monthly" } }],
    },
    ...overrides,
  };
}

export function buildStripeCheckoutSession(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs_test123",
    url: "https://checkout.stripe.com/test",
    customer: "cus_test123",
    subscription: "sub_test123",
    payment_intent: "pi_test123",
    amount_total: 4900,
    currency: "eur",
    customer_email: "test@example.com",
    metadata: {
      supabase_user_id: TEST_USER_ID,
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_content: "",
      utm_term: "",
      fbclid: "",
    },
    ...overrides,
  };
}

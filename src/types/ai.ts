export interface MarketAnalysisResult {
  markets: MarketOpportunity[];
  recommended_market_index: number;
  reasoning: string;
}

export interface MarketOpportunity {
  name: string;
  description: string;
  problems: string[];
  viability_score: number;
  positioning: string;
  avatar: {
    name: string;
    role: string;
    revenue: string;
    pain_points: string[];
    desires: string[];
    objections: string[];
  };
  competitors: {
    name: string;
    strengths: string[];
    weaknesses: string[];
  }[];
  demand_signals: string[];
  why_good_fit: string;
}

export interface OfferGenerationResult {
  packaging: {
    offer_name: string;
    positioning: string;
    unique_mechanism: {
      name: string;
      description: string;
      steps: string[];
    };
    pricing: {
      anchor_price: number;
      real_price: number;
      value_breakdown: { item: string; value: number }[];
      payment_options: string[];
    };
    guarantees: {
      type: string;
      description: string;
      duration: string;
    }[];
    risk_reversal: string;
    no_brainer: string;
    oto: {
      name: string;
      description: string;
      price: number;
      value_proposition: string;
    };
  };
  delivery: {
    problematiques: {
      name: string;
      agents_ia: string[];
      personnes: string[];
      process: string[];
      outils: string[];
      automations: string[];
    }[];
  };
  full_document_markdown: string;
}

export interface VSLScriptResult {
  total_duration_estimate: string;
  sections: {
    name: string;
    duration: string;
    script: string;
    speaker_notes: string;
  }[];
  full_script: string;
}

export interface EmailSequenceResult {
  sequence_name: string;
  emails: {
    day: number;
    subject: string;
    preview_text: string;
    body: string;
    cta_text: string;
    cta_url_placeholder: string;
    pillar: string;
  }[];
}

export interface AdCopyResult {
  variations: {
    hook: string;
    body: string;
    headline: string;
    cta: string;
    angle: string;
    target_audience: string;
    estimated_format: "image" | "video";
  }[];
}

export interface SchwartzAnalysisResult {
  niveau: 1 | 2 | 3 | 4 | 5;
  description: string;
  implication_marketing: string;
  strategie_recommandee: "vsl" | "social_funnel" | "education_first" | "direct_response";
  angle_publicitaire: string;
  type_contenu_prioritaire: string;
  niveau_preuve_requis: "faible" | "moyen" | "eleve" | "tres_eleve";
}

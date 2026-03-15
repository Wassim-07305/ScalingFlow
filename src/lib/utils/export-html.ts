// ─── Funnel HTML Export (#57) — Premium Landing Page Generator ──

interface FunnelData {
  optin_page?: {
    headline: string;
    subheadline: string;
    bullet_points: string[];
    cta_text: string;
    social_proof_text?: string;
  };
  vsl_page?: {
    headline: string;
    intro_text: string;
    benefit_bullets: string[];
    faq?: { question: string; answer: string }[];
  };
  thankyou_page?: {
    confirmation_message: string;
    next_steps: string[];
    upsell_headline?: string;
    upsell_description?: string;
    upsell_cta?: string;
  };
}

export interface BrandTheme {
  accentColor?: string;
  bgColor?: string;
  bgCard?: string;
  textColor?: string;
  fontHeading?: string;
  fontBody?: string;
  logoUrl?: string;
}

const DEFAULT_THEME: Required<BrandTheme> = {
  accentColor: "#34D399",
  bgColor: "#0B0E11",
  bgCard: "#141719",
  textColor: "#F9FAFB",
  fontHeading: "Inter",
  fontBody: "Inter",
  logoUrl: "",
};

/**
 * Generates premium HTML for a single funnel page (optin, vsl, or thankyou).
 * Used by the iframe preview and the public deployed page.
 */
export function generateFunnelPageHTML(
  data: FunnelData,
  pageType: "optin" | "vsl" | "thankyou",
  options?: { brandName?: string; theme?: BrandTheme }
): string {
  const theme = { ...DEFAULT_THEME, ...options?.theme };
  const brandName = options?.brandName || "Mon Offre";
  const accentRGB = hexToRGB(theme.accentColor);

  const googleFontsLink = buildGoogleFontsLink(theme.fontHeading, theme.fontBody);

  let bodyContent = "";

  if (pageType === "optin" && data.optin_page) {
    const p = data.optin_page;
    bodyContent = `
    <!-- Hero Section -->
    <section class="hero">
      ${theme.logoUrl ? `<img src="${esc(theme.logoUrl)}" alt="${esc(brandName)}" class="logo" />` : ""}
      <div class="badge">Accès exclusif</div>
      <h1>${esc(p.headline)}</h1>
      <p class="subtitle">${esc(p.subheadline)}</p>
      <a href="#" class="cta-btn cta-pulse">${esc(p.cta_text)}</a>
      ${p.social_proof_text ? `<p class="social-proof">${esc(p.social_proof_text)}</p>` : ""}
    </section>

    <!-- Benefits -->
    <section class="benefits">
      <div class="container">
        <h2>Ce que vous allez obtenir</h2>
        <div class="benefits-grid">
          ${p.bullet_points.map((bp, i) => `
          <div class="benefit-card" style="animation-delay: ${i * 0.1}s">
            <div class="benefit-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16.67 5L7.5 14.17L3.33 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p>${esc(bp)}</p>
          </div>`).join("")}
        </div>
      </div>
    </section>

    <!-- CTA bottom -->
    <section class="cta-section">
      <div class="container" style="text-align:center">
        <h2>Prêt à commencer ?</h2>
        <p class="subtitle" style="margin-bottom:32px">Rejoignez ceux qui ont déjà transformé leur activité.</p>
        <a href="#" class="cta-btn cta-pulse">${esc(p.cta_text)}</a>
        ${p.social_proof_text ? `<p class="social-proof">${esc(p.social_proof_text)}</p>` : ""}
      </div>
    </section>`;
  }

  if (pageType === "vsl" && data.vsl_page) {
    const p = data.vsl_page;
    bodyContent = `
    <!-- Hero Section -->
    <section class="hero">
      ${theme.logoUrl ? `<img src="${esc(theme.logoUrl)}" alt="${esc(brandName)}" class="logo" />` : ""}
      <h1>${esc(p.headline)}</h1>
      <p class="subtitle">${esc(p.intro_text)}</p>
    </section>

    <!-- Video Section -->
    <section class="video-section">
      <div class="container">
        <div class="video-wrapper">
          <div class="video-placeholder">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="23" stroke="currentColor" stroke-width="2" opacity="0.3"/>
              <path d="M20 16L34 24L20 32V16Z" fill="currentColor" opacity="0.6"/>
            </svg>
            <p>Insère ta vidéo VSL ici</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits -->
    <section class="benefits">
      <div class="container">
        <h2>Pourquoi choisir cette solution</h2>
        <div class="benefits-grid">
          ${p.benefit_bullets.map((b, i) => `
          <div class="benefit-card" style="animation-delay: ${i * 0.1}s">
            <div class="benefit-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16.67 5L7.5 14.17L3.33 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p>${esc(b)}</p>
          </div>`).join("")}
        </div>
      </div>
    </section>

    ${p.faq && p.faq.length > 0 ? `
    <!-- FAQ -->
    <section class="faq-section">
      <div class="container">
        <h2>Questions fréquentes</h2>
        <div class="faq-list">
          ${p.faq.map((f) => `
          <details class="faq-item">
            <summary>${esc(f.question)}</summary>
            <p>${esc(f.answer)}</p>
          </details>`).join("")}
        </div>
      </div>
    </section>` : ""}

    <!-- CTA bottom -->
    <section class="cta-section">
      <div class="container" style="text-align:center">
        <a href="#" class="cta-btn cta-pulse">Commencer maintenant</a>
      </div>
    </section>`;
  }

  if (pageType === "thankyou" && data.thankyou_page) {
    const p = data.thankyou_page;
    bodyContent = `
    <!-- Hero Section -->
    <section class="hero thankyou-hero">
      ${theme.logoUrl ? `<img src="${esc(theme.logoUrl)}" alt="${esc(brandName)}" class="logo" />` : ""}
      <div class="success-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2.5"/>
          <path d="M15 24L21 30L33 18" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1>${esc(p.confirmation_message)}</h1>
    </section>

    <!-- Next Steps -->
    <section class="steps-section">
      <div class="container">
        <h2>Prochaines étapes</h2>
        <div class="steps-list">
          ${p.next_steps.map((step, i) => `
          <div class="step-card" style="animation-delay: ${i * 0.15}s">
            <div class="step-number">${i + 1}</div>
            <p>${esc(step)}</p>
          </div>`).join("")}
        </div>
      </div>
    </section>

    ${p.upsell_headline ? `
    <!-- Upsell -->
    <section class="upsell-section">
      <div class="container">
        <div class="upsell-card">
          <div class="upsell-badge">Offre spéciale</div>
          <h2>${esc(p.upsell_headline)}</h2>
          <p>${esc(p.upsell_description || "")}</p>
          <a href="#" class="cta-btn">${esc(p.upsell_cta || "Découvrir")}</a>
        </div>
      </div>
    </section>` : ""}`;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(brandName)}</title>
  ${googleFontsLink}
  <style>
    :root {
      --accent: ${theme.accentColor};
      --accent-rgb: ${accentRGB};
      --bg: ${theme.bgColor};
      --bg-card: ${theme.bgCard};
      --border: ${adjustBrightness(theme.bgColor, 20)};
      --text: ${theme.textColor};
      --text-secondary: ${adjustOpacity(theme.textColor, 0.6)};
      --text-muted: ${adjustOpacity(theme.textColor, 0.4)};
      --font-heading: '${theme.fontHeading}', system-ui, sans-serif;
      --font-body: '${theme.fontBody}', system-ui, sans-serif;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    html { scroll-behavior: smooth; }

    body {
      font-family: var(--font-body);
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 760px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* ─── Hero ─── */
    .hero {
      min-height: 80vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 80px 24px 60px;
      background: linear-gradient(180deg, rgba(var(--accent-rgb), 0.08) 0%, transparent 60%);
      position: relative;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: -50%;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(var(--accent-rgb), 0.12) 0%, transparent 70%);
      pointer-events: none;
    }

    .logo {
      height: 48px;
      width: auto;
      margin-bottom: 32px;
      position: relative;
    }

    .badge {
      display: inline-block;
      background: rgba(var(--accent-rgb), 0.15);
      color: var(--accent);
      padding: 6px 16px;
      border-radius: 100px;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 24px;
      border: 1px solid rgba(var(--accent-rgb), 0.25);
      position: relative;
    }

    .hero h1 {
      font-family: var(--font-heading);
      font-size: clamp(2rem, 5vw, 3.2rem);
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 20px;
      max-width: 700px;
      position: relative;
      background: linear-gradient(135deg, var(--text) 0%, rgba(var(--accent-rgb), 0.9) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      font-size: 1.15rem;
      color: var(--text-secondary);
      line-height: 1.7;
      max-width: 560px;
      margin-bottom: 36px;
      position: relative;
    }

    .social-proof {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-style: italic;
      margin-top: 20px;
      position: relative;
    }

    /* ─── CTA Button ─── */
    .cta-btn {
      display: inline-block;
      background: var(--accent);
      color: var(--bg);
      padding: 16px 48px;
      border-radius: 12px;
      font-size: 1.05rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.3s ease;
      position: relative;
      box-shadow: 0 4px 24px rgba(var(--accent-rgb), 0.3);
    }

    .cta-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(var(--accent-rgb), 0.45);
    }

    .cta-pulse {
      animation: pulse-glow 2.5s ease-in-out infinite;
    }

    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 4px 24px rgba(var(--accent-rgb), 0.3); }
      50% { box-shadow: 0 4px 40px rgba(var(--accent-rgb), 0.5); }
    }

    /* ─── Benefits ─── */
    .benefits {
      padding: 80px 0;
    }

    .benefits h2, .faq-section h2, .steps-section h2 {
      font-family: var(--font-heading);
      font-size: 1.75rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 48px;
      color: var(--text);
    }

    .benefits-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .benefit-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px 24px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      transition: all 0.3s ease;
      animation: fadeInUp 0.5s ease forwards;
      opacity: 0;
    }

    .benefit-card:hover {
      border-color: rgba(var(--accent-rgb), 0.3);
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }

    .benefit-icon {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(var(--accent-rgb), 0.12);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .benefit-card p {
      font-size: 0.95rem;
      color: var(--text-secondary);
      line-height: 1.6;
      padding-top: 6px;
    }

    /* ─── Video ─── */
    .video-section {
      padding: 20px 0 60px;
    }

    .video-wrapper {
      aspect-ratio: 16/9;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 20px;
      overflow: hidden;
    }

    .video-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    /* ─── FAQ ─── */
    .faq-section {
      padding: 60px 0 80px;
    }

    .faq-list {
      max-width: 640px;
      margin: 0 auto;
    }

    .faq-item {
      border-bottom: 1px solid var(--border);
      overflow: hidden;
    }

    .faq-item summary {
      padding: 20px 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text);
      cursor: pointer;
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: color 0.2s;
    }

    .faq-item summary::-webkit-details-marker { display: none; }

    .faq-item summary::after {
      content: '+';
      font-size: 1.4rem;
      font-weight: 300;
      color: var(--accent);
      transition: transform 0.3s;
    }

    .faq-item[open] summary::after {
      transform: rotate(45deg);
    }

    .faq-item summary:hover { color: var(--accent); }

    .faq-item p {
      padding: 0 0 20px;
      color: var(--text-secondary);
      font-size: 0.95rem;
      line-height: 1.7;
    }

    /* ─── CTA Section ─── */
    .cta-section {
      padding: 60px 0 80px;
      background: linear-gradient(180deg, transparent 0%, rgba(var(--accent-rgb), 0.05) 100%);
    }

    .cta-section h2 {
      font-family: var(--font-heading);
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 12px;
    }

    /* ─── Thank You ─── */
    .thankyou-hero {
      min-height: 50vh;
    }

    .success-icon {
      color: var(--accent);
      margin-bottom: 24px;
      animation: scaleIn 0.6s ease forwards;
    }

    .thankyou-hero h1 {
      background: none;
      -webkit-text-fill-color: var(--text);
    }

    .steps-section {
      padding: 40px 0 80px;
    }

    .steps-list {
      max-width: 560px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .step-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px 24px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      animation: fadeInUp 0.5s ease forwards;
      opacity: 0;
    }

    .step-number {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(var(--accent-rgb), 0.12);
      color: var(--accent);
      font-weight: 700;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .step-card p {
      font-size: 0.95rem;
      color: var(--text-secondary);
      line-height: 1.6;
      padding-top: 6px;
    }

    /* ─── Upsell ─── */
    .upsell-section {
      padding: 0 0 80px;
    }

    .upsell-card {
      background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.08) 0%, var(--bg-card) 100%);
      border: 1px solid rgba(var(--accent-rgb), 0.2);
      border-radius: 24px;
      padding: 48px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .upsell-badge {
      display: inline-block;
      background: var(--accent);
      color: var(--bg);
      padding: 4px 14px;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 20px;
    }

    .upsell-card h2 {
      font-family: var(--font-heading);
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 12px;
    }

    .upsell-card p {
      color: var(--text-secondary);
      margin-bottom: 28px;
      max-width: 480px;
      margin-left: auto;
      margin-right: auto;
    }

    /* ─── Footer ─── */
    .sf-footer {
      text-align: center;
      padding: 40px 24px;
      font-size: 0.75rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border);
    }

    .sf-footer a {
      color: var(--accent);
      text-decoration: none;
    }

    /* ─── Animations ─── */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.5); }
      to { opacity: 1; transform: scale(1); }
    }

    /* ─── Responsive ─── */
    @media (min-width: 640px) {
      .benefits-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .hero {
        padding: 60px 20px 40px;
        min-height: 60vh;
      }
      .cta-btn {
        padding: 14px 32px;
        font-size: 0.95rem;
      }
      .upsell-card {
        padding: 32px 20px;
      }
    }
  </style>
</head>
<body>
  ${bodyContent}

  <footer class="sf-footer">
    <p>${esc(brandName)} &mdash; Tous droits réservés</p>
    <p style="margin-top:8px"><a href="https://scalingflow.com" target="_blank">Propulsé par ScalingFlow</a></p>
  </footer>
</body>
</html>`;
}

/**
 * Legacy: generates full HTML with all 3 pages concatenated.
 * Kept for backward-compatible export & download.
 */
export function exportFunnelToHTML(data: FunnelData, brandName?: string, theme?: BrandTheme): string {
  const t = { ...DEFAULT_THEME, ...theme };
  const title = brandName || "Mon Offre";
  const accentRGB = hexToRGB(t.accentColor);
  const googleFontsLink = buildGoogleFontsLink(t.fontHeading, t.fontBody);

  // Build sections
  const optinHTML = data.optin_page
    ? `
    <section id="optin" class="section-page">
      <div class="container hero-container">
        ${t.logoUrl ? `<img src="${esc(t.logoUrl)}" alt="${esc(title)}" class="logo" />` : ""}
        <div class="badge">Page d'Opt-in</div>
        <h1 class="gradient-text">${esc(data.optin_page.headline)}</h1>
        <p class="subtitle">${esc(data.optin_page.subheadline)}</p>
        <div class="benefits-list">
          ${data.optin_page.bullet_points.map((b) => `
          <div class="benefit-item">
            <span class="check-icon">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M16.67 5L7.5 14.17L3.33 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span>${esc(b)}</span>
          </div>`).join("")}
        </div>
        <div class="cta-box">
          <a href="#vsl" class="cta-btn">${esc(data.optin_page.cta_text)}</a>
        </div>
        ${data.optin_page.social_proof_text ? `<p class="social-proof">${esc(data.optin_page.social_proof_text)}</p>` : ""}
      </div>
    </section>`
    : "";

  const vslHTML = data.vsl_page
    ? `
    <section id="vsl" class="section-page section-alt">
      <div class="container hero-container">
        <div class="badge">Page VSL</div>
        <h1 class="gradient-text">${esc(data.vsl_page.headline)}</h1>
        <p class="subtitle">${esc(data.vsl_page.intro_text)}</p>
        <div class="video-wrapper">
          <div class="video-placeholder">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="23" stroke="currentColor" stroke-width="2" opacity="0.3"/>
              <path d="M20 16L34 24L20 32V16Z" fill="currentColor" opacity="0.6"/>
            </svg>
            <p>Insère ta vidéo VSL ici</p>
          </div>
        </div>
        <div class="benefits-list">
          ${data.vsl_page.benefit_bullets.map((b) => `
          <div class="benefit-item">
            <span class="check-icon">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M16.67 5L7.5 14.17L3.33 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span>${esc(b)}</span>
          </div>`).join("")}
        </div>
        ${
          data.vsl_page.faq && data.vsl_page.faq.length > 0
            ? `<div class="faq-container">
          <h2>Questions fréquentes</h2>
          ${data.vsl_page.faq.map((f) => `
          <details class="faq-item">
            <summary>${esc(f.question)}</summary>
            <p>${esc(f.answer)}</p>
          </details>`).join("")}
        </div>`
            : ""
        }
      </div>
    </section>`
    : "";

  const thankHTML = data.thankyou_page
    ? `
    <section id="thankyou" class="section-page">
      <div class="container hero-container">
        <div class="success-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2.5"/>
            <path d="M15 24L21 30L33 18" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1>${esc(data.thankyou_page.confirmation_message)}</h1>
        <div class="steps-list">
          ${data.thankyou_page.next_steps.map((s, i) => `
          <div class="step-item">
            <div class="step-num">${i + 1}</div>
            <span>${esc(s)}</span>
          </div>`).join("")}
        </div>
        ${
          data.thankyou_page.upsell_headline
            ? `<div class="upsell-box">
          <div class="upsell-badge">Offre spéciale</div>
          <h2>${esc(data.thankyou_page.upsell_headline)}</h2>
          <p>${esc(data.thankyou_page.upsell_description || "")}</p>
          <a href="#" class="cta-btn">${esc(data.thankyou_page.upsell_cta || "Découvrir")}</a>
        </div>`
            : ""
        }
      </div>
    </section>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  ${googleFontsLink}
  <style>
    :root {
      --bg: ${t.bgColor};
      --bg-card: ${t.bgCard};
      --border: ${adjustBrightness(t.bgColor, 20)};
      --accent: ${t.accentColor};
      --accent-rgb: ${accentRGB};
      --text: ${t.textColor};
      --text-secondary: ${adjustOpacity(t.textColor, 0.6)};
      --text-muted: ${adjustOpacity(t.textColor, 0.4)};
      --font-heading: '${t.fontHeading}', system-ui, sans-serif;
      --font-body: '${t.fontBody}', system-ui, sans-serif;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { font-family: var(--font-body); background: var(--bg); color: var(--text); line-height: 1.6; -webkit-font-smoothing: antialiased; }
    .container { max-width: 760px; margin: 0 auto; padding: 0 24px; }
    .hero-container { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .logo { height: 48px; width: auto; margin-bottom: 32px; }
    .section-page { min-height: 100vh; display: flex; align-items: center; padding: 80px 0; position: relative; overflow: hidden; }
    .section-page::before { content: ''; position: absolute; top: -50%; left: 50%; transform: translateX(-50%); width: 600px; height: 600px; background: radial-gradient(circle, rgba(var(--accent-rgb), 0.08) 0%, transparent 70%); pointer-events: none; }
    .section-alt { background: var(--bg-card); }
    .badge { display: inline-block; background: rgba(var(--accent-rgb), 0.15); color: var(--accent); padding: 6px 16px; border-radius: 100px; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 24px; border: 1px solid rgba(var(--accent-rgb), 0.25); }
    .gradient-text { background: linear-gradient(135deg, var(--text) 0%, rgba(var(--accent-rgb), 0.9) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    h1 { font-family: var(--font-heading); font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; line-height: 1.15; margin-bottom: 20px; max-width: 700px; }
    h2 { font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700; margin-bottom: 24px; color: var(--text); }
    .subtitle { font-size: 1.1rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 36px; max-width: 560px; }
    .social-proof { text-align: center; font-size: 0.85rem; color: var(--text-muted); font-style: italic; margin-top: 16px; }
    .benefits-list { width: 100%; max-width: 560px; margin-bottom: 32px; text-align: left; }
    .benefit-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 20px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 8px; font-size: 0.95rem; color: var(--text-secondary); transition: border-color 0.2s; }
    .benefit-item:hover { border-color: rgba(var(--accent-rgb), 0.3); }
    .check-icon { flex-shrink: 0; color: var(--accent); margin-top: 2px; }
    .cta-box { text-align: center; margin: 40px 0; }
    .cta-btn { display: inline-block; background: var(--accent); color: var(--bg); padding: 16px 48px; border-radius: 12px; font-size: 1.05rem; font-weight: 700; text-decoration: none; transition: all 0.3s ease; box-shadow: 0 4px 24px rgba(var(--accent-rgb), 0.3); }
    .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(var(--accent-rgb), 0.45); }
    .video-wrapper { width: 100%; max-width: 640px; aspect-ratio: 16/9; background: var(--bg); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin-bottom: 40px; }
    .video-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--text-muted); font-size: 0.9rem; }
    .faq-container { width: 100%; max-width: 560px; margin-top: 48px; text-align: left; }
    .faq-item { border-bottom: 1px solid var(--border); }
    .faq-item summary { padding: 20px 0; font-size: 1rem; font-weight: 600; color: var(--text); cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; }
    .faq-item summary::-webkit-details-marker { display: none; }
    .faq-item summary::after { content: '+'; font-size: 1.4rem; font-weight: 300; color: var(--accent); transition: transform 0.3s; }
    .faq-item[open] summary::after { transform: rotate(45deg); }
    .faq-item summary:hover { color: var(--accent); }
    .faq-item p { padding: 0 0 20px; color: var(--text-secondary); font-size: 0.95rem; line-height: 1.7; }
    .success-icon { color: var(--accent); margin-bottom: 24px; }
    .steps-list { width: 100%; max-width: 480px; margin: 32px 0; text-align: left; }
    .step-item { display: flex; align-items: flex-start; gap: 16px; padding: 16px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 8px; color: var(--text-secondary); font-size: 0.95rem; }
    .step-num { flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; background: rgba(var(--accent-rgb), 0.12); color: var(--accent); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; }
    .upsell-box { margin-top: 48px; background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.08) 0%, var(--bg-card) 100%); border: 1px solid rgba(var(--accent-rgb), 0.2); border-radius: 24px; padding: 48px 32px; width: 100%; max-width: 560px; }
    .upsell-badge { display: inline-block; background: var(--accent); color: var(--bg); padding: 4px 14px; border-radius: 100px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; }
    .upsell-box p { color: var(--text-secondary); margin-bottom: 24px; }
    @media (max-width: 640px) {
      .section-page { padding: 60px 0; min-height: auto; }
      .cta-btn { padding: 14px 32px; font-size: 0.95rem; }
      .upsell-box { padding: 32px 20px; }
    }
  </style>
</head>
<body>
  ${optinHTML}
  ${vslHTML}
  ${thankHTML}
  <footer style="text-align:center;padding:40px 24px;font-size:12px;color:var(--text-muted);border-top:1px solid var(--border);">
    <p>${esc(title)} &mdash; Tous droits réservés</p>
    <p style="margin-top:8px"><a href="https://scalingflow.com" target="_blank" style="color:var(--accent);text-decoration:none">Propulsé par ScalingFlow</a></p>
  </footer>
</body>
</html>`;
}

// ─── Helpers ──────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hexToRGB(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `${r}, ${g}, ${b}`;
}

function adjustBrightness(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const r = Math.min(255, Math.max(0, (parseInt(clean.substring(0, 2), 16) || 0) + amount));
  const g = Math.min(255, Math.max(0, (parseInt(clean.substring(2, 4), 16) || 0) + amount));
  const b = Math.min(255, Math.max(0, (parseInt(clean.substring(4, 6), 16) || 0) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function adjustOpacity(hex: string, opacity: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function buildGoogleFontsLink(heading: string, body: string): string {
  const fonts = new Set([heading, body].filter((f) => f && f !== "Inter" && f !== "system-ui"));
  if (fonts.size === 0) {
    return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;
  }
  const familyParams = [...fonts].map((f) => `family=${f.replace(/\s+/g, "+")}:wght@400;500;600;700;800`).join("&");
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&${familyParams}&display=swap" rel="stylesheet">`;
}

export function downloadHTML(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Funnel HTML Export (#57) ─────────────────────────────────

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

export function exportFunnelToHTML(data: FunnelData, brandName?: string): string {
  const title = brandName || "Mon Offre";

  const optinHTML = data.optin_page
    ? `
    <section id="optin" class="page">
      <div class="container">
        <h1>${esc(data.optin_page.headline)}</h1>
        <p class="subtitle">${esc(data.optin_page.subheadline)}</p>
        <ul class="bullets">
          ${data.optin_page.bullet_points.map((b) => `<li>${esc(b)}</li>`).join("\n          ")}
        </ul>
        <div class="cta-box">
          <a href="#" class="cta-btn">${esc(data.optin_page.cta_text)}</a>
        </div>
        ${data.optin_page.social_proof_text ? `<p class="social-proof">${esc(data.optin_page.social_proof_text)}</p>` : ""}
      </div>
    </section>`
    : "";

  const vslHTML = data.vsl_page
    ? `
    <section id="vsl" class="page page-alt">
      <div class="container">
        <h1>${esc(data.vsl_page.headline)}</h1>
        <p class="intro">${esc(data.vsl_page.intro_text)}</p>
        <div class="video-placeholder">[Insere ta video VSL ici]</div>
        <ul class="bullets">
          ${data.vsl_page.benefit_bullets.map((b) => `<li>${esc(b)}</li>`).join("\n          ")}
        </ul>
        ${
          data.vsl_page.faq && data.vsl_page.faq.length > 0
            ? `<div class="faq">
          <h2>Questions frequentes</h2>
          ${data.vsl_page.faq.map((f) => `<div class="faq-item"><h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p></div>`).join("\n          ")}
        </div>`
            : ""
        }
      </div>
    </section>`
    : "";

  const thankHTML = data.thankyou_page
    ? `
    <section id="thankyou" class="page">
      <div class="container">
        <h1>${esc(data.thankyou_page.confirmation_message)}</h1>
        <ol class="steps">
          ${data.thankyou_page.next_steps.map((s) => `<li>${esc(s)}</li>`).join("\n          ")}
        </ol>
        ${
          data.thankyou_page.upsell_headline
            ? `<div class="upsell">
          <h2>${esc(data.thankyou_page.upsell_headline)}</h2>
          <p>${esc(data.thankyou_page.upsell_description || "")}</p>
          <a href="#" class="cta-btn">${esc(data.thankyou_page.upsell_cta || "Decouvrir")}</a>
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
  <style>
    :root {
      --bg: #0B0E11;
      --bg-card: #141719;
      --border: #1C1F23;
      --accent: #34D399;
      --text: #F9FAFB;
      --text-secondary: #9CA3AF;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text); }
    .container { max-width: 720px; margin: 0 auto; padding: 60px 24px; }
    .page { min-height: 100vh; display: flex; align-items: center; }
    .page-alt { background: var(--bg-card); }
    h1 { font-size: 2.5rem; font-weight: 800; line-height: 1.2; margin-bottom: 16px; }
    h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 12px; color: var(--accent); }
    h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 8px; }
    .subtitle, .intro { font-size: 1.15rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 32px; }
    .bullets { list-style: none; margin-bottom: 32px; }
    .bullets li { padding: 10px 0; padding-left: 28px; position: relative; font-size: 1rem; color: var(--text-secondary); border-bottom: 1px solid var(--border); }
    .bullets li::before { content: '\\2714'; position: absolute; left: 0; color: var(--accent); font-weight: bold; }
    .steps { margin-bottom: 32px; padding-left: 24px; }
    .steps li { padding: 10px 0; font-size: 1rem; color: var(--text-secondary); }
    .cta-box { text-align: center; margin: 40px 0; }
    .cta-btn { display: inline-block; background: var(--accent); color: var(--bg); padding: 16px 48px; border-radius: 12px; font-size: 1.1rem; font-weight: 700; text-decoration: none; transition: transform 0.2s; }
    .cta-btn:hover { transform: scale(1.05); }
    .social-proof { text-align: center; font-size: 0.85rem; color: var(--text-secondary); font-style: italic; margin-top: 16px; }
    .video-placeholder { background: var(--border); border-radius: 12px; padding: 80px 24px; text-align: center; color: var(--text-secondary); margin-bottom: 32px; font-size: 0.9rem; }
    .faq { margin-top: 48px; }
    .faq-item { padding: 20px 0; border-bottom: 1px solid var(--border); }
    .faq-item p { color: var(--text-secondary); margin-top: 4px; }
    .upsell { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 32px; text-align: center; margin-top: 40px; }
    .upsell p { color: var(--text-secondary); margin-bottom: 20px; }
    @media (max-width: 640px) { h1 { font-size: 1.75rem; } .container { padding: 40px 16px; } }
  </style>
</head>
<body>
  ${optinHTML}
  ${vslHTML}
  ${thankHTML}
  <footer style="text-align:center;padding:32px;font-size:12px;color:var(--text-secondary);">
    Genere par ScalingFlow
  </footer>
</body>
</html>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

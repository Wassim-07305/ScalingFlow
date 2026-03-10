// ---------------------------------------------------------------------------
// Templates d'emails — ScalingFlow
// Chaque template retourne { subject, html } pour être envoyé via Resend.
// Design : dark theme inline (bg #0B0E11, accent #34D399, texte blanc).
// ---------------------------------------------------------------------------

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scalingflow.com";

/** Wrapper HTML partagé par tous les templates */
function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#0B0E11;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0E11;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#141719;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 16px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#34D399;letter-spacing:-0.5px;">ScalingFlow</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:16px 40px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #1C1F23;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6B7280;">
                &copy; ${new Date().getFullYear()} ScalingFlow — Tous droits r&eacute;serv&eacute;s.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Bouton CTA réutilisable */
function ctaButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:#34D399;border-radius:8px;padding:12px 28px;">
      <a href="${href}" target="_blank" style="color:#0B0E11;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">${label}</a>
    </td>
  </tr>
</table>`;
}

// ---------------------------------------------------------------------------
// 1. Email de bienvenue
// ---------------------------------------------------------------------------
export function welcomeEmail(firstName: string) {
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#FFFFFF;">
      Bienvenue sur ScalingFlow, ${firstName} !
    </h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#D1D5DB;">
      Ton compte est cr&eacute;&eacute;. Tu as maintenant acc&egrave;s &agrave; tous les outils d&rsquo;IA
      pour scaler ton business : g&eacute;n&eacute;ration de publicit&eacute;s, funnels, offres, scripts
      de vente et bien plus.
    </p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#D1D5DB;">
      Commence par l&rsquo;onboarding pour personnaliser ton exp&eacute;rience et
      obtenir des r&eacute;sultats adapt&eacute;s &agrave; ton march&eacute;.
    </p>
    ${ctaButton("Commencer l'onboarding", `${APP_URL}/onboarding`)}
    <p style="margin:0;font-size:13px;color:#6B7280;">
      Si tu as la moindre question, r&eacute;ponds directement &agrave; cet email.
    </p>
  `);

  return {
    subject: "Bienvenue sur ScalingFlow \u{1F680}",
    html,
  };
}

// ---------------------------------------------------------------------------
// 2. Notification de génération terminée
// ---------------------------------------------------------------------------
export function generationCompleteEmail(
  firstName: string,
  generationType: string
) {
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#FFFFFF;">
      Ta g&eacute;n&eacute;ration est pr&ecirc;te !
    </h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#D1D5DB;">
      ${firstName}, ta g&eacute;n&eacute;ration <strong style="color:#34D399;">${generationType}</strong>
      vient d&rsquo;&ecirc;tre termin&eacute;e avec succ&egrave;s.
    </p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#D1D5DB;">
      Connecte-toi pour consulter et exploiter le contenu g&eacute;n&eacute;r&eacute;.
    </p>
    ${ctaButton("Voir le résultat", `${APP_URL}/assets`)}
  `);

  return {
    subject: `Ta génération "${generationType}" est prête`,
    html,
  };
}

// ---------------------------------------------------------------------------
// 3. Milestone / Badge atteint
// ---------------------------------------------------------------------------
export function milestoneEmail(
  firstName: string,
  milestone: string,
  xp: number
) {
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#FFFFFF;">
      Nouveau milestone atteint !
    </h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#D1D5DB;">
      F&eacute;licitations ${firstName} ! Tu viens de d&eacute;bloquer :
    </p>
    <div style="background-color:#1C1F23;border-radius:8px;padding:20px;text-align:center;margin:16px 0;">
      <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#34D399;">${milestone}</p>
      <p style="margin:0;font-size:14px;color:#9CA3AF;">${xp.toLocaleString("fr-FR")} XP cumul&eacute;s</p>
    </div>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#D1D5DB;">
      Continue sur ta lanc&eacute;e pour d&eacute;bloquer les prochains niveaux.
    </p>
    ${ctaButton("Voir ma progression", `${APP_URL}/progress`)}
  `);

  return {
    subject: `Nouveau milestone atteint : ${milestone}`,
    html,
  };
}

// ---------------------------------------------------------------------------
// 4. Confirmation d'abonnement
// ---------------------------------------------------------------------------
export function subscriptionActivatedEmail(firstName: string, planName: string) {
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#FFFFFF;">
      Abonnement ${planName} activ&eacute; !
    </h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#D1D5DB;">
      ${firstName}, ton abonnement <strong style="color:#34D399;">${planName}</strong>
      est maintenant actif. Tu as d&eacute;sormais acc&egrave;s &agrave; toutes les fonctionnalit&eacute;s
      de ton plan.
    </p>
    <div style="background-color:#1C1F23;border-radius:8px;padding:20px;margin:16px 0;">
      <p style="margin:0 0 8px;font-size:14px;color:#9CA3AF;">Ton plan :</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#34D399;">${planName}</p>
    </div>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#D1D5DB;">
      G&eacute;n&eacute;rations illimit&eacute;es, acc&egrave;s &agrave; tous les agents IA,
      et bien plus. Fonce !
    </p>
    ${ctaButton("Acc\u00e9der au dashboard", `${APP_URL}`)}
    <p style="margin:0;font-size:13px;color:#6B7280;">
      Tu peux g&eacute;rer ton abonnement depuis les param&egrave;tres.
    </p>
  `);

  return {
    subject: `Abonnement ${planName} activ\u00e9 \u2705`,
    html,
  };
}

// ---------------------------------------------------------------------------
// 5. Annulation d'abonnement
// ---------------------------------------------------------------------------
export function subscriptionCanceledEmail(firstName: string) {
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#FFFFFF;">
      Abonnement annul&eacute;
    </h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#D1D5DB;">
      ${firstName}, ton abonnement a &eacute;t&eacute; annul&eacute;. Tu passes
      automatiquement au plan Gratuit (5 g&eacute;n&eacute;rations/mois).
    </p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#D1D5DB;">
      Tes contenus g&eacute;n&eacute;r&eacute;s restent accessibles. Tu peux te r&eacute;abonner
      &agrave; tout moment.
    </p>
    ${ctaButton("Se r\u00e9abonner", `${APP_URL}/pricing`)}
  `);

  return {
    subject: "Ton abonnement ScalingFlow a \u00e9t\u00e9 annul\u00e9",
    html,
  };
}

// ---------------------------------------------------------------------------
// 6. Rappel de streak
// ---------------------------------------------------------------------------
export function streakReminderEmail(firstName: string, streakDays: number) {
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#FFFFFF;">
      Ton streak est en danger !
    </h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#D1D5DB;">
      ${firstName}, tu as un streak de <strong style="color:#34D399;">${streakDays} jour${streakDays > 1 ? "s" : ""}</strong>
      cons&eacute;cutifs. Ne le perds pas !
    </p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#D1D5DB;">
      Connecte-toi aujourd&rsquo;hui pour maintenir ta s&eacute;rie et continuer
      &agrave; progresser.
    </p>
    ${ctaButton("Maintenir mon streak", `${APP_URL}/roadmap`)}
    <p style="margin:0;font-size:13px;color:#6B7280;">
      Tu peux d&eacute;sactiver ces rappels dans tes param&egrave;tres.
    </p>
  `);

  return {
    subject: `Ton streak de ${streakDays} jours est en danger`,
    html,
  };
}

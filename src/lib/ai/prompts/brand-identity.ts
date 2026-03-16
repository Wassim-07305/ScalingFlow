export interface BrandNameSuggestion {
  name: string;
  rationale: string;
  disponibilite_probable: string;
  domain_suggestions: string[];
  availability_hint:
    | "probablement disponible"
    | "vérifier"
    | "probablement pris";
  hashtags: string[];
}

export interface BrandIdentityResult {
  noms: BrandNameSuggestion[];
  direction_artistique: {
    palette: { name: string; hex: string; usage: string }[];
    typographies: { role: string; font_family: string; style: string }[];
    style_visuel: string;
    moodboard_description: string;
  };
  logo_concept: {
    description: string;
    forme: string;
    symbolisme: string;
    variations: string[];
  };
  brand_kit: {
    mission: string;
    vision: string;
    valeurs: string[];
    ton: string;
    do_list: string[];
    dont_list: string[];
  };
}

interface BrandIdentityInput {
  marketAnalysis: {
    market_name: string;
    problems: string[];
    positioning: string;
    target_avatar?: unknown;
  };
  offer?: {
    offer_name: string;
    positioning: string;
    unique_mechanism: string;
  };
  categoryOS?: {
    category_name?: string;
    tagline?: string;
    tone_of_voice?: string;
  };
}

export function buildBrandIdentityPrompt(data: BrandIdentityInput): string {
  return `Tu es un directeur artistique et strategiste de marque senior. Tu crees des identites de marque premium pour des entreprises de services et SaaS B2B. Ton style est moderne, epure et premium.

## CONTEXTE

### Marche
- Nom : ${data.marketAnalysis.market_name}
- Problemes : ${data.marketAnalysis.problems.join(", ")}
- Positionnement : ${data.marketAnalysis.positioning}
${data.marketAnalysis.target_avatar ? `- Avatar cible : ${JSON.stringify(data.marketAnalysis.target_avatar)}` : ""}

${
  data.offer
    ? `### Offre
- Nom : ${data.offer.offer_name}
- Positionnement : ${data.offer.positioning}
- Mecanisme unique : ${data.offer.unique_mechanism}`
    : ""
}

${
  data.categoryOS
    ? `### Category OS
${data.categoryOS.category_name ? `- Categorie : ${data.categoryOS.category_name}` : ""}
${data.categoryOS.tagline ? `- Tagline : ${data.categoryOS.tagline}` : ""}
${data.categoryOS.tone_of_voice ? `- Ton de voix : ${data.categoryOS.tone_of_voice}` : ""}`
    : ""
}

## MISSION — IDENTITE DE MARQUE COMPLETE

### 1. NOMS DE MARQUE (10 propositions)
Genere 10 noms de marque uniques et memorisables. Pour chaque nom :
- name : le nom (court, 1-3 mots, facile a prononcer en francais et anglais)
- rationale : pourquoi ce nom est pertinent (etymologie, connotation, phonetique)
- disponibilite_probable : "haute", "moyenne" ou "basse" (estime si le .com / .fr est probablement disponible)
- domain_suggestions : array de 2-3 suggestions de domaines (ex: ["monnom.com", "monnom.fr", "monnom.io"]). Propose des variantes realistes (.com, .fr, .io, .co)
- availability_hint : "probablement disponible", "vérifier" ou "probablement pris" (estime la probabilite que le domaine principal soit libre, base sur la genericite du nom)
- hashtags : array de 3-5 hashtags Instagram/TikTok pertinents pour la marque (ex: ["#MonNom", "#MonNomOfficiel", "#MonNomFrance"])

Styles de noms a explorer : neologisme, fusion de mots, metaphore, acronyme stylise, mot etranger detourne.

### 2. DIRECTION ARTISTIQUE
- palette : 5-6 couleurs avec nom, code hex et usage (primaire, secondaire, accent, fond, texte, alerte)
- typographies : 2-3 polices avec role (titres, corps, code/accent), famille et style
- style_visuel : description du style global (ex: "Minimaliste tech avec touches neon sur fond sombre")
- moodboard_description : description detaillee de l'univers visuel pour briefer un designer

### 3. CONCEPT DE LOGO
- description : description detaillee du concept de logo
- forme : geometrique, organique, lettering, symbole, combinaison
- symbolisme : ce que le logo communique et pourquoi
- variations : 3-4 declinations (monochrome, icone seule, horizontal, vertical)

### 4. BRAND KIT (Charte editoriale)
- mission : la mission de la marque en une phrase
- vision : la vision a long terme en une phrase
- valeurs : 4-5 valeurs fondamentales
- ton : description precise du ton de communication avec exemples
- do_list : 5 regles de communication a TOUJOURS respecter
- dont_list : 5 choses a ne JAMAIS faire dans la communication

## FORMAT JSON
Reponds UNIQUEMENT avec un objet JSON valide contenant les 4 cles : noms, direction_artistique, logo_concept, brand_kit. Pas de markdown, pas de texte autour.`;
}

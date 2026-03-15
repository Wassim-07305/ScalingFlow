export interface CategoryOSResult {
  new_game: {
    category_name: string;
    why_new: string;
    positioning_statement: string;
  };
  ennemi: {
    enemy_name: string;
    description: string;
    why_harmful: string;
    contrast_with_us: string;
  };
  truth_bombs: {
    bombs: { statement: string; explanation: string; impact: string }[];
  };
  modele_tangible: {
    framework_name: string;
    steps: { name: string; description: string }[];
    visual_description: string;
  };
  identite: {
    brand_headlines: string[];
    tagline: string;
    value_proposition: string;
    tone_of_voice: string;
  };
  differentiation_scoring: {
    alternatives: {
      name: string;
      type: "concurrent_direct" | "concurrent_indirect" | "substitut" | "statu_quo";
      score_differenciation: number;
      forces: string[];
      faiblesses: string[];
      notre_avantage: string;
    }[];
    score_global: number;
    verdict: string;
  };
}

interface CategoryOSInput {
  marketAnalysis: {
    market_name: string;
    problems: string[];
    positioning: string;
    competitors?: unknown;
    target_avatar?: unknown;
  };
  offer?: {
    offer_name: string;
    positioning: string;
    unique_mechanism: string;
  };
  vaultData?: {
    skills?: string[];
    expertise?: unknown;
  };
}

export function buildCategoryOSPrompt(data: CategoryOSInput): string {
  return `Tu es un expert en positionnement de marque et en strategie de categorie, inspire par le "Category Design" de Play Bigger et le "Category of One" de Kevin Harrington. Tu maitrises le systeme Category OS en 5 etapes.

## CONTEXTE

### Marche
- Nom : ${data.marketAnalysis.market_name}
- Problemes : ${data.marketAnalysis.problems.join(", ")}
- Positionnement actuel : ${data.marketAnalysis.positioning}
${data.marketAnalysis.competitors ? `- Concurrents : ${JSON.stringify(data.marketAnalysis.competitors)}` : ""}
${data.marketAnalysis.target_avatar ? `- Avatar cible : ${JSON.stringify(data.marketAnalysis.target_avatar)}` : ""}

${data.offer ? `### Offre existante
- Nom : ${data.offer.offer_name}
- Positionnement : ${data.offer.positioning}
- Mecanisme unique : ${data.offer.unique_mechanism}` : ""}

${data.vaultData?.skills ? `### Competences
${data.vaultData.skills.join(", ")}` : ""}

## MISSION — CATEGORY OS (5 etapes)

### Etape 1 — NEW GAME (Nouvelle categorie)
Cree une nouvelle categorie de marche. Ne te positionne PAS dans une categorie existante. Invente un jeu ou tu es le seul joueur. Exemples : Salesforce a cree le "Cloud CRM", HubSpot le "Inbound Marketing".
- category_name : nom accrocheur et memorisable de la nouvelle categorie
- why_new : pourquoi cette categorie n'existait pas avant et pourquoi c'est le bon moment
- positioning_statement : declaration de positionnement en une phrase percutante

### Etape 2 — ENNEMI (L'ennemi commun)
Identifie l'ennemi commun — pas un concurrent, mais une MENTALITE, un SYSTEME, ou une PRATIQUE obsolete que ton audience deteste deja.
- enemy_name : nom court et evocateur de l'ennemi
- description : ce qu'est cet ennemi
- why_harmful : pourquoi il nuit a ton audience
- contrast_with_us : comment ton approche est l'exact oppose

### Etape 3 — TRUTH BOMBS (Verites derangeantes)
Genere 5 "truth bombs" — des verites que l'industrie refuse de dire mais que ton audience ressent. Ce sont des phrases choc qui etablissent l'autorite et brisent les croyances limitantes.
- statement : la verite crue en une phrase
- explanation : pourquoi c'est vrai (avec logique implacable)
- impact : l'impact sur l'audience quand elle realise cette verite

### Etape 4 — MODELE TANGIBLE (Framework proprietaire)
Cree un framework proprietaire en 3 a 5 etapes avec un nom accrocheur. C'est TON systeme, TA methodologie. Exemples : "La Methode SCALE", "Le Protocole 4D".
- framework_name : nom du framework
- steps : chaque etape avec nom et description
- visual_description : description de comment visualiser ce framework (diagramme, pyramide, cercle, etc.)

### Etape 5 — IDENTITE (Voix de marque)
Definis l'identite verbale de la marque dans cette nouvelle categorie.
- brand_headlines : 5 headlines percutantes qui pourraient etre des titres de landing page ou posts LinkedIn
- tagline : slogan de marque en une phrase
- value_proposition : proposition de valeur claire et differenciante
- tone_of_voice : description du ton de communication (ex: "Direct, sans BS, avec une touche d'humour provocateur")

### Etape 6 — DIFFERENTIATION SCORING (Analyse des alternatives)
Evalue ta nouvelle categorie CONTRE les alternatives existantes. Pour chaque alternative (4-6 minimum) :
- name : nom de l'alternative (concurrent direct, indirect, substitut, ou statu quo)
- type : "concurrent_direct" | "concurrent_indirect" | "substitut" | "statu_quo"
- score_differenciation : score de 1 a 10 (10 = tu es radicalement different)
- forces : 2-3 forces de cette alternative
- faiblesses : 2-3 faiblesses exploitables
- notre_avantage : pourquoi ton Category OS est superieur sur ce point

Calcule un score_global de differenciation (moyenne ponderee) et donne un verdict clair.

## FORMAT JSON
Reponds UNIQUEMENT avec un objet JSON valide contenant les 6 cles : new_game, ennemi, truth_bombs, modele_tangible, identite, differentiation_scoring. Pas de markdown, pas de texte autour.`;
}

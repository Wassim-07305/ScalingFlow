# Historique Cliquable + Fonctionnalités Manquantes — Plan d'Implémentation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rendre TOUTES les générations IA consultables via l'historique (clic → vue détail), ajouter l'historique aux pages qui n'en ont pas (Sales, Brand), et combler les fonctionnalités manquantes du cahier des charges (Vault, Export PDF).

**Architecture:** Le pattern existe déjà sur la page Assets : `loadedData` state + `handleHistorySelect` qui fetch le record complet → parse `ai_raw_response` → switch de tab + pré-remplissage via `initialData` prop. On réplique ce pattern sur les 5 autres pages (Offer, Funnel, Ads, Content) et on l'ajoute aux 2 pages qui n'ont pas d'historique (Sales, Brand).

**Tech Stack:** Next.js 16 App Router, Supabase client, React state, existing `GenerationHistory` component, `jspdf` + `jspdf-autotable` pour l'export PDF.

---

## Groupe A — Historique Cliquable (pages existantes)

Ces 4 tâches sont **indépendantes** et peuvent être exécutées en parallèle.

---

### Task A1: Offer — Historique Cliquable

**Files:**
- Modify: `src/app/(dashboard)/offer/page.tsx`
- Modify: `src/components/offer/offer-generator.tsx` (ajouter `initialData` prop)

**Step 1: Modifier OfferGenerator pour accepter `initialData`**

Dans `offer-generator.tsx`, ajouter une prop `initialData` optionnelle. Si elle est fournie, pré-remplir le résultat affiché (l'offre générée) au lieu de l'état vide.

```tsx
interface OfferGeneratorProps {
  marketAnalysisId?: string;
  marketName?: string;
  initialData?: any; // ai_raw_response parsed
}
```

Quand `initialData` change, mettre à jour le state interne du résultat :
```tsx
React.useEffect(() => {
  if (initialData) {
    setResult(initialData);
  }
}, [initialData]);
```

**Step 2: Modifier la page Offer pour ajouter `handleHistorySelect`**

Dans `offer/page.tsx` :

1. Ajouter `loadedData` state :
```tsx
const [loadedData, setLoadedData] = React.useState<any>(null);
```

2. Ajouter `handleHistorySelect` (même pattern que Assets) :
```tsx
const handleHistorySelect = async (item: { id: string }) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("offers")
      .select("ai_raw_response, offer_name, positioning, unique_mechanism, pricing_strategy, guarantees, risk_reversal, delivery_structure, oto_offer, full_document")
      .eq("id", item.id)
      .single();
    if (error || !data) {
      toast.error("Impossible de charger cette offre");
      return;
    }
    const parsed = data.ai_raw_response || data;
    setLoadedData(parsed);
    setActiveTab("generate");
    toast.success("Offre chargée depuis l'historique");
  } catch {
    toast.error("Erreur lors du chargement");
  }
};
```

3. Passer `onSelect` à `GenerationHistory` et `initialData` à `OfferGenerator` :
```tsx
{activeTab === "generate" && (
  <OfferGenerator
    marketAnalysisId={marketAnalysisId || undefined}
    marketName={marketName || undefined}
    initialData={loadedData}
  />
)}
{activeTab === "history" && (
  <GenerationHistory
    table="offers"
    titleField="offer_name"
    subtitleField="positioning"
    statusField="status"
    emptyMessage="Aucune offre generee pour le moment."
    onSelect={handleHistorySelect}
  />
)}
```

4. Ajouter imports : `toast` from `sonner`

---

### Task A2: Funnel — Historique Cliquable

**Files:**
- Modify: `src/app/(dashboard)/funnel/page.tsx`
- Modify: `src/components/funnel/funnel-builder.tsx` (ajouter `initialData` prop)

**Step 1: Modifier FunnelBuilder pour accepter `initialData`**

Ajouter prop `initialData?: any` qui pré-remplit les données du funnel (optin_page, vsl_page, thankyou_page).

```tsx
React.useEffect(() => {
  if (initialData) {
    setResult(initialData);
  }
}, [initialData]);
```

**Step 2: Modifier la page Funnel**

Même pattern que Offer :
- `loadedData` state
- `handleHistorySelect` qui fetch depuis `funnels` table (select `ai_raw_response, optin_page, vsl_page, thankyou_page`)
- Passer `onSelect` à `GenerationHistory` et `initialData` à `FunnelBuilder`
- Ajouter imports : `createClient`, `toast`, `useUser` (si pas déjà)

---

### Task A3: Ads — Historique Cliquable

**Files:**
- Modify: `src/app/(dashboard)/ads/page.tsx`
- Modify: `src/components/ads/creative-generator.tsx` (ajouter `initialData`)
- Modify: `src/components/ads/video-ad-generator.tsx` (ajouter `initialData`)
- Modify: `src/components/ads/dm-script-generator.tsx` (ajouter `initialData`)

**Step 1: Modifier les 3 générateurs pour accepter `initialData`**

Chaque générateur reçoit `initialData?: any` et pré-remplit son résultat.

**Step 2: Modifier la page Ads**

Le `handleHistorySelect` doit déterminer le type de créatif et switch sur le bon tab :
```tsx
const handleHistorySelect = async (item: { id: string }) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ad_creatives")
    .select("creative_type, ai_raw_response, ad_copy, headline, hook, cta, video_script, angle")
    .eq("id", item.id)
    .single();
  if (error || !data) { toast.error("Impossible de charger"); return; }

  const parsed = data.ai_raw_response || data;
  const typeMap: Record<string, string> = {
    image: "creatives",
    carousel: "creatives",
    video_script: "video_ads",
  };
  const tabKey = typeMap[data.creative_type] || "creatives";
  setLoadedData(prev => ({ ...prev, [tabKey]: parsed }));
  setActiveTab(tabKey);
  toast.success("Creative chargée depuis l'historique");
};
```

Note: `loadedData` doit être un `Record<string, any>` ici (comme Assets) car il y a plusieurs tabs.

---

### Task A4: Content — Historique Cliquable

**Files:**
- Modify: `src/app/(dashboard)/content/page.tsx`
- Modify: `src/components/content/strategy-overview.tsx` (ajouter `initialData`)
- Modify: `src/components/content/reels-generator.tsx` (ajouter `initialData`)
- Modify: `src/components/content/youtube-generator.tsx` (ajouter `initialData`)
- Modify: `src/components/content/stories-generator.tsx` (ajouter `initialData`)
- Modify: `src/components/content/carousel-generator.tsx` (ajouter `initialData`)
- Modify: `src/components/content/instagram-optimizer.tsx` (ajouter `initialData`)
- Modify: `src/components/content/editorial-calendar.tsx` (ajouter `initialData`)

**Step 1: Modifier les 7 générateurs pour accepter `initialData`**

**Step 2: Modifier la page Content**

Le `handleHistorySelect` mappe `content_type` au bon tab :
```tsx
const CONTENT_TYPE_TO_TAB: Record<string, string> = {
  instagram_reel: "reels",
  instagram_story: "stories",
  instagram_carousel: "carousels",
  instagram_post: "instagram",
  youtube_video: "youtube",
  youtube_short: "youtube",
  linkedin_post: "strategy",
  tiktok_video: "reels",
  blog_post: "editorial",
};
```

---

## Groupe B — Ajouter l'Historique (pages sans)

Ces 2 tâches sont **indépendantes** et peuvent être exécutées en parallèle (aussi parallèles avec Groupe A).

---

### Task B1: Sales — Ajouter onglet Historique

**Files:**
- Modify: `src/app/(dashboard)/sales/page.tsx` (refactoring complet)

**Step 1: Refactorer la page Sales**

Transformer la page en système d'onglets standard (comme les autres) avec un onglet Historique :

```tsx
const TABS = [
  { key: "discovery", label: "Appel Découverte", icon: Phone },
  { key: "closing", label: "Script de Closing", icon: FileText },
  { key: "history", label: "Historique", icon: History },
] as const;
```

**Step 2: Ajouter `handleHistorySelect`**

La page Sales utilise la table `sales_assets` avec `asset_type = 'sales_script'`. Le `handleHistorySelect` :
```tsx
const handleHistorySelect = async (item: { id: string }) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sales_assets")
    .select("asset_type, ai_raw_response, content, metadata")
    .eq("id", item.id)
    .single();
  if (error || !data) { toast.error("Impossible de charger"); return; }

  const metadata = data.metadata as { scriptType?: string } | null;
  const scriptType = metadata?.scriptType || "discovery";
  setActiveType(scriptType);
  setScript(data.ai_raw_response || data.content);
  setActiveTab(scriptType);
  toast.success("Script chargé depuis l'historique");
};
```

Le GenerationHistory filtre sur `asset_type`:
```tsx
<GenerationHistory
  table="sales_assets"
  titleField="title"
  subtitleField="asset_type"
  statusField="status"
  emptyMessage="Aucun script de vente généré pour le moment."
  onSelect={handleHistorySelect}
/>
```

Note: Il faut ajouter un filtre custom ou modifier `GenerationHistory` pour filtrer par `asset_type = 'sales_script'`. Alternative : ajouter une prop `filters` au composant `GenerationHistory`.

**Step 3: Ajouter `filters` prop à GenerationHistory**

Modifier `src/components/shared/generation-history.tsx` pour accepter des filtres supplémentaires :

```tsx
interface GenerationHistoryProps {
  // ... existing props
  filters?: Record<string, string>; // { asset_type: "sales_script" }
}
```

Dans le fetch :
```tsx
let query = supabase.from(table).select(fields).eq("user_id", user.id);
if (filters) {
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
}
const { data, error } = await query.order("created_at", { ascending: false }).limit(20);
```

---

### Task B2: Brand — Ajouter onglet Historique

**Files:**
- Modify: `src/app/(dashboard)/brand/page.tsx`

**Step 1: Ajouter l'onglet Historique au système de tabs**

```tsx
const TABS = [
  { key: "nom", label: "Nom", icon: Type },
  { key: "direction", label: "Direction Artistique", icon: Palette },
  { key: "logo", label: "Logo", icon: Hexagon },
  { key: "kit", label: "Kit de Marque", icon: BookOpen },
  { key: "history", label: "Historique", icon: History },
] as const;
```

**Step 2: Ajouter `handleHistorySelect`**

```tsx
const handleHistorySelect = async (item: { id: string }) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("brand_identities")
    .select("*")
    .eq("id", item.id)
    .single();
  if (error || !data) { toast.error("Impossible de charger"); return; }

  // Reconstruct BrandIdentityResult from DB record (same logic as fetchBrand)
  setBrandId(data.id);
  setSelectedName(data.selected_name);
  setOfferId(data.offer_id);

  const brandNames = data.brand_names as unknown as BrandIdentityResult["noms"] | null;
  const artDirection = data.art_direction as unknown as BrandIdentityResult["direction_artistique"] | null;
  let logoConcept = null;
  try { logoConcept = data.logo_concept ? (typeof data.logo_concept === "string" ? JSON.parse(data.logo_concept) : data.logo_concept) : null; } catch {}
  const brandKit = data.brand_kit as unknown as BrandIdentityResult["brand_kit"] | null;

  setGenerated({
    noms: brandNames || [],
    direction_artistique: artDirection || { palette: [], typographies: [], style_visuel: "", moodboard_description: "" },
    logo_concept: logoConcept || { description: "", forme: "", symbolisme: "", variations: [] },
    brand_kit: brandKit || { mission: "", vision: "", valeurs: [], ton: "", do_list: [], dont_list: [] },
  });

  setActiveTab("nom");
  toast.success("Identité de marque chargée depuis l'historique");
};
```

**Step 3: Rendre le History tab**

```tsx
{activeTab === "history" && (
  <GenerationHistory
    table="brand_identities"
    titleField="selected_name"
    statusField="status"
    emptyMessage="Aucune identité de marque générée pour le moment."
    onSelect={handleHistorySelect}
  />
)}
```

---

## Groupe C — Prop `filters` sur GenerationHistory

Cette tâche est un prérequis pour B1 (Sales).

### Task C1: Ajouter prop `filters` à GenerationHistory

**Files:**
- Modify: `src/components/shared/generation-history.tsx`

Ajouter la prop optionnelle `filters?: Record<string, string>` et appliquer les filtres dans la query Supabase. Voir détail dans Task B1 Step 3.

---

## Groupe D — Export PDF

### Task D1: Installer jspdf + créer helper d'export

**Files:**
- Create: `src/lib/utils/export-pdf.ts`

**Step 1: Installer la dépendance**
```bash
npm install jspdf jspdf-autotable
```

**Step 2: Créer le helper**

```tsx
import jsPDF from "jspdf";
import "jspdf-autotable";

interface ExportPDFOptions {
  title: string;
  subtitle?: string;
  content: string | Record<string, any>;
  filename?: string;
}

export function exportToPDF({ title, subtitle, content, filename }: ExportPDFOptions) {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, y);
  y += 10;

  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(subtitle, margin, y);
    y += 10;
  }

  // Separator
  doc.setDrawColor(200);
  doc.line(margin, y, 190, y);
  y += 10;

  // Content
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);

  const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);
  const lines = doc.splitTextToSize(text, 170);

  for (const line of lines) {
    if (y > 280) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 6;
  }

  // Footer
  const date = new Date().toLocaleDateString("fr-FR");
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Généré par ScalingFlow — ${date}`, margin, 290);

  doc.save(filename || `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
```

### Task D2: Ajouter bouton Export PDF au composant GenerationHistory

**Files:**
- Modify: `src/components/shared/generation-history.tsx`

Ajouter un bouton "Exporter PDF" sur chaque item de l'historique (ou un bouton global "Exporter tout").

Alternative plus simple : ajouter un bouton PDF dans les pages de détail (quand on affiche un résultat). Chaque page de résultat aura un bouton `<Button onClick={() => exportToPDF({...})}>`.

### Task D3: Ajouter boutons Export PDF aux pages générateurs

**Files:** Tous les générateurs qui affichent un résultat :
- `src/components/offer/offer-generator.tsx`
- `src/components/funnel/funnel-builder.tsx`
- `src/components/ads/creative-generator.tsx`
- `src/components/assets/vsl-generator.tsx` (et les autres assets)
- `src/components/content/reels-generator.tsx` (et les autres content)
- `src/app/(dashboard)/sales/page.tsx`
- `src/app/(dashboard)/brand/page.tsx`

Pattern : à côté du bouton "Copier" existant, ajouter un bouton "PDF" :
```tsx
import { exportToPDF } from "@/lib/utils/export-pdf";
import { FileDown } from "lucide-react";

<Button variant="outline" size="sm" onClick={() => exportToPDF({
  title: "Mon Offre",
  content: result,
})}>
  <FileDown className="h-4 w-4 mr-1" />
  PDF
</Button>
```

---

## Groupe E — Page Vault

### Task E1: Créer la page Vault

**Files:**
- Create: `src/app/(dashboard)/vault/page.tsx`
- Modify: `src/lib/constants/navigation.ts` (ajouter item Vault)

**Step 1: Créer la page**

La page Vault affiche les données collectées pendant l'onboarding et permet de les modifier. Elle affiche aussi l'analyse IA du vault (`vault_analysis`).

Sections :
1. **Compétences** — skills[], vault_skills (éditable)
2. **Situation** — situation, situation_details (éditable)
3. **Formations** — formations[] (éditable)
4. **Objectifs** — target_revenue, objectives[], industries[] (éditable)
5. **Analyse IA** — vault_analysis (lecture seule, bouton régénérer)
6. **Ressources** — vault_resources (upload + liste)

Utiliser des Cards éditables avec mode lecture/édition.

**Step 2: Ajouter la navigation**

Dans `navigation.ts`, ajouter :
```tsx
{ label: "Vault", href: "/vault", icon: Archive, roles: ["user", "student", "admin", "coach"] },
```

L'ajouter dans la section "Business" des `NAV_SECTIONS`.

---

## Résumé des dépendances

```
C1 ──→ B1 (Sales a besoin de filters)

A1, A2, A3, A4 sont indépendants
B1, B2 sont indépendants (B1 dépend de C1)
D1 ──→ D2 ──→ D3
E1 est indépendant

Ordre optimal :
  Parallèle 1: C1 + A1 + A2 + A3 + A4 + B2 + D1 + E1
  Parallèle 2: B1 (après C1) + D2 (après D1)
  Parallèle 3: D3 (après D2)
```

## Exécution recommandée

**Subagent-Driven** — Dispatcher 4+ agents en parallèle :
- Agent 1: C1 (filters) → B1 (Sales)
- Agent 2: A1 (Offer) + A2 (Funnel)
- Agent 3: A3 (Ads) + A4 (Content)
- Agent 4: B2 (Brand) + E1 (Vault)
- Agent 5: D1 → D2 → D3 (Export PDF)

Puis vérification build + déploiement.

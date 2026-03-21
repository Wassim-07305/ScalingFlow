# ScalingFlow — Checklist de Test Manuel

> Parcours chaque section avec un compte test. Coche chaque item après test.
> Si un bug est trouvé, note-le dans la colonne "Bug".

---

## 1. ONBOARDING & AUTH

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 1.1 | Créer un nouveau compte (register) | Redirection vers /onboarding |OK |
| 1.2 | Compléter les 11 étapes d'onboarding | Redirection vers le dashboard | OK|
| 1.3 | Se déconnecter | Retour sur /login |OK |
| 1.4 | Se reconnecter | Dashboard avec données conservées |OK |
| 1.5 | Mot de passe oublié | Email reçu, reset fonctionne |OK |
| 1.6 | Accéder à /market sans être connecté | Redirection vers /login | OK| 

---

## 2. VAULT & RESSOURCES

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 2.1 | /vault — cliquer "Analyser mes compétences" | Génération IA, skill map affichée | ok|
| 2.2 | /vault — onglet "Extraction" → lancer extraction | Résultat IA avec frameworks/méthodes | | je ne vois pas ?
| 2.3 | /vault — onglet "Avantage concurrentiel" → générer | Résultat affiché | | je vois pas ?
| 2.4 | /vault — onglet "Ressources" → uploader un fichier | Fichier visible dans la liste |ok |
| 2.5 | /vault — supprimer un fichier uploadé | Fichier disparaît | ok |
| 2.6 | /vault — onglet "Documents" → uploader un document | Document visible | ok |

---

## 3. RECHERCHE MARCHÉ

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 3.1 | /market — lancer "Analyser un marché" | Résultat avec scoring, segments, opportunités | ok|
| 3.2 | /market — onglet "Persona" → générer | ICP 4 niveaux affiché | ok|
| 3.3 | /market — onglet "Schwartz" → analyser | Niveaux de sophistication affichés |ok |
| 3.4 | /market — onglet "Concurrence" → analyser | Grille concurrentielle affichée | ok|
| 3.5 | /market — onglet "Insights" → scraper | Résultats (IA ou Apify si configuré) | ok|
| 3.6 | /market — onglet "Audit" → lancer audit | Score /100 + plan 90 jours |ok |

---

## 4. CRÉATION D'OFFRE

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 4.1 | /offer — générer une offre complète | Offre avec promesse, stack, pricing |ok |
| 4.2 | /offer — onglet "Positionnement" → Category OS | Résultat affiché |ok |
| 4.3 | /offer — onglet "Mécanisme" → générer | 3 mécanismes avec scoring | ok|
| 4.4 | /offer — onglet "Garantie" → générer | 4 types de garanties |ok |
| 4.5 | /offer — onglet "Delivery" → générer | Structure de livraison |ok |
| 4.6 | /offer — onglet "Score" → scorer l'offre | Score /100 avec dimensions | ok|
| 4.7 | /offer — onglet "OTO" → générer | Offre OTO générée ok |
| 4.8 | /offer — onglet "Pricing" → calculer | 3 tiers avec marges |ok |

---

## 5. IDENTITÉ DE MARQUE

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 5.1 | /brand — générer une identité de marque | Palette, typos, tone of voice |ok |
| 5.2 | /brand — onglet "Nom" → générer | Propositions de noms |ok |
| 5.3 | /brand — onglet "Logo" → générer | Logo via Replicate (si configuré) |ok |
| 5.4 | /brand — onglet "Kit" → exporter | Export HTML/PDF du brand kit |ok |

---

## 6. FUNNEL

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 6.1 | /funnel — générer un funnel | Pages générées avec preview | ok|
| 6.2 | /funnel — preview desktop/mobile | Basculement fonctionne | ok|
| 6.3 | /funnel — générer script VSL | Script 7 étapes |ok |
| 6.4 | /funnel — générer OTO | Page OTO générée | ok|
| 6.5 | /funnel — publier le funnel | URL /f/[slug] accessible publiquement |ok |
| 6.6 | /funnel — A/B test manager | Création test, tracking, winner détecté | |

---

## 7. CONTENU

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 7.1 | /content — générer un post social | Post avec hook, corps, hashtags |ok |
| 7.2 | /content — générer un Reel | Script avec structure |ok |
| 7.3 | /content — générer un carousel | Slides générées |ok |
| 7.4 | /content — générer des Stories | Stories avec structure | ok|
| 7.5 | /content — générer YouTube | Script YouTube | ok|
| 7.6 | /content — calendrier éditorial → générer | Calendrier avec dates et types | ok|
| 7.7 | /content — batch hebdomadaire → générer 5 contenus | 5 contenus générés et sauvegardés ok| |
| 7.8 | /content — publier sur LinkedIn (si connecté) | Post publié sur LinkedIn | ok|

---

## 8. PUBLICITÉS (ADS)

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 8.1 | /ads — onglet "Creatives" → générer | 3+ variations avec hooks/copy/CTA | ok|
| 8.2 | /ads — onglet "Images IA" → générer | Images générées (Replicate) |ok |
| 8.3 | /ads — images générées restent visibles après refresh | URLs permanentes (Supabase Storage) |ok |
| 8.4 | /ads — onglet "Score Ads" → scorer | Score /100 avec dimensions (même sans data) | ok|
| 8.5 | /ads — onglet "Campagnes" → synchroniser Meta | Campagnes importées depuis Meta | ok|
| 8.6 | /ads — bouton "Analytics" → page analytics | KPIs et graphiques affichés |ok |
| 8.7 | /ads — onglet "Scripts DM" → générer | Scripts avec opener/follow-ups | ok|
| 8.8 | /ads — onglet "Pubs Vidéo" → générer | Scripts vidéo 15s/30s/60s |ok |
| 8.9 | /ads — onglet "Historique" → cliquer un item | Données restaurées dans le bon onglet | ok|

---

## 9. SALES & PROSPECTION

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 9.1 | /sales — générer script de vente | Script discovery + closing | ok|
| 9.2 | /sales — analyser un call (upload audio/texte) | Analyse avec scoring | ok|
| 9.3 | /prospection — messagerie unifiée | Conversations LinkedIn affichées avec noms |ok |
| 9.4 | /prospection — envoyer un message LinkedIn | Message envoyé via Unipile | ok|
| 9.5 | /pipeline — voir le board | Colonnes avec leads |ok |
| 9.6 | /clients — voir la liste | Liste clients ou empty state |ok |

---

## 10. ASSETS

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 10.1 | /assets — générer un pitch deck | Pitch deck structuré | ok|
| 10.2 | /assets — générer une sales letter | Lettre de vente |ok |
| 10.3 | /assets — générer une séquence email | Emails nurturing |ok |
| 10.4 | /assets — générer une séquence SMS | SMS séquencés |ok |
| 10.5 | /assets — générer un lead magnet | Lead magnet structuré |ok |
| 10.6 | /assets — générer une étude de cas | Case study | ok|

---

## 11. INTÉGRATIONS

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 11.1 | /settings → Intégrations → Connecter Meta | OAuth Meta réussit, retour settings |ok |
| 11.2 | /settings → Intégrations → Connecter LinkedIn | OAuth LinkedIn réussit ok| |
| 11.3 | /settings → Intégrations → Connecter Google Calendar | OAuth Google réussit, events affichés |ok |
| 11.4 | /settings → Intégrations → Stripe Connect | Redirection Stripe, retour settings |ok |
| 11.5 | /launch → Pixel/CAPI → Pixel ID auto-récupéré | Pixel ID affiché (pas l'ad account ID) | ok|
| 11.6 | /launch → Tester le pixel | Test passe sans erreur |ok |

---

## 12. STRIPE & ABONNEMENT

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 12.1 | /welcome → cliquer "S'abonner Scale" | Redirection Checkout Stripe |ok |
| 12.2 | Payer avec carte test (4242...) | Retour app, plan mis à jour |ok |
| 12.3 | /settings → Abonnement → voir le plan actuel | Plan Scale affiché avec quota |ok |
| 12.4 | /settings → Gérer l'abonnement | Portail Stripe ouvert |ok |
| 12.5 | Dashboard → barre de quota | X/500 générations affiché | ok|

---

## 13. WHITELABEL

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 13.1 | /settings → Whitelabel → créer une organisation | Org créée, branding affiché | ok|
| 13.2 | Uploader un logo | Logo visible dans la sidebar |ok |
| 13.3 | Changer les couleurs | Couleurs appliquées dans l'app |ok |
| 13.4 | Ajouter un membre par email | Membre ajouté avec nom/email | ok|
| 13.5 | Désactiver une section (ex: "ads") | Section disparaît de la sidebar du membre | ok|
| 13.6 | Membre → taper /ads dans l'URL | Redirection vers / avec toast d'erreur |ok |
| 13.7 | /portal → vue portail membre | Dashboard avec données de l'owner |ok |

---

## 14. AFFILIATE

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 14.1 | /affiliate → rejoindre le programme | Inscription réussie, code généré | ok|
| 14.2 | Lien de referral affiché | URL avec le bon domaine (pas localhost) |ok |
| 14.3 | Copier le lien | Copié dans le presse-papier |ok |
| 14.4 | /admin → "Gérer les affiliés" | Page admin affiliés accessible |ok |

---

## 15. GAMIFICATION & COMMUNAUTÉ

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 15.1 | Dashboard → XP et niveau affichés | Badge avec XP correct |ok |
| 15.2 | /leaderboard → classement | Ranking des users | ok|
| 15.3 | /community → poster un message | Post visible dans le feed |ok |
| 15.4 | /community → onglets fonctionnels | Navigation entre onglets sans bug |ok |
| 15.5 | /progress → progression affichée | Badges, XP, streak |ok |

---

## 16. ACADEMY & ROADMAP

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 16.1 | /academy → voir les modules | Liste des modules avec vidéos | ok|
| 16.2 | /academy → lire une vidéo Loom | Vidéo s'affiche dans le player | ok|
| 16.3 | /academy → quiz après module | Quiz IA, scoring, XP gagné |ok |
| 16.4 | /roadmap → plan quotidien | Actions du jour avec XP | ok|
| 16.5 | /roadmap → milestones | Timeline avec progression |ok |
| 16.6 | /calendar → Google Calendar (si connecté) | Events affichés |ok|

---

## 17. ADMIN

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 17.1 | /admin → stats globales | Users, XP, plans, activité |ok |
| 17.2 | /admin → "Monitoring IA" | Coûts, générations, top consumers |ok |
| 17.3 | /admin → monitoring → coûts réels affichés | Pas de $0.00 sur les nouvelles générations |ok |
| 17.4 | /admin → "Gérer les affiliés" | Page admin affiliés |ok |
| 17.5 | /admin/academy → gérer les vidéos | CRUD vidéos/modules | ok|
| 17.6 | /settings → onglet admin visible | Lien vers /admin dans la sidebar |ok |

---

## 18. DRIVE & ASSISTANT

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 18.1 | /drive → créer un dossier | Dossier créé (pas d'erreur RLS) | ok|
| 18.2 | /drive → uploader un fichier | Fichier visible, nom pas coupé | ok|
| 18.3 | /assistant → sélectionner un agent | Chat avec l'agent sélectionné | ok|
| 18.4 | /assistant → envoyer un message | Réponse IA reçue |ok |
| 18.5 | /assistant → historique conversations | Conversations précédentes listées |ok |

---

## 19. ANALYTICS & CROISSANCE

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 19.1 | /analytics → dashboard performance | KPIs et graphiques | |
| 19.2 | /analytics → attribution multi-touch | Modèles d'attribution, texte en français | ok|
| 19.3 | /growth → recommandations IA | Recommandations générées |ok |
| 19.4 | /growth → paliers de croissance | Palier actuel avec progression |ok |

---

## 20. VÉRIFICATIONS TRANSVERSALES

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 20.1 | Ouvrir la console navigateur sur chaque page | Pas d'erreur 400/403/500 | ok|
chrome-extension://j…ntent_reporter.js:1 Uncaught SyntaxError: Unexpected token 'export'
4bd1b696-e5d7c65570c947b7.js:1 Allow attribute will take precedence over 'allowfullscreen'.
nu @ 4bd1b696-e5d7c65570c947b7.js:1
25585-fe66f6dabe3ab9f9.js:1 The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
n @ 5585-fe66f6dabe3ab9f9.js:1
mgagpfexswovfzydlqgm.supabase.co/rest/v1/ad_campaigns?select=impressions%2Cclicks%2Cdaily_budget&user_id=eq.dcb9a382-612d-4f15-a025-7cb9fd13a8ed:1  Failed to load resource: the server responded with a status of 400 ()
mgagpfexswovfzydlqgm.supabase.co/rest/v1/sales_call_logs?select=id%2Ccall_result&user_id=eq.dcb9a382-612d-4f15-a025-7cb9fd13a8ed:1  Failed to load resource: the server responded with a status of 400 ()
analytics:1 The resource https://scalingflow.vercel.app/_next/static/css/3955275bcdc67da5.css was preloaded using link preload but not used within a few seconds from the window's load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally.
25585-fe66f6dabe3ab9f9.js:1 The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
n @ 5585-fe66f6dabe3ab9f9.js:1
(anonymous) @ 5585-fe66f6dabe3ab9f9.js:1
ak @ 4bd1b696-e5d7c65570c947b7.js:1
oQ @ 4bd1b696-e5d7c65570c947b7.js:1
is @ 4bd1b696-e5d7c65570c947b7.js:1
sp @ 4bd1b696-e5d7c65570c947b7.js:1
(anonymous) @ 4bd1b696-e5d7c65570c947b7.js:1
sd @ 4bd1b696-e5d7c65570c947b7.js:1
sn @ 4bd1b696-e5d7c65570c947b7.js:1
sQ @ 4bd1b696-e5d7c65570c947b7.js:1
A @ 8928-5b4c8886e6a629a6.js:1
launch:1 The resource https://scalingflow.vercel.app/_next/static/css/3955275bcdc67da5.css was preloaded using link preload but not used within a few seconds from the window's load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally.
25585-fe66f6dabe3ab9f9.js:1 The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
n @ 5585-fe66f6dabe3ab9f9.js:1
(anonymous) @ 5585-fe66f6dabe3ab9f9.js:1
ak @ 4bd1b696-e5d7c65570c947b7.js:1
oQ @ 4bd1b696-e5d7c65570c947b7.js:1
is @ 4bd1b696-e5d7c65570c947b7.js:1
sp @ 4bd1b696-e5d7c65570c947b7.js:1
(anonymous) @ 4bd1b696-e5d7c65570c947b7.js:1
sd @ 4bd1b696-e5d7c65570c947b7.js:1
sn @ 4bd1b696-e5d7c65570c947b7.js:1
sQ @ 4bd1b696-e5d7c65570c947b7.js:1
A @ 8928-5b4c8886e6a629a6.js:1
page-011d450eb1ed7261.js:1  GET https://scalingflow.vercel.app/api/integrations/google-calendar/events 404 (Not Found)
(anonymous) @ page-011d450eb1ed7261.js:1
(anonymous) @ page-011d450eb1ed7261.js:1
iy @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
e @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
up @ 4bd1b696-e5d7c65570c947b7.js:1
um @ 4bd1b696-e5d7c65570c947b7.js:1
sC @ 4bd1b696-e5d7c65570c947b7.js:1
(anonymous) @ 4bd1b696-e5d7c65570c947b7.js:1
A @ 8928-5b4c8886e6a629a6.js:1
settings:1 The resource https://scalingflow.vercel.app/_next/static/css/3955275bcdc67da5.css was preloaded using link preload but not used within a few seconds from the window's load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally.
| 20.2 | Vérifier le monitoring IA après générations | Tokens et coûts enregistrés |ok |
| 20.3 | Tester sur mobile (responsive) | Layout correct, sidebar collapse | ok|
| 20.4 | Vérifier que toutes les pages sont dans la sidebar | Aucune page orpheline | ok|
| 20.5 | Générer 5+ contenus IA → vérifier quota | Barre de progression mise à jour |ok |

# ScalingFlow — Checklist de Test Manuel

> Parcours chaque section avec un compte test. Coche chaque item après test.
> Si un bug est trouvé, note-le dans la colonne "Bug".

---

## 1. ONBOARDING & AUTH

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 1.1 | Créer un nouveau compte (register) | Redirection vers /onboarding | |
| 1.2 | Compléter les 11 étapes d'onboarding | Redirection vers le dashboard | |
| 1.3 | Se déconnecter | Retour sur /login | |
| 1.4 | Se reconnecter | Dashboard avec données conservées | |
| 1.5 | Mot de passe oublié | Email reçu, reset fonctionne | |
| 1.6 | Accéder à /market sans être connecté | Redirection vers /login | |

---

## 2. VAULT & RESSOURCES

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 2.1 | /vault — cliquer "Analyser mes compétences" | Génération IA, skill map affichée | |
| 2.2 | /vault — onglet "Extraction" → lancer extraction | Résultat IA avec frameworks/méthodes | |
| 2.3 | /vault — onglet "Avantage concurrentiel" → générer | Résultat affiché | |
| 2.4 | /vault — onglet "Ressources" → uploader un fichier | Fichier visible dans la liste | |
| 2.5 | /vault — supprimer un fichier uploadé | Fichier disparaît | |
| 2.6 | /vault — onglet "Documents" → uploader un document | Document visible | |

---

## 3. RECHERCHE MARCHÉ

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 3.1 | /market — lancer "Analyser un marché" | Résultat avec scoring, segments, opportunités | |
| 3.2 | /market — onglet "Persona" → générer | ICP 4 niveaux affiché | |
| 3.3 | /market — onglet "Schwartz" → analyser | Niveaux de sophistication affichés | |
| 3.4 | /market — onglet "Concurrence" → analyser | Grille concurrentielle affichée | |
| 3.5 | /market — onglet "Insights" → scraper | Résultats (IA ou Apify si configuré) | |
| 3.6 | /market — onglet "Audit" → lancer audit | Score /100 + plan 90 jours | |

---

## 4. CRÉATION D'OFFRE

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 4.1 | /offer — générer une offre complète | Offre avec promesse, stack, pricing | |
| 4.2 | /offer — onglet "Positionnement" → Category OS | Résultat affiché | |
| 4.3 | /offer — onglet "Mécanisme" → générer | 3 mécanismes avec scoring | |
| 4.4 | /offer — onglet "Garantie" → générer | 4 types de garanties | |
| 4.5 | /offer — onglet "Delivery" → générer | Structure de livraison | |
| 4.6 | /offer — onglet "Score" → scorer l'offre | Score /100 avec dimensions | |
| 4.7 | /offer — onglet "OTO" → générer | Offre OTO générée | |
| 4.8 | /offer — onglet "Pricing" → calculer | 3 tiers avec marges | |

---

## 5. IDENTITÉ DE MARQUE

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 5.1 | /brand — générer une identité de marque | Palette, typos, tone of voice | |
| 5.2 | /brand — onglet "Nom" → générer | Propositions de noms | |
| 5.3 | /brand — onglet "Logo" → générer | Logo via Replicate (si configuré) | |
| 5.4 | /brand — onglet "Kit" → exporter | Export HTML/PDF du brand kit | |

---

## 6. FUNNEL

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 6.1 | /funnel — générer un funnel | Pages générées avec preview | |
| 6.2 | /funnel — preview desktop/mobile | Basculement fonctionne | |
| 6.3 | /funnel — générer script VSL | Script 7 étapes | |
| 6.4 | /funnel — générer OTO | Page OTO générée | |
| 6.5 | /funnel — publier le funnel | URL /f/[slug] accessible publiquement | |
| 6.6 | /funnel — A/B test manager | Création test, tracking, winner détecté | |

---

## 7. CONTENU

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 7.1 | /content — générer un post social | Post avec hook, corps, hashtags | |
| 7.2 | /content — générer un Reel | Script avec structure | |
| 7.3 | /content — générer un carousel | Slides générées | |
| 7.4 | /content — générer des Stories | Stories avec structure | |
| 7.5 | /content — générer YouTube | Script YouTube | |
| 7.6 | /content — calendrier éditorial → générer | Calendrier avec dates et types | |
| 7.7 | /content — batch hebdomadaire → générer 5 contenus | 5 contenus générés et sauvegardés | |
| 7.8 | /content — publier sur LinkedIn (si connecté) | Post publié sur LinkedIn | |

---

## 8. PUBLICITÉS (ADS)

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 8.1 | /ads — onglet "Creatives" → générer | 3+ variations avec hooks/copy/CTA | |
| 8.2 | /ads — onglet "Images IA" → générer | Images générées (Replicate) | |
| 8.3 | /ads — images générées restent visibles après refresh | URLs permanentes (Supabase Storage) | |
| 8.4 | /ads — onglet "Score Ads" → scorer | Score /100 avec dimensions (même sans data) | |
| 8.5 | /ads — onglet "Campagnes" → synchroniser Meta | Campagnes importées depuis Meta | |
| 8.6 | /ads — bouton "Analytics" → page analytics | KPIs et graphiques affichés | |
| 8.7 | /ads — onglet "Scripts DM" → générer | Scripts avec opener/follow-ups | |
| 8.8 | /ads — onglet "Pubs Vidéo" → générer | Scripts vidéo 15s/30s/60s | |
| 8.9 | /ads — onglet "Historique" → cliquer un item | Données restaurées dans le bon onglet | |

---

## 9. SALES & PROSPECTION

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 9.1 | /sales — générer script de vente | Script discovery + closing | |
| 9.2 | /sales — analyser un call (upload audio/texte) | Analyse avec scoring | |
| 9.3 | /prospection — messagerie unifiée | Conversations LinkedIn affichées avec noms | |
| 9.4 | /prospection — envoyer un message LinkedIn | Message envoyé via Unipile | |
| 9.5 | /pipeline — voir le board | Colonnes avec leads | |
| 9.6 | /clients — voir la liste | Liste clients ou empty state | |

---

## 10. ASSETS

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 10.1 | /assets — générer un pitch deck | Pitch deck structuré | |
| 10.2 | /assets — générer une sales letter | Lettre de vente | |
| 10.3 | /assets — générer une séquence email | Emails nurturing | |
| 10.4 | /assets — générer une séquence SMS | SMS séquencés | |
| 10.5 | /assets — générer un lead magnet | Lead magnet structuré | |
| 10.6 | /assets — générer une étude de cas | Case study | |

---

## 11. INTÉGRATIONS

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 11.1 | /settings → Intégrations → Connecter Meta | OAuth Meta réussit, retour settings | |
| 11.2 | /settings → Intégrations → Connecter LinkedIn | OAuth LinkedIn réussit | |
| 11.3 | /settings → Intégrations → Connecter Google Calendar | OAuth Google réussit, events affichés | |
| 11.4 | /settings → Intégrations → Stripe Connect | Redirection Stripe, retour settings | |
| 11.5 | /launch → Pixel/CAPI → Pixel ID auto-récupéré | Pixel ID affiché (pas l'ad account ID) | |
| 11.6 | /launch → Tester le pixel | Test passe sans erreur | |

---

## 12. STRIPE & ABONNEMENT

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 12.1 | /welcome → cliquer "S'abonner Scale" | Redirection Checkout Stripe | |
| 12.2 | Payer avec carte test (4242...) | Retour app, plan mis à jour | |
| 12.3 | /settings → Abonnement → voir le plan actuel | Plan Scale affiché avec quota | |
| 12.4 | /settings → Gérer l'abonnement | Portail Stripe ouvert | |
| 12.5 | Dashboard → barre de quota | X/500 générations affiché | |

---

## 13. WHITELABEL

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 13.1 | /settings → Whitelabel → créer une organisation | Org créée, branding affiché | |
| 13.2 | Uploader un logo | Logo visible dans la sidebar | |
| 13.3 | Changer les couleurs | Couleurs appliquées dans l'app | |
| 13.4 | Ajouter un membre par email | Membre ajouté avec nom/email | |
| 13.5 | Désactiver une section (ex: "ads") | Section disparaît de la sidebar du membre | |
| 13.6 | Membre → taper /ads dans l'URL | Redirection vers / avec toast d'erreur | |
| 13.7 | /portal → vue portail membre | Dashboard avec données de l'owner | |

---

## 14. AFFILIATE

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 14.1 | /affiliate → rejoindre le programme | Inscription réussie, code généré | |
| 14.2 | Lien de referral affiché | URL avec le bon domaine (pas localhost) | |
| 14.3 | Copier le lien | Copié dans le presse-papier | |
| 14.4 | /admin → "Gérer les affiliés" | Page admin affiliés accessible | |

---

## 15. GAMIFICATION & COMMUNAUTÉ

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 15.1 | Dashboard → XP et niveau affichés | Badge avec XP correct | |
| 15.2 | /leaderboard → classement | Ranking des users | |
| 15.3 | /community → poster un message | Post visible dans le feed | |
| 15.4 | /community → onglets fonctionnels | Navigation entre onglets sans bug | |
| 15.5 | /progress → progression affichée | Badges, XP, streak | |

---

## 16. ACADEMY & ROADMAP

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 16.1 | /academy → voir les modules | Liste des modules avec vidéos | |
| 16.2 | /academy → lire une vidéo Loom | Vidéo s'affiche dans le player | |
| 16.3 | /academy → quiz après module | Quiz IA, scoring, XP gagné | |
| 16.4 | /roadmap → plan quotidien | Actions du jour avec XP | |
| 16.5 | /roadmap → milestones | Timeline avec progression | |
| 16.6 | /calendar → Google Calendar (si connecté) | Events affichés | |

---

## 17. ADMIN

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 17.1 | /admin → stats globales | Users, XP, plans, activité | |
| 17.2 | /admin → "Monitoring IA" | Coûts, générations, top consumers | |
| 17.3 | /admin → monitoring → coûts réels affichés | Pas de $0.00 sur les nouvelles générations | |
| 17.4 | /admin → "Gérer les affiliés" | Page admin affiliés | |
| 17.5 | /admin/academy → gérer les vidéos | CRUD vidéos/modules | |
| 17.6 | /settings → onglet admin visible | Lien vers /admin dans la sidebar | |

---

## 18. DRIVE & ASSISTANT

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 18.1 | /drive → créer un dossier | Dossier créé (pas d'erreur RLS) | |
| 18.2 | /drive → uploader un fichier | Fichier visible, nom pas coupé | |
| 18.3 | /assistant → sélectionner un agent | Chat avec l'agent sélectionné | |
| 18.4 | /assistant → envoyer un message | Réponse IA reçue | |
| 18.5 | /assistant → historique conversations | Conversations précédentes listées | |

---

## 19. ANALYTICS & CROISSANCE

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 19.1 | /analytics → dashboard performance | KPIs et graphiques | |
| 19.2 | /analytics → attribution multi-touch | Modèles d'attribution, texte en français | |
| 19.3 | /growth → recommandations IA | Recommandations générées | |
| 19.4 | /growth → paliers de croissance | Palier actuel avec progression | |

---

## 20. VÉRIFICATIONS TRANSVERSALES

| # | Action | Résultat attendu | Bug |
|---|--------|-------------------|-----|
| 20.1 | Ouvrir la console navigateur sur chaque page | Pas d'erreur 400/403/500 | |
| 20.2 | Vérifier le monitoring IA après générations | Tokens et coûts enregistrés | |
| 20.3 | Tester sur mobile (responsive) | Layout correct, sidebar collapse | |
| 20.4 | Vérifier que toutes les pages sont dans la sidebar | Aucune page orpheline | |
| 20.5 | Générer 5+ contenus IA → vérifier quota | Barre de progression mise à jour | |

# Cahier des charges — Refonte du site e-sTaf
### Document d'instructions pour Claude Code

> Ce document compile l'ensemble des demandes de modifications transmises par la cliente (Ravaka Arijaona Andriatsizehena) à son développeur (Guillaume Lafay) via une conversation LinkedIn. Il est réorganisé par thème et par page pour servir de brief exploitable directement par Claude Code afin de reconstruire le site de A à Z.
>
> **Assets visuels** : 8 captures d'écran / images fournies par la cliente sont disponibles dans le dossier `/design-references/` à côté de ce document. Elles sont numérotées dans l'ordre chronologique où elles ont été envoyées dans la conversation. **Ouvre chaque image avant de coder la section correspondante** — les correspondances ci-dessous sont indiquées à titre de repère mais doivent être vérifiées visuellement.
>
> - `00-logo-nouveau.png` → nouveau logo e-sTaf (à utiliser à la place de l'ancien logo, partout sur le site)
> - `01-reference.png` à `07-reference.png` → références de mise en page envoyées au fil de la conversation (graphique de la page d'accueil, écran "se préparer aux examens", photo FOL, design de la vitrine des talents, interfaces de dashboard). Se référer aux sections correspondantes ci-dessous pour le contexte de chaque référence.

---

## 0. Positionnement de marque — principe directeur

**e-sTaf doit véhiculer une image haut de gamme, élite, sobre et humaine** — jamais "publicitaire" ou agressive. C'est le fil rouge de toutes les demandes de la cliente :

- Supprimer tout élément visuel qui fait "panneau publicitaire" (bandeau défilant en couleurs criardes, effets trop appuyés).
- Préférer des visuels qui **prouvent la maîtrise du sujet en un coup d'œil**, plutôt que des éléments décoratifs génériques (ex. graphique boursier générique → remplacé par un visuel qui parle directement aux candidats et aux clients).
- Ton éditorial : exigence, excellence, accompagnement humain, émancipation du potentiel — pas de discours commercial agressif.

---

## 1. Identité visuelle

### 1.1 Logo
- Retirer l'ancien logo partout sur le site (header, footer, favicon, éléments de branding).
- Le remplacer par le nouveau logo fourni : `design-references/00-logo-nouveau.png`.

### 1.2 Palette de couleurs
- Adapter l'intégralité de la palette de couleurs du site pour qu'elle soit cohérente avec le nouveau logo (extraire les couleurs dominantes du logo — probablement un fond sombre/premium avec une couleur d'accent).
- **Bannir les jaunes/oranges vifs et agressifs** utilisés actuellement dans le bandeau défilant — ils cassent l'image haut de gamme recherchée.

---

## 2. Page d'accueil

### 2.1 Bandeau défilant (marquee) — à supprimer/refondre
Le bandeau défilant actuel, en gros caractères jaunâtres/orange, surcharge visuellement la page et donne un effet "panneau publicitaire agressif" qui casse l'image haut de gamme et élite que e-Staf veut renvoyer.
→ **Action : supprimer ce composant ou le remplacer par une alternative beaucoup plus sobre**, cohérente avec la nouvelle palette (pas de gros texte clignotant/défilant en couleurs vives).

### 2.2 Graphique de la page d'accueil (courbe boursière)
La courbe actuelle façon "graphique boursier" doit être remplacée.
- **Principe** : plutôt qu'un graphique financier générique, l'image doit prouver en un seul coup d'œil qu'e-sTaf maîtrise son sujet — les candidats doivent comprendre immédiatement ce qui les attend, et de même pour les clients entreprises.
- Référence visuelle fournie : `design-references/01-reference.png`.
- → Concevoir un visuel de type "parcours"/"roadmap" clair plutôt qu'un graphique boursier abstrait.

### 2.3 Section "Deux portes d'entrée" → remplacée par "Notre vision"

**Texte actuel à retirer :**
> Deux espaces, une même identité
> Que vous soyez un talent freiné par vos compétences linguistiques ou une entreprise freinée par les risques de l'externalisation, votre porte d'entrée est ici.

**Nouveau texte à intégrer :**

> **Notre vision**
>
> Notre seul et unique objectif, c'est l'impact : permettre à tout un chacun de choisir sa trajectoire de vie et de concrétiser ses rêves.
>
> C'est pour cela qu'e-sTaf est avant tout un espace d'émancipation et de révélation du potentiel humain. Au-delà de l'externalisation, nous bâtissons un pont solide entre deux ambitions :

- **Consigne de mise en page** : conserver **exactement la même structure visuelle** que la section "Deux portes d'entrée" existante (mise en page en deux colonnes/deux blocs), en adaptant uniquement les couleurs à la nouvelle palette.

**Sous les deux colonnes, ajouter le texte suivant :**

Côté **Talent** (colonne gauche) :
> Nous portons des accompagnements sur-mesure pour révéler le meilleur de chacun, en toute autonomie :

Côté **Entreprise** (colonne droite) :
> Nous offrons un prolongement naturel à cette exigence humaine. En vous garantissant des profils formés, et managés avec rigueur, des infrastructures sécurisées pour vous permettre de grandir en toute confiance, en sachant que chaque collaborateur qui vous rejoint est un talent pleinement épanoui et prêt à donner le meilleur de lui-même.

**Puis, en bas de ces deux blocs (texte de clôture pleine largeur) :**
> Ici, chaque parcours compte. Chaque ambition valorisée et chaque talent accompagné.
> Nous sommes là pour grandir ensemble, sans compromis et avec le cœur.

---

## 3. Parcours "Se préparer aux examens"

Quand le visiteur clique sur **"Se préparer aux examens"**, il doit arriver sur un écran de prise de coordonnées.
- Référence visuelle : `design-references/02-reference.png`.
- Le **test est le même pour les trois types d'examens**, mais avant de le passer, le candidat doit **remplir ses coordonnées**.
- Ces coordonnées sont **stockées directement dans une base de données, segmentée selon le type d'examen** choisi par le candidat (3 bases/segments distincts selon le type d'examen visé).

---

## 4. Programme "Se former aux FOL" (Français : Oratoire des Leaders)

Quand le candidat clique sur **"Se former aux FOL"**, il doit voir le contenu suivant :

> **Français : Oratoire des Leaders (FOL)**
> L'art de la haute autorité verbale.
>
> Le pouvoir d'un grand leader réside au bout de sa voix. Le programme FOL n'est pas une formation ouverte à tous : c'est un cursus d'élite de six mois conçu pour les esprits audacieux qui refusent de faire de la simple figuration.
>
> **Un processus d'excellence sans compromis :**
>
> **Étape 1 — La Présélection (15 Talents)** : Un premier filtre rigoureux retient seulement 15 profils d'exception pour intégrer 6 semaines d'observation intensive et de mise en situation.
>
> **Étape 2 — L'Élite (5 Élus)** : À l'issue de cette période probatoire, seuls 5 candidats démontrant la rigueur, le potentiel et l'engagement requis décrocheront leur place pour suivre l'intégralité du coaching de 6 mois.
>
> Ici, nous ne vous apprenons pas seulement à parler français : nous sculptons votre autorité naturelle. Votre voix est votre premier outil de conquête. Ne la subissez plus : incarnez-la.

**Éléments d'interface :**
- Un bouton **"Passer le test"**.
- Process identique aux autres parcours : remplir les coordonnées → passer le test.
- **Le résultat n'est jamais communiqué immédiatement.**
- Intégrer une photo illustrative (fournie : `design-references/03-reference.png`) montrant ce que les 5 Élus vont apprendre pendant les 6 mois de programme.

---

## 5. Parcours "Postuler au métier"

En cliquant sur **"Postuler au métier"**, le candidat accède au **Studio Métier**. Quand il clique sur le métier de son choix, un bouton **"Passer votre test"** apparaît.

**Avant de passer le test**, afficher le texte suivant :

> **Un test sans risque, une opportunité pour grandir.**
>
> Ne voyez pas ce test comme un couperet, mais comme un tremplin. Si vous ne validez pas immédiatement le niveau C1 requis, aucun rejet : vous bénéficierez d'un accompagnement sur-mesure pour booster et élever vos compétences linguistiques.
>
> Si vous obtenez un niveau C1 ou plus : Vous accédez directement au cercle restreint. Votre parcours s'articulera autour de 10 jours de formation intensive pour parfaire votre posture, votre éloquence et les codes de l'excellence, complétés par 5 jours de formation offerts par notre partenaire.
>
> Attention : Ces opportunités demandent un engagement total. Vous aurez la responsabilité de piloter et d'organiser rigoureusement votre planning pour concilier ces temps de formation et vos missions.
>
> Êtes-vous prêt à relever le défi et à valider votre position ?

- Process identique : prise de coordonnées puis passage du test.

---

## 6. "Découvrir nos meilleurs talents" — Vitrine des Talents & Communauté

En cliquant sur **"Découvrir nos meilleurs talents"**, le visiteur arrive sur la page suivante :

**Titre :** La Vitrine des Talents & Communauté e-sTaf
**Sous-titre :** Plongez au cœur de nos performances, découvrez nos leaders et partagez l'énergie de notre communauté.

### 6.1 Le Mur des Performances & Médias (Espace Partage & Collaboration)
- **Contenu** : photos et vidéos exclusives de l'équipe, moments forts des campagnes, portraits des meilleurs leaders et des meilleurs professeurs.
- **Interaction** : les visiteurs/membres peuvent liker, commenter et échanger librement sous chaque publication. Possibilité d'importer et de joindre leurs propres photos/souvenirs.
- **Sécurité & Modération** : les contenus visuels soumis par les membres passent par un **mode collaboratif / prévisualisation** avant intégration (validation avant publication), pour garantir un espace constructif et inspirant.

### 6.2 L'Espace Avis & Témoignages (Modéré)
**Sous-titre :** Votre voix compte. Exprimez-vous en toute transparence sur votre expérience e-sTaf.
- **Format** : compact et épuré, pensé pour ne pas alourdir la page — met en avant des retours authentiques.
- **Publication encadrée** : le visiteur/membre peut soumettre son avis librement, mais **chaque témoignage est soumis à une validation préalable de l'administration** avant d'être publié en accès public.

**Référence visuelle de design pour cette page :** `design-references/05-reference.png`.

**Exigence fonctionnelle importante :** ce mur de publications et cet espace d'avis doivent être **gérables depuis un back-office** (un admin/modérateur doit pouvoir approuver, rejeter ou gérer les publications et les avis avant mise en ligne).

---

## 7. Système de comptes utilisateurs

### 7.1 Principe général du parcours d'inscription

⚠️ Point de clarification important, confirmé en dernier par la cliente — à respecter strictement :

- **Le site reste consultable librement par tout visiteur** (vitrine, informations, pages publiques), sans compte.
- Sur le site vitrine, le bouton **"Rejoindre l'eStaf"** est remplacé par **"Créer un compte"**.
- **La création de compte n'est possible qu'après validation du test linguistique ET inscription complète.**
- Une fois validé, le candidat **reçoit un numéro de matricule attribué par la Direction/RH**, qui lui permet d'accéder à son espace compte personnel (dashboard).
- Séquence : Visite libre → Créer un compte → Remplir coordonnées → Passer le test → (résultat différé) → Validation par la RH → Attribution d'un matricule → Accès à l'espace compte selon le rôle.

Ce menu déroulant "Créer un compte" doit proposer les **8 types de comptes/rôles** suivants (à considérer comme les profils utilisateurs de l'application, au-delà du site vitrine) :

### 7.2 Les 8 rôles utilisateurs

#### 1. L'Apprenant
**Conditions d'accès :** Inscription sur la plateforme + passage obligatoire du test d'évaluation linguistique. L'obtention d'un numéro matricule unique (validé et délivré par le pôle RH après le test) est indispensable pour activer le compte.

**Accès & fonctionnalités :**
- Tableau de bord de suivi du parcours de formation.
- Gestion du planning (modules de mise à niveau, programme d'excellence, modules de 10 jours de posture, 5 jours offerts par le partenaire).
- Graphique statistique d'évolution : suivi visuel de la progression des scores linguistiques, de l'assiduité et de la courbe de montée en compétences (objectivant le niveau C1).
- Accès à la communauté pour commenter les actualités et soumettre des avis (soumis à validation administrative).

Référence d'interface fournie : `design-references/06-reference.png`.

#### 2. L'Agent (collaborateur en poste / missions longues ou courtes)
**Conditions d'accès :** Avoir validé son parcours d'intégration et son niveau, sanctionné par l'attribution d'un numéro matricule officiel.

**Accès & fonctionnalités :**
- Portail opérationnel de travail (gestion des plannings de campagnes, sprints, tâches longues).
- Outils de communication et de suivi opérationnel.
- Graphique statistique d'évolution : courbes de performance individuelles (volume de flux traités, taux de conversion, réactivité, indicateurs de qualité des missions).
- Participation active au mur des performances/médias (partage photos/vidéos, commentaires) et publication d'avis modérés.

#### 3. Le Superviseur (manager / pilote de pôle)
**Conditions d'accès :** Compte attribué et activé directement par l'administration d'e-sTaf (profil d'encadrement interne).

**Accès & fonctionnalités :**
- Tableau de bord global de pilotage des équipes et des flux (suivi des agents, setteurs, closers, etc.).
- Rédaction et transmission des rapports hebdomadaires à destination du pôle RH (performances opérationnelles, dynamiques d'équipe, points de blocage).
- Outils de modération : superviser les échanges, valider les contenus du mur communautaire, pré-valider les avis soumis.
- Graphique statistique d'évolution : tableaux analytiques globaux (volumes de production de l'équipe, taux de réussite des campagnes, dynamique des performances collectives dans le temps).

#### 4. Le Formateur (intervenant pédagogique)
**Conditions d'accès :** Compte validé par la direction pédagogique d'e-sTaf pour les sessions de renforcement, d'éloquence ou de montée en compétences.

**Accès & fonctionnalités :**
- Interface de gestion des classes et des apprenants en cours de formation.
- Rédaction et transmission des rapports hebdomadaires à destination du pôle RH (suivi pédagogique, assiduité, validation des acquis linguistiques et de posture).
- Planification des modules d'enseignement (notamment les programmes de 10 jours de renforcement).
- Graphique statistique d'évolution : taux de réussite aux évaluations de groupe, courbes de progression des classes, indicateurs d'impact des programmes de formation.

#### 5. Le Partenaire (apporteur d'affaires, répertoire & commissions)
**Conditions d'accès :** Validation d'une convention de partenariat commercial ou stratégique avec e-sTaf.

**Accès & fonctionnalités clés :**
- **Dashboard & Répertoire Client (Prospection B2B)** : espace dédié pour soumettre et enregistrer des prospects. Le partenaire suit l'avancement de la négociation menée par l'équipe e-sTaf et la validation des contrats.
- **Portail de suivi des talents** : suivi des recommandations de candidats orientés vers la plateforme.
- **Tableau financier des commissions** :
  - *Flux Talents (récurrent)* : suivi des agents actifs en poste + calcul automatique de **5 % de commission** sur leur salaire mensuel.
  - *Flux Contrats Clients (unique)* : suivi des contrats B2B signés issus de son répertoire + calcul automatique de la **commission unique de 10 %**, versée à la signature.
- **Graphique statistique d'évolution** : histogrammes et courbes dissociant les primes uniques (contrats B2B) des revenus récurrents (salaires agents).
- **Ressources & transparence** : kit média partenaire, historique des versements, messagerie directe avec l'administration financière.

#### 6. L'Entreprise
Client B2B bénéficiaire des services d'externalisation et de prestations. *(Rôle nommé par la cliente mais non détaillé plus précisément dans les échanges — à clarifier avec la cliente avant développement : accès attendus, tableau de bord, suivi des collaborateurs mis à disposition, facturation, etc.)*

#### 7. Le Compte RH
Pôle des ressources humaines gérant : les CVs, les contrats, les bases de données par vagues/groupes, les flux, la validation des inscriptions avec attribution des matricules, et la centralisation des rapports (reçus des Superviseurs et Formateurs). *(Rôle nommé mais non détaillé en fonctionnalités précises — à clarifier avec la cliente.)*

#### 8. Le Compte Direction
Administration suprême disposant de :
- Un droit d'audit sur les matricules.
- Un historique candidats.
- Un suivi de la valeur apportée par groupe.
- Des tableaux de bord financiers et statistiques des pôles formation et production.
*(Rôle nommé mais non détaillé en fonctionnalités précises — à clarifier avec la cliente.)*

### 7.3 Précision importante site vitrine vs. application
Sur le **site vitrine public**, il n'est pas nécessaire d'exposer les 8 rôles avec le même niveau de détail — la cliente a précisé que la logique des 8 comptes concerne surtout **l'application** (back-office métier). Sur le site vitrine, il faut simplement :
- Remplacer "Rejoindre l'eStaf" / "Passer le test" par **"Créer un compte"**.
- Le flux après création de compte (test, matricule, accès dashboard) doit exister mais peut être implémenté progressivement, en priorisant d'abord le site vitrine, puis l'application.

---

## 8. Récapitulatif des changements de copywriting (à corriger partout où il apparaît)

| Ancien texte / élément | Nouveau texte / élément |
|---|---|
| Logo actuel | Nouveau logo (`00-logo-nouveau.png`) + palette adaptée |
| Bandeau défilant jaune/orange | Supprimé ou remplacé par un élément sobre |
| Courbe boursière (accueil) | Visuel "preuve de maîtrise" façon roadmap (voir `01-reference.png`) |
| "Deux portes d'entrée" / "Deux espaces, une même identité" | "Notre vision" (texte complet en section 2.3) |
| "Rejoindre l'eStaf" / "Passer le test" (CTA site vitrine) | "Créer un compte" |

---

## 9. Points à clarifier avec la cliente avant développement complet

Ces éléments ont été identifiés dans la conversation mais restent incomplets ou ambigus — à valider avant de les développer en détail :

1. **Rôles Entreprise, RH et Direction** : fonctionnalités et interfaces non détaillées dans les échanges (contrairement à Apprenant, Agent, Superviseur, Formateur et Partenaire qui sont très détaillés). Demander un brief équivalent.
2. **Nom de domaine** : la cliente a demandé le prix d'un nom de domaine (pour le site puis l'application) — achat à prévoir en amont du déploiement.
3. **Timing exact du flux d'inscription** côté application (au-delà du site vitrine) : à quel moment précis le matricule est-il généré ? Y a-t-il une étape de paiement/frais associée au test ?
4. **Système de notation du test linguistique** (barème, durée, format des questions) : non décrit dans les échanges, à demander.
5. **Design final validé pour la vitrine des talents et les dashboards** : les références envoyées (`04-reference.png` à `07-reference.png`) sont des inspirations ("un peu comme ça") — à valider avec la cliente si elles doivent être reproduites à l'identique ou seulement en inspiration.

---

## 10. Recommandations techniques pour Claude Code

- **Ordre de priorité suggéré** : (1) Identité visuelle (logo/couleurs) → (2) Page d'accueil (marquee, courbe, section vision) → (3) Parcours candidats (examens, FOL, métier) → (4) Vitrine des talents & communauté → (5) Système de comptes et dashboards par rôle.
- Prévoir une **base de données structurée par segments** (type d'examen, rôle utilisateur, statut de matricule) dès la conception du schéma, car plusieurs parcours écrivent des coordonnées candidates dans des bases distinctes selon le type d'examen visé.
- Prévoir un **back-office de modération** pour : validation des avis/témoignages, validation des publications sur le mur communautaire, validation des inscriptions et attribution des matricules par la RH.
- Le résultat des tests n'étant jamais immédiat, prévoir un **statut "en attente de résultat"** dans l'espace personnel du candidat plutôt qu'un affichage de score instantané.
- Réutiliser au maximum les composants de mise en page existants (ex. section "Notre vision" doit garder la structure de l'ancienne section "Deux portes d'entrée") pour limiter la refonte à la charte graphique et au contenu, pas à l'architecture.

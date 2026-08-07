# Document d'exigences

## 1. Aperçu de l'application

### 1.1 Nom de l'application
RPGuard - Plateforme communautaire de transparence pour joueurs RP

### 1.2 Description
RPGuard est une plateforme communautaire permettant aux joueurs de jeux vidéo de type RolePlay (GTA RP, ONESTATE RP, etc.) de déposer des plaintes contre des administrateurs abusant de leur pouvoir. La plateforme offre un espace transparent où les joueurs peuvent partager leurs expériences, consulter les plaintes d'autres joueurs, voter et commenter pour construire une communauté plus juste.

### 1.3 Architecture technique
- Frontend : React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Backend : Supabase (Auth, Database avec RLS, Storage, Edge Functions, Realtime, Scheduled Tasks)
- Langue : Français
- Principe : 100% de la logique backend gérée par Supabase, aucune logique métier côté client

## 2. Utilisateurs et scénarios d'utilisation

### 2.1 Utilisateurs cibles
- Joueurs de jeux RP (GTA RP, ONESTATE RP, autres jeux RP)
- Joueurs utilisant différentes plateformes (mobile, PC, tablette, iOS)
- Communauté francophone de joueurs
- Administrateurs de la plateforme

### 2.2 Scénarios principaux
- Un joueur victime d'abus de pouvoir dépose une plainte avec preuves
- Un joueur consulte les plaintes existantes pour vérifier la réputation d'un serveur
- La communauté vote et commente les plaintes pour soutenir ou contester
- Un joueur suit l'évolution de ses plaintes déposées
- Un joueur consulte les scores des serveurs en temps réel
- Un administrateur modère les plaintes et gère les utilisateurs
- Un utilisateur récupère son mot de passe via question de sécurité
- Un utilisateur recherche et contacte d'autres utilisateurs via messagerie en temps réel
- Un utilisateur envoie des messages texte, emojis et messages vocaux à d'autres utilisateurs
- Un utilisateur consulte le règlement de la plateforme
- Un administrateur cite des articles du règlement lors du traitement des plaintes

## 3. Exigences de style et design

### 3.1 Template Minimal
- Design aéré avec hiérarchie visuelle via espaces blancs
- Tailles de police et espacements pour structurer l'information
- Quasi aucune ombre ni couleur décorative
- Contraste doux pour une lecture confortable
- Typographie fine et élégante
- Interface adaptée aux gamers mais sobre et lisible

### 3.2 Principes d'interface
- Mise en page épurée privilégiant la lisibilité
- Espaces blancs généreux entre les sections
- Hiérarchie typographique claire (titres, sous-titres, corps de texte)
- Palette de couleurs sobre avec accents discrets
- Éléments interactifs minimalistes (boutons, liens)
- Badges de catégorie colorés pour identification rapide
- Indicateurs visuels forts pour les votes et statuts
- Bulles de messages claires pour la messagerie (style iMessage/WhatsApp)
- Badges de conformité visuellement distincts (vert pour conforme, gris pour non vérifié)

## 4. Structure des pages et fonctionnalités

### 4.1 Structure des pages

```
├── Page d'accueil
├── Inscription/Connexion
│   ├── Page d'inscription
│   ├── Page de connexion
│   └── Page de récupération de mot de passe
├── Dépôt de plainte
├── Liste des plaintes
├── Détail d'une plainte
├── Tableau de bord utilisateur
│   ├── Profil
│   ├── Mes plaintes
│   └── Notifications
├── Messagerie
│   ├── Liste des conversations
│   ├── Recherche d'utilisateurs
│   └── Fenêtre de conversation
├── Page scores serveurs
├── Page Règlement RPGuard
├── Page contact/signalement
└── Panel administrateur
    ├── Gestion des plaintes
    ├── Gestion des utilisateurs
    └── Statistiques
```

### 4.2 Page d'accueil

#### 4.2.1 Hero section
- Titre principal percutant : « Votre voix contre les abus de pouvoir »
- Slogan : « Ensemble, construisons une communauté RP plus juste et transparente »
- Bouton d'appel à l'action principal : « Déposer une plainte »
- Bouton secondaire : « Consulter les plaintes »

#### 4.2.2 Statistiques de confiance
- Afficher le nombre total de plaintes déposées
- Afficher le nombre de jeux/serveurs concernés
- Afficher le nombre d'utilisateurs inscrits
- Compteur en temps réel de nouvelles plaintes (mise à jour automatique via Supabase Realtime)

#### 4.2.3 Section « Comment ça marche »
- Étape 1 : Créez votre compte gratuitement
- Étape 2 : Déposez votre plainte avec preuves
- Étape 3 : La communauté vote et soutient votre cause

#### 4.2.4 Section « Pourquoi signaler ? »
- Protéger la communauté des abus de pouvoir
- Donner de la visibilité aux comportements inappropriés
- Aider les joueurs à choisir des serveurs sains
- Encourager les administrateurs à respecter les règles

#### 4.2.5 Plaintes récentes mises en avant
- Afficher les 5 dernières plaintes avec badge de vérification si preuves solides
- Pour chaque plainte : nom du jeu/serveur, nom de l'administrateur, extrait de la description, nombre de votes, badge de catégorie coloré, badge de conformité, date de dépôt
- Lien vers le détail de chaque plainte

#### 4.2.6 Section FAQ
- Questions fréquentes avec réponses courtes
- Exemples : « Comment déposer une plainte ? », « Mes données sont-elles protégées ? », « Que se passe-t-il après le dépôt ? », « Comment fonctionne le système de votes ? »

#### 4.2.7 Footer
- Liens : Mentions légales, Règlement de la plateforme, Contact
- Copyright et informations légales

### 4.3 Inscription/Connexion

#### 4.3.1 Page d'inscription
- Message de bienvenue : « Rejoignez la communauté RPGuard »
- Formulaire avec champs : nom d'utilisateur, adresse email, mot de passe, confirmation du mot de passe, question de sécurité (sélection parmi liste prédéfinie), réponse à la question de sécurité
- Validation des champs (format email, longueur mot de passe)
- Création du compte utilisateur via Supabase Auth
- Enregistrement de la question et réponse de sécurité (hashée) dans la base de données
- Design minimaliste et épuré

#### 4.3.2 Page de connexion
- Message de bienvenue : « Bon retour sur RPGuard »
- Formulaire avec champs : email, mot de passe
- Authentification de l'utilisateur via Supabase Auth
- Lien vers la page de récupération de mot de passe
- Redirection vers la page d'accueil après connexion réussie
- Design minimaliste et épuré

#### 4.3.3 Page de récupération de mot de passe
- Formulaire avec champs : email
- Vérification de l'existence de l'email dans la base de données
- Affichage de la question de sécurité associée au compte
- Champ pour saisir la réponse à la question de sécurité
- Vérification de la réponse via Edge Function
- Si réponse correcte : permettre la réinitialisation du mot de passe
- Si réponse incorrecte : afficher un message d'erreur

#### 4.3.4 Déconnexion
- Bouton de déconnexion accessible depuis le menu utilisateur
- Déconnexion via Supabase Auth
- Redirection vers la page d'accueil

### 4.4 Dépôt de plainte

#### 4.4.1 Accès
- Accessible uniquement aux utilisateurs connectés

#### 4.4.2 Formulaire guidé
- Étape 1 : Informations du serveur
  + Champ : Nom du jeu/serveur (texte libre)
  + Champ : Catégorie de jeu (sélection parmi : GTA RP, ONESTATE RP, Autres jeux RP, Autres jeux)
  + Champ : Catégorie d'abus (sélection parmi : Abus de pouvoir, Fausse preuve, Discrimination, Sanction injustifiée, Autre)
  + Champ : Nom de l'administrateur concerné (texte libre)
- Étape 2 : Description de l'incident
  + Champ : Description détaillée de l'abus (zone de texte)
  + Indication : « Soyez précis et factuel »
- Étape 3 : Preuves
  + Champ : Preuves/Screenshots (téléchargement de fichiers vers Supabase Storage)
  + Message de rassurance : « Vos preuves sont stockées de manière sécurisée et confidentielle »
- Étape 4 : Checklist de conformité au règlement
  + Case à cocher 1 : « J'ai lu et je respecte l'Article 4 — Dépôt de plainte »
  + Case à cocher 2 : « Je certifie que ma plainte est véridique conformément à l'Article 5 — Véracité et bonne foi »
  + Case à cocher 3 : « Je fournis des preuves tangibles conformément à l'Article 7 — Système de votes et commentaires »
  + Les 3 cases doivent être cochées pour activer le bouton de soumission
  + Si les cases ne sont pas cochées, le bouton de soumission est désactivé avec message explicatif
- Bouton de soumission : « Publier ma plainte » (actif uniquement si les 3 cases sont cochées)

#### 4.4.3 Encart contextuel « Article applicable »
- Afficher un encart selon la catégorie d'abus sélectionnée
- Contenu de l'encart : titre de l'article applicable et résumé court (2-3 lignes)
- Exemples de correspondances :
  + Abus de pouvoir → Article 4 — Dépôt de plainte
  + Fausse preuve → Article 7 — Système de votes et commentaires
  + Discrimination → Article 6 — Respect et civilité
  + Sanction injustifiée → Article 5 — Véracité et bonne foi
  + Autre → Article 4 — Dépôt de plainte

#### 4.4.4 Enregistrement
- Enregistrer la plainte avec statut « En attente » via Supabase Database
- Associer la plainte à l'utilisateur connecté
- Stocker les screenshots dans Supabase Storage
- Générer les URLs publiques des preuves
- Enregistrer l'état de la checklist de conformité (3 cases cochées = conforme)
- Déclencher une Edge Function pour attribution automatique du badge de vérification si preuves présentes
- Redirection vers le détail de la plainte créée

### 4.5 Liste des plaintes

#### 4.5.1 Affichage des plaintes
- Design de carte clair pour chaque plainte
- Pour chaque plainte : badge de catégorie coloré, nom du jeu/serveur, nom de l'administrateur, extrait de la description, indicateur de votes visuellement fort (upvote/downvote), nombre de commentaires, statut, badge de vérification si preuves solides, badge de conformité (vert « Conforme au règlement » si checklist validée, gris « Non vérifié » sinon), date de dépôt

#### 4.5.2 Filtres
- Filtre par catégorie de jeu (GTA RP, ONESTATE RP, Autres jeux RP, Autres jeux)
- Filtre par nom de jeu/serveur (recherche textuelle)
- Filtre par statut (En attente, Validée, Rejetée)

#### 4.5.3 Tri
- Tri par date (plus récentes en premier par défaut)
- Tri par nombre de votes (plus votées en premier)

### 4.6 Détail d'une plainte

#### 4.6.1 Informations de la plainte
- Afficher toutes les informations : badge de catégorie coloré, nom du jeu/serveur, nom de l'administrateur, description complète, statut, badge de vérification si preuves solides, badge de conformité (vert « Conforme au règlement » si checklist validée, gris « Non vérifié » sinon), date de dépôt, auteur
- Si un article du règlement a été cité par l'administrateur lors du traitement : afficher la référence à l'article avec son titre et un résumé court (2-3 lignes)

#### 4.6.2 Présentation des preuves
- Afficher les screenshots/preuves de manière claire et organisée
- Possibilité d'agrandir les images

#### 4.6.3 Timeline des événements
- Afficher la chronologie : date de dépôt, date de mise à jour du statut, nombre de votes reçus, nombre de commentaires

#### 4.6.4 Système de votes bien visible
- Bouton upvote (soutien) avec compteur
- Bouton downvote (contestation) avec compteur
- Afficher le score total (upvote - downvote) de manière visuellement forte
- Un utilisateur connecté peut voter une seule fois par plainte
- Gestion des votes via Edge Function

#### 4.6.5 Commentaires
- Afficher tous les commentaires associés à la plainte
- Pour chaque commentaire : auteur, contenu, date de publication
- Formulaire d'ajout de commentaire (accessible aux utilisateurs connectés)
- Enregistrement des commentaires via Supabase Database

#### 4.6.6 Signalement
- Bouton de signalement de fausse plainte (accessible aux utilisateurs connectés)
- Enregistrer le signalement via Supabase Database
- Déclencher une Edge Function pour vérifier le nombre de signalements et marquer pour modération si seuil atteint

#### 4.6.7 Lien vers le règlement
- Afficher un lien vers la page Règlement RPGuard
- Texte du lien : « Consulter le règlement de la plateforme »

#### 4.6.8 Export PDF
- Bouton « Exporter en PDF » accessible à l'auteur de la plainte et aux administrateurs
- Le PDF contient : toutes les informations de la plainte, preuves, timeline, votes, commentaires
- Si un article a été cité par la modération : afficher le titre de l'article ET son résumé (2-3 lignes) dans le PDF

### 4.7 Tableau de bord utilisateur

#### 4.7.1 Accès
- Accessible uniquement à l'utilisateur connecté

#### 4.7.2 Section Profil
- Afficher les informations du profil : nom d'utilisateur, email, date d'inscription
- Possibilité de modifier le nom d'utilisateur
- Possibilité de modifier la question et réponse de sécurité

#### 4.7.3 Section Mes plaintes
- Statistiques visuelles : nombre total de plaintes déposées, nombre de plaintes par statut (En attente, Validée, Rejetée)
- Graphique ou indicateurs visuels pour les statistiques
- Afficher toutes les plaintes déposées par l'utilisateur
- Pour chaque plainte : nom du jeu/serveur, nom de l'administrateur, statut, nombre de votes, nombre de commentaires, badge de conformité, date de dépôt
- Lien vers le détail de chaque plainte

#### 4.7.4 Section Notifications
- Afficher les notifications de l'utilisateur (nouveau commentaire sur ses plaintes, changement de statut, etc.)
- Marquer les notifications comme lues
- Gestion des notifications via Supabase Realtime

#### 4.7.5 Accès rapide aux actions
- Bouton : « Déposer une nouvelle plainte »
- Bouton : « Consulter toutes les plaintes »

### 4.8 Messagerie

#### 4.8.1 Accès
- Accessible uniquement aux utilisateurs connectés
- Accessible via le menu principal ou le tableau de bord utilisateur

#### 4.8.2 Liste des conversations
- Afficher toutes les conversations de l'utilisateur
- Pour chaque conversation : nom d'utilisateur du contact, dernier message, date du dernier message, indicateur de message non lu
- Tri par date du dernier message (plus récent en premier)
- Bouton pour démarrer une nouvelle conversation

#### 4.8.3 Recherche d'utilisateurs
- Champ de recherche pour trouver des utilisateurs par nom d'utilisateur
- Afficher les résultats de recherche en temps réel
- Pour chaque résultat : nom d'utilisateur, bouton pour démarrer une conversation
- Enregistrement de la nouvelle conversation via Supabase Database

#### 4.8.4 Fenêtre de conversation
- Afficher tous les messages de la conversation
- Pour chaque message : contenu (texte, emoji ou message vocal), auteur, date d'envoi
- Affichage en bulles de messages (style iMessage/WhatsApp)
- Messages de l'utilisateur connecté alignés à droite
- Messages du contact alignés à gauche
- Champ de saisie de message en bas de la fenêtre
- Bouton d'envoi de message
- Sélecteur d'emojis
- Bouton d'enregistrement de message vocal

#### 4.8.5 Envoi de messages texte et emojis
- Saisir un message dans le champ de saisie
- Sélectionner des emojis via le sélecteur
- Envoyer le message via le bouton d'envoi
- Enregistrement du message via Supabase Database
- Mise à jour en temps réel de la conversation via Supabase Realtime

#### 4.8.6 Enregistrement et envoi de messages vocaux
- Appuyer sur le bouton d'enregistrement pour démarrer l'enregistrement
- Enregistrer l'audio via le microphone de l'appareil
- Arrêter l'enregistrement
- Prévisualiser le message vocal enregistré
- Envoyer le message vocal
- Stockage du fichier audio dans Supabase Storage
- Enregistrement du message avec référence au fichier audio via Supabase Database
- Mise à jour en temps réel de la conversation via Supabase Realtime

#### 4.8.7 Lecture de messages vocaux
- Afficher les messages vocaux avec un lecteur audio
- Possibilité de lire, mettre en pause, reprendre la lecture
- Afficher la durée du message vocal

### 4.9 Page scores serveurs

#### 4.9.1 Affichage des scores
- Liste des serveurs avec leur score calculé en temps réel
- Pour chaque serveur : nom du serveur, catégorie de jeu, nombre total de plaintes, nombre de plaintes validées, score global (basé sur votes et statuts)
- Tri par score (meilleurs serveurs en premier par défaut)
- Filtre par catégorie de jeu

#### 4.9.2 Calcul des scores
- Score calculé via Edge Function basée sur : nombre de plaintes, statuts des plaintes, votes de la communauté
- Mise à jour en temps réel via Supabase Realtime

### 4.10 Page Règlement RPGuard

#### 4.10.1 Accès
- Accessible publiquement (utilisateurs connectés et non connectés)
- Accessible via le footer de la page d'accueil
- Accessible via le menu principal de navigation
- Accessible via lien depuis le détail d'une plainte

#### 4.10.2 Structure de la page
- Titre principal : « Règlement RPGuard »
- Introduction expliquant l'objectif du règlement
- Liste des articles numérotés (Article 1, Article 2, etc.)
- Chaque article contient un titre et un contenu détaillé
- Pour chaque article : afficher un compteur « X dossiers citent cet article » basé sur les données réelles de la base de données

#### 4.10.3 Contenu des articles

**Article 1 — Objet et champ d'application**
Le présent règlement définit les conditions d'utilisation de la plateforme RPGuard, plateforme communautaire dédiée au signalement des abus de pouvoir commis par des administrateurs de serveurs de jeux vidéo de type RolePlay. Toute personne accédant à la plateforme, qu'elle soit inscrite ou non, s'engage à respecter l'intégralité des dispositions du présent règlement. L'utilisation de RPGuard implique l'acceptation pleine et entière de ces règles.

**Article 2 — Définitions**
Aux fins du présent règlement, les termes suivants sont définis comme suit :
- Utilisateur : toute personne physique inscrite sur la plateforme RPGuard
- Plainte : signalement d'un abus de pouvoir déposé par un utilisateur contre un administrateur de serveur de jeu RP
- Administrateur de serveur : personne disposant de pouvoirs de modération ou d'administration sur un serveur de jeu RP
- Abus de pouvoir : utilisation abusive, discriminatoire ou injustifiée des pouvoirs d'administration
- Preuve : tout élément tangible (capture d'écran, enregistrement, log) attestant de la réalité des faits allégués
- Modération : équipe administrative de RPGuard chargée de vérifier la conformité des plaintes

**Article 3 — Inscription et compte utilisateur**
L'inscription sur RPGuard est gratuite et ouverte à toute personne majeure ou disposant de l'autorisation parentale. Chaque utilisateur doit fournir un nom d'utilisateur unique, une adresse email valide et un mot de passe sécurisé. L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants. Toute usurpation d'identité ou création de comptes multiples dans le but de manipuler les votes ou les statistiques est strictement interdite et entraînera la suspension immédiate du ou des comptes concernés.

**Article 4 — Dépôt de plainte**
Tout utilisateur inscrit peut déposer une plainte contre un administrateur de serveur de jeu RP. La plainte doit contenir les informations suivantes : nom du jeu ou serveur concerné, catégorie de jeu, nom ou pseudonyme de l'administrateur mis en cause, description factuelle et détaillée de l'abus allégué. L'utilisateur est fortement encouragé à joindre des preuves tangibles (captures d'écran, enregistrements, logs de conversation) pour étayer sa plainte. Les plaintes accompagnées de preuves solides bénéficient d'un badge de vérification augmentant leur crédibilité auprès de la communauté.

**Article 5 — Véracité et bonne foi**
L'utilisateur s'engage à déposer uniquement des plaintes véridiques, fondées sur des faits réels et vérifiables. Toute plainte mensongère, diffamatoire ou déposée dans le but de nuire à la réputation d'un administrateur ou d'un serveur sans fondement légitime constitue une violation grave du présent règlement. Les plaintes jugées fausses ou malveillantes seront rejetées et pourront entraîner la suspension ou la suppression du compte de l'auteur. RPGuard se réserve le droit de transmettre les informations aux autorités compétentes en cas de diffamation avérée.

**Article 6 — Respect et civilité**
Les utilisateurs s'engagent à adopter un comportement respectueux envers les autres membres de la communauté, les administrateurs de serveurs et l'équipe de modération de RPGuard. Sont strictement interdits : les propos injurieux, diffamatoires, racistes, sexistes, homophobes ou discriminatoires de toute nature, les menaces, le harcèlement, les appels à la violence, la divulgation d'informations personnelles sans consentement. Tout manquement à ces règles entraînera des sanctions pouvant aller de l'avertissement à la suppression définitive du compte.

**Article 7 — Système de votes et commentaires**
Les utilisateurs inscrits peuvent voter sur les plaintes déposées (upvote pour soutenir, downvote pour contester) et publier des commentaires. Chaque utilisateur ne peut voter qu'une seule fois par plainte, mais peut modifier son vote. Les votes et commentaires doivent refléter une opinion sincère et argumentée. Toute manipulation du système de votes (création de faux comptes, coordination de votes massifs, spam de commentaires) est strictement interdite. Les commentaires doivent respecter les règles de civilité énoncées à l'Article 6.

**Article 8 — Signalement de fausses plaintes**
Tout utilisateur peut signaler une plainte qu'il estime fausse ou abusive. Lorsqu'une plainte reçoit un nombre significatif de signalements (seuil fixé à 5 signalements), elle est automatiquement soumise à révision par l'équipe de modération. Les signalements abusifs ou répétés sans fondement peuvent entraîner des sanctions à l'encontre de l'auteur des signalements. Le signalement doit être utilisé de manière responsable et uniquement lorsque l'utilisateur a des raisons légitimes de douter de la véracité d'une plainte.

**Article 9 — Modération et traitement des plaintes**
L'équipe de modération de RPGuard examine les plaintes déposées et peut modifier leur statut : « En attente » (statut initial), « Validée » (plainte jugée légitime et fondée), « Rejetée » (plainte jugée fausse, non fondée ou non conforme au règlement). La modération se réserve le droit de supprimer toute plainte violant le présent règlement. Les décisions de modération sont prises de manière impartiale sur la base des preuves fournies et des règles établies. Les utilisateurs peuvent contester une décision de modération en contactant l'équipe via la page de contact.

**Article 10 — Protection des données personnelles**
RPGuard s'engage à protéger les données personnelles des utilisateurs conformément à la réglementation en vigueur. Les informations collectées (nom d'utilisateur, email, question de sécurité) sont utilisées uniquement pour le fonctionnement de la plateforme et ne sont jamais partagées avec des tiers sans consentement explicite. Les preuves téléchargées (captures d'écran, enregistrements) sont stockées de manière sécurisée. Les utilisateurs disposent d'un droit d'accès, de rectification et de suppression de leurs données personnelles.

**Article 11 — Propriété intellectuelle**
Les contenus publiés par les utilisateurs (plaintes, commentaires, preuves) restent la propriété de leurs auteurs. En publiant un contenu sur RPGuard, l'utilisateur accorde à la plateforme une licence non exclusive d'utilisation, de reproduction et de diffusion de ce contenu dans le cadre du fonctionnement de la plateforme. L'utilisateur garantit disposer de tous les droits nécessaires sur les contenus qu'il publie et s'engage à ne pas violer les droits de propriété intellectuelle de tiers.

**Article 12 — Responsabilité de la plateforme**
RPGuard agit en tant qu'hébergeur de contenus générés par les utilisateurs. La plateforme ne peut être tenue responsable des contenus publiés par les utilisateurs, sous réserve qu'elle agisse promptement pour retirer tout contenu manifestement illicite dès qu'elle en a connaissance. RPGuard ne garantit pas l'exactitude, la véracité ou la légalité des plaintes déposées. La plateforme ne peut être tenue responsable des conséquences résultant de l'utilisation des informations publiées par les utilisateurs.

**Article 13 — Sanctions et suspension de compte**
En cas de violation du présent règlement, RPGuard se réserve le droit d'appliquer les sanctions suivantes : avertissement, suppression de contenu, suspension temporaire du compte, suppression définitive du compte. La gravité de la sanction est déterminée en fonction de la nature et de la récurrence de la violation. Les utilisateurs sanctionnés sont informés par email des motifs de la sanction. En cas de suspension ou suppression de compte, l'utilisateur perd l'accès à toutes les fonctionnalités de la plateforme.

**Article 14 — Modification du règlement**
RPGuard se réserve le droit de modifier le présent règlement à tout moment. Les utilisateurs sont informés des modifications par notification sur la plateforme et par email. La poursuite de l'utilisation de la plateforme après modification du règlement vaut acceptation des nouvelles dispositions. Il est de la responsabilité de chaque utilisateur de consulter régulièrement le règlement pour prendre connaissance des éventuelles modifications.

**Article 15 — Droit applicable et juridiction compétente**
Le présent règlement est soumis au droit français. En cas de litige relatif à l'interprétation ou à l'exécution du présent règlement, les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux français seront seuls compétents pour connaître du litige.

#### 4.10.4 Affichage des articles
- Chaque article est affiché avec son numéro, son titre et son contenu complet
- Sous chaque article : afficher le compteur « X dossiers citent cet article » avec le nombre réel de plaintes ayant cité cet article
- Espacement généreux entre les articles pour faciliter la lecture
- Typographie claire et hiérarchisée

#### 4.10.5 Référencement dans la navigation
- Lien « Règlement » dans le menu principal de navigation
- Lien « Règlement de la plateforme » dans le footer

### 4.11 Page contact/signalement

#### 4.11.1 Formulaire de contact
- Champs : nom, email, sujet, message
- Envoi du message via Edge Function
- Enregistrement dans la base de données pour suivi

#### 4.11.2 Signalement de problème technique
- Formulaire dédié pour signaler un bug ou problème technique
- Champs : description du problème, capture d'écran (optionnel)
- Enregistrement via Supabase Database

### 4.12 Panel administrateur

#### 4.12.1 Accès
- Accessible uniquement aux utilisateurs avec rôle administrateur
- Vérification du rôle via Supabase RLS

#### 4.12.2 Gestion des plaintes
- Liste de toutes les plaintes avec filtres avancés (statut, date, nombre de signalements)
- Actions possibles : changer le statut (En attente, Validée, Rejetée), supprimer une plainte, citer un article du règlement
- Afficher les signalements associés à chaque plainte
- Lors du changement de statut d'une plainte : afficher une liste déroulante permettant de sélectionner un article du règlement (Article 1 à Article 15)
- L'administrateur peut sélectionner un article dans la liste déroulante (optionnel)
- Si un article est sélectionné : enregistrer la référence à l'article dans le champ cited_article de la table plaintes
- Modification du statut et enregistrement de l'article cité via Edge Function

#### 4.12.3 Gestion des utilisateurs
- Liste de tous les utilisateurs avec informations : nom d'utilisateur, email, date d'inscription, nombre de plaintes déposées
- Actions possibles : suspendre un utilisateur, supprimer un utilisateur
- Gestion via Supabase Database et Auth

#### 4.12.4 Statistiques
- Tableau de bord avec statistiques globales : nombre total de plaintes, nombre de plaintes par statut, nombre d'utilisateurs actifs, nombre de votes, nombre de commentaires
- Graphiques visuels pour les tendances (plaintes par jour, par catégorie, etc.)
- Données calculées via Edge Functions et affichées en temps réel

### 4.13 Catégories de jeux

#### 4.13.1 Page de catégorie
- Afficher les plaintes filtrées par catégorie sélectionnée (GTA RP, ONESTATE RP, Autres jeux RP, Autres jeux)
- Même affichage et fonctionnalités que la liste des plaintes

## 5. Services backend Supabase

### 5.1 Base de données

#### 5.1.1 Table users
- id (UUID, clé primaire)
- username (texte, unique)
- email (texte, unique)
- role (enum : user, admin, par défaut user)
- security_question_id (UUID, référence security_questions.id)
- security_answer_hash (texte)
- created_at (timestamp)

#### 5.1.2 Table security_questions
- id (UUID, clé primaire)
- question (texte)

#### 5.1.3 Table categories
- id (UUID, clé primaire)
- name (texte : GTA RP, ONESTATE RP, Autres jeux RP, Autres jeux)

#### 5.1.4 Table abuse_categories
- id (UUID, clé primaire)
- name (texte : Abus de pouvoir, Fausse preuve, Discrimination, Sanction injustifiée, Autre)
- applicable_article (texte : référence à l'article du règlement)

#### 5.1.5 Table plaintes
- id (UUID, clé primaire)
- user_id (UUID, référence users.id)
- category_id (UUID, référence categories.id)
- abuse_category_id (UUID, référence abuse_categories.id)
- game_server_name (texte)
- admin_name (texte)
- description (texte)
- status (enum : En attente, Validée, Rejetée)
- has_strong_evidence (booléen, pour badge de vérification)
- is_compliant (booléen, pour badge de conformité)
- cited_article (texte, nullable, pour référence à un article du règlement)
- created_at (timestamp)
- updated_at (timestamp)

#### 5.1.6 Table votes
- id (UUID, clé primaire)
- plainte_id (UUID, référence plaintes.id)
- user_id (UUID, référence users.id)
- vote_type (enum : upvote, downvote)
- created_at (timestamp)
- Contrainte unique : (plainte_id, user_id)

#### 5.1.7 Table commentaires
- id (UUID, clé primaire)
- plainte_id (UUID, référence plaintes.id)
- user_id (UUID, référence users.id)
- content (texte)
- created_at (timestamp)

#### 5.1.8 Table signalements
- id (UUID, clé primaire)
- plainte_id (UUID, référence plaintes.id)
- user_id (UUID, référence users.id)
- created_at (timestamp)

#### 5.1.9 Table preuves
- id (UUID, clé primaire)
- plainte_id (UUID, référence plaintes.id)
- file_path (texte, chemin dans Supabase Storage)
- created_at (timestamp)

#### 5.1.10 Table notifications
- id (UUID, clé primaire)
- user_id (UUID, référence users.id)
- plainte_id (UUID, référence plaintes.id, nullable)
- type (enum : nouveau_commentaire, changement_statut, nouveau_vote)
- message (texte)
- is_read (booléen, par défaut false)
- created_at (timestamp)

#### 5.1.11 Table contact_messages
- id (UUID, clé primaire)
- name (texte)
- email (texte)
- subject (texte)
- message (texte)
- created_at (timestamp)

#### 5.1.12 Table conversations
- id (UUID, clé primaire)
- user1_id (UUID, référence users.id)
- user2_id (UUID, référence users.id)
- created_at (timestamp)
- Contrainte unique : (user1_id, user2_id)

#### 5.1.13 Table messages
- id (UUID, clé primaire)
- conversation_id (UUID, référence conversations.id)
- sender_id (UUID, référence users.id)
- content (texte, nullable)
- message_type (enum : text, voice)
- voice_file_path (texte, nullable, chemin dans Supabase Storage)
- is_read (booléen, par défaut false)
- created_at (timestamp)

### 5.2 Authentification Supabase
- Utiliser Supabase Auth avec méthode email/password
- Gestion des sessions utilisateur
- Vérification de l'authentification pour les actions protégées
- Gestion des rôles (user, admin) via champ role dans table users

### 5.3 Supabase Storage
- Bucket dédié pour les screenshots/preuves
- Stockage des fichiers uploadés lors du dépôt de plainte
- Génération d'URLs publiques pour affichage des preuves
- Bucket dédié pour les messages vocaux
- Stockage des fichiers audio enregistrés
- Génération d'URLs pour lecture des messages vocaux

### 5.4 Row Level Security (RLS)
- Lecture publique des plaintes, votes, commentaires
- Création de plainte : uniquement utilisateurs authentifiés
- Création de vote : uniquement utilisateurs authentifiés
- Création de commentaire : uniquement utilisateurs authentifiés
- Création de signalement : uniquement utilisateurs authentifiés
- Modification/suppression de plainte : uniquement par l'auteur ou administrateur
- Accès aux notifications : uniquement par l'utilisateur concerné
- Accès au panel administrateur : uniquement utilisateurs avec rôle admin
- Modification du statut de plainte : uniquement administrateurs
- Gestion des utilisateurs : uniquement administrateurs
- Accès aux conversations : uniquement par les participants de la conversation
- Création de conversation : uniquement utilisateurs authentifiés
- Création de message : uniquement par les participants de la conversation
- Lecture de message : uniquement par les participants de la conversation

### 5.5 Edge Functions
- Fonction pour comptage des votes (upvote - downvote)
- Fonction pour gestion des signalements multiples (marquer plainte pour modération si seuil atteint)
- Fonction pour mise à jour du statut de plainte par modération
- Fonction pour attribution automatique du badge de vérification si preuves solides
- Fonction pour calcul des scores serveurs en temps réel
- Fonction pour vérification de la réponse à la question de sécurité lors de la récupération de mot de passe
- Fonction pour envoi des messages de contact
- Fonction pour création de notifications lors d'événements (nouveau commentaire, changement de statut, nouveau vote)
- Fonction pour création de conversation entre deux utilisateurs
- Fonction pour envoi de message dans une conversation
- Fonction pour enregistrement de l'article cité lors du changement de statut d'une plainte
- Fonction pour comptage du nombre de plaintes citant chaque article du règlement
- Fonction pour génération de PDF incluant les informations de la plainte et l'article cité

### 5.6 Supabase Realtime
- Abonnement en temps réel aux nouvelles plaintes pour mise à jour du compteur sur la page d'accueil
- Abonnement en temps réel aux notifications pour l'utilisateur connecté
- Abonnement en temps réel aux scores serveurs pour mise à jour automatique
- Abonnement en temps réel aux messages d'une conversation pour mise à jour instantanée
- Abonnement en temps réel aux conversations pour mise à jour de la liste des conversations
- Abonnement en temps réel aux compteurs d'articles cités pour mise à jour de la page règlement

### 5.7 Scheduled Tasks
- Tâche planifiée pour nettoyage des notifications anciennes (plus de 30 jours)
- Tâche planifiée pour calcul et mise à jour des scores serveurs (toutes les heures)

## 6. Règles métier et logique

### 6.1 Gestion des statuts de plainte
- Statut initial : « En attente »
- Statut « Validée » : plainte jugée légitime par la modération
- Statut « Rejetée » : plainte jugée fausse ou non fondée par la modération
- Changement de statut uniquement par les administrateurs via panel admin

### 6.2 Badge de vérification
- Attribué automatiquement aux plaintes avec au moins une preuve (screenshot) uploadée
- Attribution gérée par Edge Function lors de la création de la plainte

### 6.3 Badge de conformité
- Attribué automatiquement aux plaintes dont la checklist de conformité a été validée (3 cases cochées)
- Badge vert « Conforme au règlement » si is_compliant = true
- Badge gris « Non vérifié » si is_compliant = false
- Attribution gérée lors de la création de la plainte

### 6.4 Checklist de conformité
- 3 cases à cocher obligatoires lors du dépôt de plainte
- Case 1 : Article 4 — Dépôt de plainte
- Case 2 : Article 5 — Véracité et bonne foi
- Case 3 : Article 7 — Système de votes et commentaires
- Si les 3 cases ne sont pas cochées : bouton de soumission désactivé
- Si les 3 cases sont cochées : is_compliant = true, badge de conformité vert

### 6.5 Encart contextuel article applicable
- Afficher un encart selon la catégorie d'abus sélectionnée
- Correspondances :
  + Abus de pouvoir → Article 4
  + Fausse preuve → Article 7
  + Discrimination → Article 6
  + Sanction injustifiée → Article 5
  + Autre → Article 4
- Contenu de l'encart : titre de l'article + résumé court (2-3 lignes)

### 6.6 Système de votes
- Un utilisateur connecté peut voter (upvote ou downvote) une seule fois par plainte
- Un utilisateur peut modifier son vote (passer de upvote à downvote ou inversement)
- Le score total = nombre d'upvotes - nombre de downvotes
- Gestion des votes via Edge Function pour garantir l'unicité et la cohérence

### 6.7 Système de signalement
- Un utilisateur connecté peut signaler une plainte comme fausse
- Plusieurs signalements sur une même plainte (seuil : 5 signalements) déclenchent une révision par la modération
- Edge Function vérifie le nombre de signalements et marque la plainte pour modération si seuil atteint
- La modération peut changer le statut de la plainte en « Rejetée » si jugée fausse

### 6.8 Commentaires
- Seuls les utilisateurs connectés peuvent commenter
- Les commentaires sont publics et visibles par tous
- Création d'une notification pour l'auteur de la plainte lors d'un nouveau commentaire

### 6.9 Preuves/Screenshots
- Les fichiers téléchargés sont stockés dans Supabase Storage
- Les preuves sont affichées dans le détail de la plainte via URLs publiques

### 6.10 Compteur en temps réel
- Le compteur de nouvelles plaintes sur la page d'accueil se met à jour automatiquement via Supabase Realtime
- Affiche le nombre de plaintes déposées dans les dernières 24 heures

### 6.11 Notifications
- Création automatique de notifications lors d'événements : nouveau commentaire sur une plainte de l'utilisateur, changement de statut d'une plainte de l'utilisateur, nouveau vote sur une plainte de l'utilisateur
- Notifications gérées via Edge Functions
- Affichage en temps réel via Supabase Realtime

### 6.12 Scores serveurs
- Score calculé pour chaque serveur basé sur : nombre total de plaintes, nombre de plaintes validées, votes de la communauté
- Formule de calcul : Score = (nombre de plaintes validées × 10) + (total des votes négatifs) - (total des votes positifs)
- Score plus élevé = serveur avec plus de problèmes
- Calcul effectué via Edge Function et Scheduled Task (mise à jour toutes les heures)
- Affichage en temps réel via Supabase Realtime

### 6.13 Récupération de mot de passe
- Utilisateur saisit son email
- Système affiche la question de sécurité associée au compte
- Utilisateur saisit la réponse
- Edge Function vérifie la réponse (comparaison avec hash stocké)
- Si réponse correcte : permettre la réinitialisation du mot de passe via Supabase Auth
- Si réponse incorrecte : afficher un message d'erreur, limiter les tentatives (3 tentatives maximum)

### 6.14 Rôles et permissions
- Rôle « user » : peut déposer des plaintes, voter, commenter, signaler, utiliser la messagerie
- Rôle « admin » : peut tout faire + accès au panel admin (gestion des plaintes, utilisateurs, statistiques)
- Vérification des rôles via Supabase RLS

### 6.15 Messagerie en temps réel
- Seuls les utilisateurs connectés peuvent accéder à la messagerie
- Un utilisateur peut rechercher d'autres utilisateurs par nom d'utilisateur
- Un utilisateur peut démarrer une conversation avec un autre utilisateur
- Une conversation est créée entre deux utilisateurs via Edge Function
- Les messages sont envoyés et reçus en temps réel via Supabase Realtime
- Les messages peuvent contenir du texte et des emojis
- Les messages vocaux sont enregistrés via le microphone de l'appareil
- Les fichiers audio des messages vocaux sont stockés dans Supabase Storage
- Les messages vocaux sont lus via un lecteur audio dans l'interface
- Les messages sont affichés en bulles (style iMessage/WhatsApp)
- Les messages de l'utilisateur connecté sont alignés à droite
- Les messages du contact sont alignés à gauche
- Les conversations sont triées par date du dernier message
- Les messages non lus sont indiqués visuellement

### 6.16 Règlement de la plateforme
- Le règlement est accessible publiquement à tous les utilisateurs
- Le règlement contient 15 articles détaillés couvrant tous les aspects de l'utilisation de la plateforme
- Les administrateurs peuvent citer des articles du règlement lors du traitement des plaintes
- La référence à un article est enregistrée dans le champ cited_article de la table plaintes
- Chaque article affiche un compteur du nombre de plaintes citant cet article
- Le compteur est calculé via Edge Function et mis à jour en temps réel via Supabase Realtime

### 6.17 Citation d'articles du règlement par les administrateurs
- Lors du changement de statut d'une plainte dans le panel admin, l'administrateur peut sélectionner un article du règlement dans une liste déroulante
- La liste déroulante contient les 15 articles numérotés (Article 1 à Article 15)
- La sélection d'un article est optionnelle
- Si un article est sélectionné, la référence est enregistrée dans le champ cited_article de la table plaintes
- L'article cité est affiché sur la page de détail de la plainte côté utilisateur avec son titre et un résumé court (2-3 lignes)

### 6.18 Export PDF
- Accessible à l'auteur de la plainte et aux administrateurs
- Le PDF contient toutes les informations de la plainte : nom du jeu/serveur, nom de l'administrateur, description, preuves, timeline, votes, commentaires
- Si un article a été cité par la modération : afficher le titre de l'article ET son résumé (2-3 lignes) dans le PDF
- Génération du PDF via Edge Function

## 7. Cas exceptionnels et limites

| Situation | Comportement attendu |
|-----------|----------------------|
| Utilisateur non connecté tente de déposer une plainte | Redirection vers la page de connexion |
| Utilisateur non connecté tente de voter | Redirection vers la page de connexion |
| Utilisateur non connecté tente de commenter | Redirection vers la page de connexion |
| Utilisateur non connecté tente d'accéder à la messagerie | Redirection vers la page de connexion |
| Formulaire de dépôt incomplet | Afficher un message d'erreur, empêcher la soumission |
| Checklist de conformité non validée | Bouton de soumission désactivé avec message explicatif |
| Aucune plainte ne correspond aux filtres | Afficher un message « Aucune plainte trouvée » |
| Utilisateur tente de voter deux fois sur la même plainte | Remplacer le vote précédent par le nouveau via Edge Function |
| Plainte signalée 5 fois ou plus | Marquer la plainte pour révision modération via Edge Function |
| Échec d'upload de screenshot | Afficher un message d'erreur, permettre de réessayer |
| Session expirée | Redirection vers la page de connexion |
| Compteur en temps réel ne se met pas à jour | Afficher la dernière valeur connue |
| Réponse incorrecte à la question de sécurité | Afficher un message d'erreur, limiter à 3 tentatives |
| Utilisateur non admin tente d'accéder au panel admin | Redirection vers la page d'accueil avec message d'erreur |
| Échec de connexion Supabase Realtime | Afficher les données en mode statique, proposer de rafraîchir |
| Utilisateur tente de démarrer une conversation avec lui-même | Afficher un message d'erreur, empêcher la création |
| Échec d'enregistrement de message vocal | Afficher un message d'erreur, permettre de réessayer |
| Échec d'upload de message vocal | Afficher un message d'erreur, permettre de réessayer |
| Aucun résultat de recherche d'utilisateur | Afficher un message « Aucun utilisateur trouvé » |
| Conversation ne se met pas à jour en temps réel | Afficher les derniers messages connus, proposer de rafraîchir |
| Échec de lecture de message vocal | Afficher un message d'erreur |
| Administrateur ne sélectionne pas d'article lors du changement de statut | Le champ cited_article reste vide (null) |
| Échec de génération de PDF | Afficher un message d'erreur |
| Compteur d'articles cités ne se met pas à jour | Afficher la dernière valeur connue |

## 8. Critères de validation

1. Un utilisateur s'inscrit avec un nom d'utilisateur, email, mot de passe et question de sécurité
2. L'utilisateur se connecte avec ses identifiants
3. L'utilisateur accède au formulaire de dépôt de plainte
4. L'utilisateur remplit le formulaire (nom du jeu/serveur, catégorie, catégorie d'abus, nom de l'administrateur, description, preuves)
5. L'utilisateur voit l'encart contextuel affichant l'article applicable selon la catégorie d'abus sélectionnée
6. L'utilisateur coche les 3 cases de la checklist de conformité
7. L'utilisateur soumet la plainte
8. La plainte apparaît dans la liste des plaintes avec statut « En attente », badge de vérification et badge de conformité vert
9. Un autre utilisateur consulte le détail de la plainte, vote (upvote) et ajoute un commentaire
10. L'auteur de la plainte reçoit une notification en temps réel
11. L'auteur de la plainte accède à son tableau de bord et visualise sa plainte avec le vote et le commentaire reçus
12. Un administrateur accède au panel admin, change le statut de la plainte en « Validée » et sélectionne « Article 4 — Dépôt de plainte » dans la liste déroulante
13. L'utilisateur consulte le détail de la plainte et voit l'article cité affiché avec son titre et son résumé
14. L'utilisateur exporte la plainte en PDF et vérifie que l'article cité apparaît dans le PDF
15. L'utilisateur consulte la page Règlement RPGuard et voit le compteur « 1 dossier cite cet article » sous l'Article 4
16. L'utilisateur consulte la page scores serveurs et voit le score du serveur concerné mis à jour en temps réel
17. L'utilisateur accède à la messagerie et recherche un autre utilisateur
18. L'utilisateur démarre une conversation avec l'utilisateur trouvé
19. L'utilisateur envoie un message texte avec emoji
20. L'utilisateur enregistre et envoie un message vocal
21. L'autre utilisateur reçoit les messages en temps réel et répond

## 9. Fonctionnalités non incluses dans cette version

- Notifications par email ou push
- Système de badges ou récompenses pour les utilisateurs actifs
- Modération automatique par intelligence artificielle
- Statistiques avancées par serveur ou administrateur
- Système de réputation pour les administrateurs
- Intégration avec les plateformes de jeux (API)
- Multilingue (autres langues que le français)
- Mode sombre/clair
- Recherche avancée avec opérateurs booléens
- Historique des modifications de plainte
- Système de tags personnalisés
- Gestion avancée des rôles (modérateur, super-admin)
- Système de récompenses pour les contributeurs actifs
- Partage sur les réseaux sociaux
- Système de suivi par email des plaintes
- Comparaison de serveurs
- Classement des serveurs par nombre de plaintes
- Système de vérification d'identité des utilisateurs
- Système de médiation entre joueurs et administrateurs
- Forum de discussion
- Système de tickets de support
- Analyse de sentiment des commentaires
- Système de parrainage
- Programme de fidélité
- Appels vocaux ou vidéo dans la messagerie
- Partage de fichiers (images, documents) dans la messagerie
- Messagerie de groupe
- Statut en ligne/hors ligne des utilisateurs
- Accusés de réception des messages
- Suppression ou modification de messages envoyés
- Recherche dans l'historique des messages
- Archivage de conversations
- Modification du règlement par les administrateurs via interface
- Versioning du règlement
- Notification automatique des modifications du règlement
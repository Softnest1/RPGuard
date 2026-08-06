import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, ArrowLeft, AlertTriangle, Star, Swords, ArrowRight,
  FileText, UserCheck, ClipboardList, Camera, Scale,
  MessageSquare, Flag, Settings, Lock, BookOpen,
  BadgeCheck, Ban, RefreshCw, Gavel, Globe,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageMeta from '@/components/common/PageMeta';

// ── Données des 15 articles ────────────────────────────────────────────────────

interface Article {
  num: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  paragraphs: string[];
  items?: string[];
  tag?: string; // catégorie affichée en badge
}

const ARTICLES: Article[] = [
  {
    num: '01',
    icon: Globe,
    tag: 'Fondements',
    title: 'Objet et champ d\'application',
    subtitle: 'Ce que RPGuard est, et à qui il s\'adresse',
    paragraphs: [
      'RPGuard est une plateforme communautaire indépendante dédiée à la transparence et à la protection des joueurs de jeux vidéo de type RolePlay (GTA RP, ONESTATE RP, et tout autre jeu RP). Elle permet à tout joueur victime d\'un abus de pouvoir commis par un administrateur de serveur de déposer un signalement public, documenté et soumis au vote de la communauté.',
      'Le présent règlement s\'applique à toute personne qui accède à RPGuard, qu\'elle soit inscrite ou simple visiteur. En naviguant sur la plateforme, chaque utilisateur reconnaît avoir pris connaissance de l\'ensemble des dispositions ci-dessous et s\'engage à les respecter sans réserve.',
      'RPGuard se positionne comme un outil de transparence, non comme une juridiction. Aucune décision prise sur la plateforme ne vaut jugement légal. Les informations publiées reflètent les déclarations des utilisateurs, soumises au contrôle communautaire et à la modération interne.',
    ],
  },
  {
    num: '02',
    icon: BookOpen,
    tag: 'Fondements',
    title: 'Définitions officielles',
    subtitle: 'Le vocabulaire RPGuard que tout membre doit connaître',
    paragraphs: [
      'Les termes suivants ont une signification précise sur RPGuard et sont utilisés de manière cohérente dans toute communication officielle, y compris lors des décisions de modération.',
    ],
    items: [
      '**Utilisateur** : toute personne physique inscrite sur RPGuard, disposant d\'un compte actif.',
      '**Plainte / Dossier** : signalement déposé par un utilisateur contre un administrateur de serveur, accompagné d\'une description factuelle et, idéalement, de preuves.',
      '**Administrateur de serveur** : toute personne disposant de droits de modération ou d\'administration sur un serveur de jeu RP (staff, admin, co-fondateur, owner).',
      '**Abus de pouvoir** : utilisation injustifiée, arbitraire ou discriminatoire des droits d\'administration, incluant : ban sans motif, favoritisme, harcèlement via les outils de modération, violation du règlement interne du serveur.',
      '**Preuve** : tout élément tangible attestant des faits allégués — capture d\'écran non modifiée, enregistrement vidéo, log de conversation, témoignage corroboré.',
      '**Modération RPGuard** : équipe interne chargée de vérifier la conformité des dossiers, d\'appliquer les sanctions et de statuer sur les contestations.',
      '**Article cité** : référence explicite à un article du présent règlement, utilisée par la modération lors du traitement d\'un dossier (ex. « Article 05 — Véracité »).',
      '**Score dossier** : indicateur calculé à partir des votes, preuves et commentaires, reflétant la crédibilité perçue d\'un signalement par la communauté.',
    ],
  },
  {
    num: '03',
    icon: UserCheck,
    tag: 'Compte',
    title: 'Inscription et identité numérique',
    subtitle: 'Un compte = une personne réelle, une responsabilité entière',
    paragraphs: [
      'L\'inscription sur RPGuard est gratuite, ouverte à toute personne souhaitant contribuer à une communauté RP plus juste. Chaque compte doit être associé à une adresse email valide et à un nom d\'utilisateur unique, choisi librement mais soumis aux restrictions de l\'Article 06.',
      'Chaque utilisateur est responsable de la confidentialité de ses identifiants. Toute action effectuée depuis un compte est réputée avoir été réalisée par son titulaire. En cas de compromission du compte, l\'utilisateur doit en informer RPGuard sans délai via la page de contact.',
      'La création de comptes multiples à des fins de manipulation des votes, des statistiques ou de contournement d\'une sanction est strictement interdite. RPGuard se réserve le droit de détecter et de supprimer les comptes doublons sans préavis.',
    ],
  },
  {
    num: '04',
    icon: ClipboardList,
    tag: 'Dossiers',
    title: 'Dépôt d\'un dossier — conditions et exigences',
    subtitle: 'Comment soumettre un signalement valide et efficace',
    paragraphs: [
      'Pour être recevable, un dossier doit impérativement contenir : le nom exact du serveur ou jeu concerné, la catégorie de jeu (GTA RP, ONESTATE RP, autre), le pseudonyme en jeu de l\'administrateur mis en cause, et une description factuelle de l\'incident, rédigée à la première personne, sans injure ni spéculation.',
      'L\'utilisateur est fortement encouragé à joindre des preuves lors du dépôt. Un dossier sans preuve reste publié mais ne bénéficie pas du badge de vérification et pèse moins dans le score communautaire. Les dossiers accompagnés de preuves solides (captures d\'écran, vidéos, logs) reçoivent un badge « Preuves vérifiées ».',
      'Un même utilisateur peut déposer plusieurs dossiers concernant des serveurs différents, mais ne peut pas déposer deux dossiers identiques contre le même administrateur du même serveur. Les doublons seront fusionnés ou supprimés par la modération.',
    ],
    items: [
      'Décrire les faits de manière chronologique et précise.',
      'Indiquer la date approximative de l\'incident si connue.',
      'Ne citer que des pseudonymes en jeu, jamais des données personnelles réelles.',
      'Joindre au minimum une capture d\'écran pour obtenir le badge de vérification.',
      'Relire et vérifier l\'exactitude des informations avant soumission.',
    ],
  },
  {
    num: '05',
    icon: Scale,
    tag: 'Éthique',
    title: 'Véracité, bonne foi et responsabilité personnelle',
    subtitle: 'La base de toute communauté de confiance',
    paragraphs: [
      'RPGuard repose sur la bonne foi de ses membres. Chaque utilisateur qui dépose un dossier certifie, sur l\'honneur, que les faits décrits sont réels, qu\'ils se sont produits sur le serveur mentionné, et que les preuves fournies sont authentiques et non manipulées.',
      'Toute plainte délibérément mensongère, déposée dans le but de nuire à la réputation d\'un serveur ou d\'un administrateur sans fondement légitime, constitue une faute grave. Elle exposera son auteur à une suspension immédiate et définitive, ainsi qu\'à une éventuelle signalisation aux autorités compétentes en cas de diffamation caractérisée.',
      'RPGuard ne peut pas vérifier chaque fait de manière indépendante. La communauté, via les votes et commentaires, joue un rôle de contre-pouvoir essentiel. Les utilisateurs sont encouragés à commenter les dossiers qu\'ils estiment suspects plutôt que de les signaler abusivement.',
    ],
  },
  {
    num: '06',
    icon: MessageSquare,
    tag: 'Comportement',
    title: 'Respect, civilité et comportement communautaire',
    subtitle: 'Ce qui est attendu de chaque membre RPGuard',
    paragraphs: [
      'RPGuard est un espace communautaire. Le respect mutuel est non négociable, aussi bien envers les autres utilisateurs qu\'envers les administrateurs mis en cause. Critiquer un comportement est légitime ; insulter une personne ne l\'est pas.',
    ],
    items: [
      '**Interdits absolus** : injures, menaces, harcèlement, propos racistes, sexistes, homophobes ou discriminatoires de toute nature.',
      '**Interdits dans les commentaires** : appels à la violence ou au boycott organisé, partage de données personnelles réelles (adresse, téléphone, identité civile), spam et messages hors-sujet répétés.',
      '**Encouragés** : témoignages corroborants factuels, analyses constructives du dossier, partage de preuves complémentaires, soutien sans exagération.',
      '**Rappel** : la réputation d\'un administrateur peut être impactée par un dossier. Tout commentaire doit être rédigé avec discernement et responsabilité.',
    ],
  },
  {
    num: '07',
    icon: Camera,
    tag: 'Preuves',
    title: 'Preuves — authenticité, formats et restrictions',
    subtitle: 'Ce qui constitue une preuve valide sur RPGuard',
    paragraphs: [
      'La valeur d\'un dossier repose en grande partie sur la qualité des preuves fournies. RPGuard accepte les formats suivants : images (JPG, PNG, WEBP, GIF, HEIC), vidéos (MP4, WEBM, MOV, AVI) et liens vers des contenus externes hébergés sur des plateformes reconnues (YouTube, TikTok, Twitch).',
      'Toute preuve soumise doit être authentique. Sont formellement interdites : les captures d\'écran recadrées pour modifier le contexte, les images éditées avec des ajouts ou suppressions de texte, les vidéos coupées de manière trompeuse, et toute fabrication de logs ou de conversations.',
      'RPGuard se réserve le droit de solliciter des preuves complémentaires ou de rétrograder le statut d\'un dossier si une preuve est jugée insuffisante ou suspecte lors de la modération. Les preuves stockées sur la plateforme sont conservées de manière sécurisée et ne sont jamais partagées en dehors du dossier auquel elles appartiennent.',
    ],
  },
  {
    num: '08',
    icon: BadgeCheck,
    tag: 'Dossiers',
    title: 'Système de votes — règles et intégrité',
    subtitle: 'Le vote communautaire, moteur de crédibilité',
    paragraphs: [
      'Le système de votes permet à la communauté d\'exprimer son soutien (upvote) ou sa contestation (downvote) sur chaque dossier. Le score affiché correspond à la différence entre upvotes et downvotes. Ce score influence directement la visibilité du dossier et son poids dans le classement des serveurs.',
      'Chaque utilisateur dispose d\'un vote par dossier. Il peut modifier son vote à tout moment. Les votes anonymes ou provenant de comptes créés moins de 24 heures avant le dépôt du dossier sont filtrés automatiquement pour prévenir les abus.',
      'Toute tentative de manipulation — achat de votes, coordination de votes en masse via des réseaux externes, utilisation de bots ou de scripts — constitue une violation grave de l\'Article 03 et entraîne la suppression immédiate du compte responsable, ainsi que l\'annulation des votes frauduleux.',
    ],
  },
  {
    num: '09',
    icon: Flag,
    tag: 'Modération',
    title: 'Signalement de dossiers abusifs',
    subtitle: 'Un outil de protection, pas une arme',
    paragraphs: [
      'Le bouton de signalement permet à tout utilisateur connecté de signaler un dossier qu\'il estime faux, abusif ou non conforme au règlement. À partir de cinq signalements distincts sur un même dossier, celui-ci est automatiquement soumis à révision par la modération.',
      'Le signalement est un droit responsable. Il doit être utilisé uniquement lorsque l\'utilisateur a de réelles raisons de douter de la véracité d\'un dossier. Les signalements répétés sans fondement, visant à faire retirer des dossiers légitimes, constituent une tentative de censure et seront sanctionnés.',
      'La modération examine chaque dossier signalé de manière indépendante. Le signalement seul ne suffit pas à retirer un dossier : seule la modération peut décider de le rejeter, après vérification des preuves et du contexte.',
    ],
  },
  {
    num: '10',
    icon: Settings,
    tag: 'Modération',
    title: 'Traitement des dossiers et décisions de modération',
    subtitle: 'Comment RPGuard statue sur chaque signalement',
    paragraphs: [
      'Tout dossier déposé reçoit le statut initial « En attente ». La modération RPGuard examine ensuite le dossier selon trois critères : conformité au règlement, véracité des faits allégués au regard des preuves, et absence de violation des articles 05 et 06.',
      'À l\'issue de cet examen, le statut du dossier est mis à jour : « Validée » si le dossier est jugé légitime et conforme ; « Rejetée » s\'il est jugé non fondé, diffamatoire ou en violation du règlement. Chaque décision peut être accompagnée d\'un article cité, indiquant la règle appliquée.',
      'Les décisions de modération sont définitives sauf contestation explicite soumise via la page de contact dans un délai de sept jours. RPGuard s\'engage à traiter chaque dossier dans un délai raisonnable, sans garantie de délai fixe compte tenu du volume communautaire.',
    ],
    items: [
      '**En attente** : dossier reçu, en cours d\'examen.',
      '**Validée** : dossier reconnu légitime — reste visible, influence le score serveur.',
      '**Rejetée** : dossier non conforme ou non fondé — retiré de la liste publique.',
    ],
  },
  {
    num: '11',
    icon: Lock,
    tag: 'Données',
    title: 'Protection des données personnelles',
    subtitle: 'Ce que RPGuard collecte, stocke et protège',
    paragraphs: [
      'RPGuard collecte uniquement les données nécessaires à son fonctionnement : nom d\'utilisateur, adresse email (non affichée publiquement), question et réponse de sécurité (stockée sous forme de hash irréversible), et les contenus publiés volontairement (dossiers, commentaires, preuves).',
      'Aucune donnée personnelle réelle (nom civil, numéro de téléphone, adresse postale) n\'est demandée ni stockée par RPGuard. Les preuves uploadées sont conservées dans un stockage sécurisé et ne sont accessibles qu\'au travers du dossier auquel elles appartiennent.',
      'Conformément à la réglementation applicable, chaque utilisateur dispose d\'un droit d\'accès, de rectification et de suppression de ses données. Pour exercer ces droits, l\'utilisateur doit contacter RPGuard via la page de contact en précisant sa demande et son identifiant de compte.',
    ],
  },
  {
    num: '12',
    icon: FileText,
    tag: 'Données',
    title: 'Propriété intellectuelle et contenus publiés',
    subtitle: 'À qui appartiennent vos dossiers et preuves',
    paragraphs: [
      'Les contenus publiés sur RPGuard par les utilisateurs (descriptions de dossiers, commentaires, preuves) restent la propriété intellectuelle de leurs auteurs. En les publiant sur la plateforme, l\'utilisateur accorde à RPGuard une licence non exclusive, mondiale et gratuite pour les afficher, reproduire et diffuser dans le cadre strictement nécessaire au fonctionnement de la plateforme.',
      'L\'utilisateur garantit qu\'il dispose de tous les droits nécessaires sur les contenus qu\'il publie et qu\'ils ne violent pas les droits de tiers. RPGuard ne peut être tenu responsable des violations de droits commises par les utilisateurs.',
      'Toute reproduction ou réutilisation des contenus de RPGuard (articles, design, textes éditoriaux) à des fins commerciales sans autorisation préalable écrite est interdite.',
    ],
  },
  {
    num: '13',
    icon: Ban,
    tag: 'Sanctions',
    title: 'Sanctions — avertissements, suspensions et exclusions',
    subtitle: 'Le cadre progressif de réponse aux infractions',
    paragraphs: [
      'RPGuard applique une politique de sanctions progressive, adaptée à la gravité et à la récurrence des infractions. L\'objectif est d\'éduquer avant de sanctionner, sauf dans les cas de violation grave immédiate.',
    ],
    items: [
      '**Niveau 1 — Avertissement** : notification privée détaillant l\'infraction constatée et l\'article du règlement violé. Aucun impact immédiat sur le compte.',
      '**Niveau 2 — Restriction temporaire** : limitation des capacités du compte (vote, commentaire ou dépôt de dossier) pour une durée de 7 à 30 jours selon la gravité.',
      '**Niveau 3 — Suspension temporaire** : accès au compte suspendu pour une durée de 30 à 90 jours. Les dossiers et commentaires de l\'utilisateur restent visibles.',
      '**Niveau 4 — Exclusion définitive** : suppression permanente du compte et de tous ses contenus. Applicable en cas de manipulation avérée, diffamation, harcèlement ou récidive après suspension.',
      '**Bypass de la progressivité** : en cas de violation grave (diffamation intentionnelle, fausses preuves fabriquées, harcèlement caractérisé), RPGuard peut passer directement au niveau 4 sans avertissement préalable.',
    ],
  },
  {
    num: '14',
    icon: RefreshCw,
    tag: 'Évolution',
    title: 'Modification du règlement',
    subtitle: 'Comment RPGuard fait évoluer ses règles',
    paragraphs: [
      'RPGuard se réserve le droit de modifier le présent règlement à tout moment, en réponse à l\'évolution de la communauté, aux nouveaux usages ou aux exigences légales. Toute modification substantielle sera annoncée sur la plateforme avec un préavis d\'au moins sept jours avant son entrée en vigueur.',
      'Les utilisateurs actifs seront notifiés via la section notifications de leur tableau de bord. La date de dernière mise à jour est indiquée en bas de cette page. La poursuite de l\'utilisation de RPGuard après la date d\'entrée en vigueur des nouvelles dispositions vaut acceptation pleine et entière de celles-ci.',
      'Les articles modifiés sont identifiés par la modération lors de la citation dans les décisions. Il est de la responsabilité de chaque utilisateur de consulter régulièrement cette page pour prendre connaissance des mises à jour.',
    ],
  },
  {
    num: '15',
    icon: Gavel,
    tag: 'Légal',
    title: 'Droit applicable, responsabilité et juridiction',
    subtitle: 'Le cadre légal qui encadre RPGuard et ses membres',
    paragraphs: [
      'RPGuard opère en tant qu\'hébergeur de contenus générés par les utilisateurs au sens de la législation française sur la communication en ligne. À ce titre, la plateforme n\'est pas responsable des contenus publiés par les utilisateurs, sous réserve d\'agir promptement pour retirer tout contenu manifestement illicite dès qu\'elle en a connaissance.',
      'Le présent règlement est soumis au droit français. En cas de litige entre un utilisateur et RPGuard relatif à l\'interprétation ou à l\'exécution du présent règlement, les parties s\'efforceront de trouver une solution amiable dans un premier temps. À défaut d\'accord dans un délai de 30 jours, les juridictions françaises compétentes seront saisies.',
      'RPGuard ne garantit pas l\'exactitude, la véracité ou la légalité des contenus publiés par les utilisateurs. Les informations présentes sur la plateforme ne constituent pas un conseil juridique et ne peuvent être utilisées comme telles dans le cadre d\'une procédure judiciaire sans vérification indépendante.',
    ],
  },
];

// ── Badges couleurs par catégorie ────────────────────────────────────────────
const TAG_STYLES: Record<string, string> = {
  'Fondements':  'bg-primary/8 text-primary border border-primary/20',
  'Compte':      'bg-muted text-muted-foreground border border-border',
  'Dossiers':    'bg-muted text-muted-foreground border border-border',
  'Éthique':     'bg-muted text-muted-foreground border border-border',
  'Comportement':'bg-muted text-muted-foreground border border-border',
  'Preuves':     'bg-muted text-muted-foreground border border-border',
  'Modération':  'bg-muted text-muted-foreground border border-border',
  'Données':     'bg-muted text-muted-foreground border border-border',
  'Sanctions':   'bg-destructive/8 text-destructive border border-destructive/20',
  'Évolution':   'bg-muted text-muted-foreground border border-border',
  'Légal':       'bg-muted text-muted-foreground border border-border',
};

// ── Composant Article (expandable) ──────────────────────────────────────────
function ArticleRow({ article, isLast }: { article: Article; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = article.icon;

  // Rendu inline-bold pour les items avec **texte**
  function renderItem(text: string) {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} className="font-semibold text-foreground">{part}</strong>
        : <span key={i}>{part}</span>
    );
  }

  return (
    <div className={`${!isLast ? 'border-b border-border' : ''}`}>
      {/* En-tête cliquable */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex gap-5 md:gap-6 py-7 text-left group"
        aria-expanded={expanded}
      >
        {/* Numéro + icône */}
        <div className="shrink-0 flex flex-col items-center gap-2 w-10">
          <span className="text-xs font-mono text-muted-foreground/40 tabular-nums select-none">
            {article.num}
          </span>
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>

        {/* Titre + chevron */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {article.tag && (
                <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${TAG_STYLES[article.tag] ?? 'bg-muted text-muted-foreground'}`}>
                  {article.tag}
                </span>
              )}
              <h2 className="text-sm font-semibold text-foreground leading-snug">
                Article {article.num} — {article.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{article.subtitle}</p>
            </div>
            <div className="shrink-0 mt-1">
              {expanded
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              }
            </div>
          </div>
        </div>
      </button>

      {/* Contenu déployable */}
      {expanded && (
        <div className="pl-16 md:pl-16 pb-7 flex flex-col gap-4 opacity-0 intersect:opacity-100 transition duration-300">
          {article.paragraphs.map((p, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
          ))}
          {article.items && (
            <ul className="flex flex-col gap-2 mt-1">
              {article.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-2 w-1 h-1 rounded-full bg-primary/50 shrink-0" />
                  <span>{renderItem(item)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function ReglementPage() {
  return (
    <div className="w-full">
      <PageMeta
        title="Règlement RPGuard — 15 articles officiels"
        description="Découvrez les 15 articles du règlement officiel RPGuard : dépôt de dossier, véracité, preuves, votes, modération, sanctions et protection des données."
        keywords="règlement RPGuard, charte, CGU, articles, modération RP, justice communautaire, preuves, sanctions"
      />

      {/* ── Hero ── */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
                Communauté RPGuard — Règlement officiel
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight text-balance">
                Les 15 articles qui fondent notre communauté
              </h1>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mb-6">
            RPGuard a construit son propre cadre de règles pour protéger les joueurs, garantir la crédibilité des dossiers
            et offrir une modération équitable. Ces articles font foi lors de toute décision de modération.
            Cliquez sur un article pour le déployer.
          </p>

          {/* Indicateurs rapides */}
          <div className="flex flex-wrap gap-3">
            {[
              { n: '15', label: 'Articles' },
              { n: '6', label: 'Catégories' },
              { n: '4', label: 'Niveaux de sanction' },
            ].map(({ n, label }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background text-xs text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{n}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Index des catégories ── */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground mr-1">Catégories :</span>
            {['Fondements', 'Compte', 'Dossiers', 'Éthique', 'Comportement', 'Preuves', 'Modération', 'Données', 'Sanctions', 'Légal'].map((tag) => (
              <span
                key={tag}
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TAG_STYLES[tag] ?? 'bg-muted text-muted-foreground'}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Articles ── */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-4">
        {ARTICLES.map((article, i) => (
          <ArticleRow
            key={article.num}
            article={article}
            isLast={i === ARTICLES.length - 1}
          />
        ))}
      </div>

      {/* ── Pied de page légal ── */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 pb-12">
        <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/40">
          <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dernière mise à jour : <span className="font-medium text-foreground">Juillet 2026</span>.{' '}
            Ce règlement constitue les Conditions Générales d'Utilisation (CGU) contraignantes de la plateforme RPGuard.
            Toute décision de modération citant un article fait référence à la version en vigueur à la date de la décision.
          </p>
        </div>

        {/* ── Ressources stratégiques ── */}
        <div className="mt-12 pt-10 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-semibold text-foreground">Ressources pour déposer un dossier solide</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 max-w-lg">
            RPGuard met à votre disposition deux guides complets pour maximiser l'impact de chaque signalement.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3 p-4 rounded-xl border border-border bg-card">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mt-0.5">
                <Star className="w-4 h-4 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-1">Guide de dépôt</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  5 étapes, score de crédibilité, checklist et formulations efficaces pour un dossier à 80+/100.
                </p>
                <Button asChild size="sm" variant="outline" className="rounded-full h-7 text-xs px-3">
                  <Link to="/guide">Lire le guide <ArrowRight className="w-3 h-3 ml-1" /></Link>
                </Button>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center mt-0.5">
                <Swords className="w-4 h-4 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-1">Bouclier joueur</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  8 tactiques de manipulation décodées, 7 droits du joueur et 4 scénarios concrets pour gagner face à un admin qui résiste.
                </p>
                <Button asChild size="sm" variant="outline" className="rounded-full h-7 text-xs px-3">
                  <Link to="/arsenal">Voir le bouclier <ArrowRight className="w-3 h-3 ml-1" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

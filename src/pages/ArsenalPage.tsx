import { Link } from 'react-router-dom';
import { useGoBack } from '@/hooks/use-go-back';
import {
  ArrowLeft, ArrowRight, ShieldAlert, Swords,
  Users, CheckCircle2, AlertTriangle, FileText,
  Scale, Eye, Lock, MessageSquare, Clock,
  Lightbulb, Ban, Quote, Video, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageMeta from '@/components/common/PageMeta';

// ── Tactiques employées par les admins pour annuler une plainte ──────────────

const MANIPULATION_TACTICS = [
  {
    tactic: 'L\'intimidation directe',
    how: 'L\'admin vous ban, vous mute ou menace de "conséquences" si vous maintenez la plainte.',
    counter: 'C\'est une preuve supplémentaire. Capturez la menace immédiatement (screenshot + heure). Une tentative d\'intimidation après un signalement est un abus de pouvoir documenté — ajoutez-la comme preuve dans votre dossier.',
    icon: Ban,
    severity: 'rouge',
  },
  {
    tactic: 'Le déni collectif',
    how: 'Plusieurs membres du staff "témoignent" ensemble pour contredire votre version. "On était tous là, il ment."',
    counter: 'Les témoignages coordonnés d\'une même équipe ne valent pas une vidéo. Votre preuve vidéo écrase n\'importe quel témoignage verbal. Sans preuve de leur côté, leur version ne compte pas.',
    icon: Users,
    severity: 'rouge',
  },
  {
    tactic: 'L\'inversion de la charge',
    how: '« C\'est toi qui as provoqué, c\'est ta faute. » Ils retournent la situation pour vous faire passer pour le fautif.',
    counter: 'Restez factuel et chronologique. Votre description doit raconter les faits dans l\'ordre (contexte → déclencheur → réaction abusive). Si vous avez un contexte qui prouve que vous n\'avez pas provoqué, ajoutez-le dans le champ "Contexte".',
    icon: ArrowRight,
    severity: 'orange',
  },
  {
    tactic: 'L\'attaque sur la forme',
    how: '« Ta plainte n\'est pas valide parce que tu n\'as pas respecté la procédure interne. »',
    counter: 'RPGuard est indépendant de toute procédure interne de serveur. Votre dossier ici est évalué par la communauté. Les règles internes du serveur ne s\'appliquent pas sur cette plateforme.',
    icon: FileText,
    severity: 'orange',
  },
  {
    tactic: 'Le silence organisé',
    how: 'Votre ticket est ignoré, archivé, ou "en cours de traitement" depuis des semaines sans réponse.',
    counter: 'Le silence est une réponse. Notez la date de votre premier signalement interne et l\'absence de réponse — c\'est documentable. Cela renforce votre dossier sur RPGuard : vous avez tenté la voie interne, elle a échoué.',
    icon: Clock,
    severity: 'orange',
  },
  {
    tactic: 'La discréditation personnelle',
    how: '« Il est connu pour faire des fausses plaintes. » Ils attaquent votre réputation plutôt que les faits.',
    counter: 'Votre réputation n\'est pas en jeu ici, les faits le sont. Un dossier solide parle de lui-même. Ne répondez pas aux attaques personnelles — restez sur les preuves uniquement.',
    icon: MessageSquare,
    severity: 'jaune',
  },
  {
    tactic: 'L\'usure par la durée',
    how: 'Ils font durer le processus pour que vous abandonniez.',
    counter: 'Votre plainte RPGuard reste visible indéfiniment. Les votes continuent de s\'accumuler. Le temps joue en votre faveur si votre dossier est solide — chaque nouveau joueur qui découvre l\'incident peut voter.',
    icon: Clock,
    severity: 'jaune',
  },
  {
    tactic: 'Le "règlement interne prévaut"',
    how: '« Chez nous c\'est notre règlement qui s\'applique, pas le tien. »',
    counter: 'RPGuard n\'est pas soumis au règlement privé d\'un serveur. La communauté RP a des standards éthiques qui transcendent les règles internes. Un comportement abusif reste abusif même si le règlement interne l\'autorise.',
    icon: Scale,
    severity: 'jaune',
  },
];

// ── Les 7 droits inaliénables du joueur RP ──────────────────────────────────

const PLAYER_RIGHTS = [
  {
    right: 'Droit à la preuve',
    desc: 'Vous avez le droit d\'enregistrer tout ce qui se passe sur un serveur public. Aucun admin ne peut vous interdire d\'avoir des preuves d\'un abus subi.',
    icon: Video,
  },
  {
    right: 'Droit au signalement externe',
    desc: 'Un serveur privé ne peut pas vous empêcher de signaler un abus sur une plateforme externe comme RPGuard. Toute menace en ce sens est elle-même un abus documentable.',
    icon: Eye,
  },
  {
    right: 'Droit au contradictoire',
    desc: 'Votre version des faits a autant de valeur que celle de l\'admin — voire plus, si elle est étayée par des preuves concrètes.',
    icon: Scale,
  },
  {
    right: 'Droit à la communauté',
    desc: 'La communauté RP entière peut lire, commenter et voter sur votre plainte. L\'avis collectif de centaines de joueurs pèse plus que la parole d\'un admin.',
    icon: Users,
  },
  {
    right: 'Droit à l\'anonymat relatif',
    desc: 'Sur RPGuard, votre pseudo RP est visible mais vos données personnelles restent protégées. Aucun admin ne peut vous "retrouver" via votre signalement.',
    icon: Lock,
  },
  {
    right: 'Droit au temps',
    desc: 'Votre plainte n\'expire pas. Vous pouvez déposer des jours ou semaines après l\'incident — l\'essentiel est d\'avoir les preuves et les détails précis.',
    icon: Clock,
  },
  {
    right: 'Droit à la mise à jour',
    desc: 'Si de nouvelles preuves apparaissent (nouveaux témoins, nouvelles captures), le dossier peut être enrichi. Contactez l\'équipe RPGuard via la page Contact.',
    icon: TrendingUp,
  },
];

// ── Scénarios concrets avec stratégie gagnante ──────────────────────────────

const SCENARIOS = [
  {
    situation: 'Vous avez été banni sans raison valable',
    theyDo: 'L\'admin dit que vous "avez enfreint le règlement" sans préciser lequel.',
    youDo: [
      'Capturez le message de ban ou la notification',
      'Notez la date et l\'heure exactes',
      'Cherchez dans vos logs de chat si vous aviez averti le staff avant',
      'Dans votre description : "banni le [date] sans motif précisé par [pseudo]"',
    ],
    strength: 85,
  },
  {
    situation: 'Un admin abuse de son pouvoir en jeu (teleport, kill, vol)',
    theyDo: 'Aucune sanction n\'est possible selon eux car "c\'est le serveur de [fondateur]".',
    youDo: [
      'Enregistrez l\'écran PENDANT l\'incident — pseudo visible, actions visibles',
      'Notez les coordonnées / zone du jeu si pertinent',
      'Mentionnez si d\'autres joueurs étaient présents (témoins)',
      'Score attendu : 90+ si vidéo + date + contexte',
    ],
    strength: 90,
  },
  {
    situation: 'Harcèlement ou comportement toxique persistant',
    theyDo: 'Ils minimisent : "c\'est du RP, c\'est normal", "t\'es trop sensible".',
    youDo: [
      'Compilez PLUSIEURS captures sur plusieurs jours — le schéma répétitif est la clé',
      'Notez les dates de chaque incident',
      'Dans "Contexte" : "Incidents répétés depuis le [date], jamais sanctionné"',
      'Témoins : demandez à d\'autres joueurs présents de voter votre plainte',
    ],
    strength: 80,
  },
  {
    situation: 'Favoritisme — règles appliquées inégalement',
    theyDo: 'Vous êtes puni pour quelque chose que les amis de l\'admin font impunément.',
    youDo: [
      'Capturez votre punition ET un exemple de la même chose faite par un "ami" sans sanction',
      'Dans la description : "Sanction appliquée uniquement à moi alors que [pseudo] a fait la même chose le [date]"',
      'Le contraste avant/après = preuve du favoritisme',
    ],
    strength: 75,
  },
];

// ── Arguments béton à utiliser dans la description ─────────────────────────

const POWER_PHRASES = [
  { phrase: 'Actions constatées le [date] à [heure], preuve vidéo disponible.', why: 'Ancre les faits dans le réel, impossible à nier.' },
  { phrase: 'Aucun avertissement préalable n\'a été émis avant la sanction.', why: 'Montre l\'absence de procédure équitable.' },
  { phrase: 'J\'ai tenté de résoudre ce litige en interne le [date] — sans réponse.', why: 'Prouve la bonne foi et l\'échec de la voie interne.' },
  { phrase: 'Plusieurs joueurs ont été témoins de cet incident.', why: 'Annonce des soutiens potentiels.' },
  { phrase: 'Ce comportement s\'est répété les [dates] — ce n\'est pas un incident isolé.', why: 'Établit un schéma intentionnel, pas une erreur.' },
  { phrase: 'La sanction est disproportionnée par rapport aux règles affichées du serveur.', why: 'Oppose leur propre règlement à leur décision.' },
];

// ── Couleurs badge ───────────────────────────────────────────────────────────

const severityStyle = (s: string) => {
  if (s === 'rouge')  return { bg: 'bg-red-50 dark:bg-red-950/30',    text: 'text-red-600',    dot: 'bg-red-500'    };
  if (s === 'orange') return { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-500', dot: 'bg-orange-400' };
  return              { bg: 'bg-amber-50 dark:bg-amber-950/30',    text: 'text-amber-600',  dot: 'bg-amber-400'  };
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ArsenalPage() {
  return (
    <div className="w-full">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/30 rounded-full px-3 py-1 uppercase tracking-wide flex items-center gap-1.5">
              <Swords className="w-3 h-3" />
              Bouclier joueur
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-semibold text-foreground leading-tight mb-4 text-balance">
            Comment gagner face à un admin qui résiste
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg mb-8">
            Certains administrateurs, modérateurs et helpers ont beaucoup de pouvoir — et certains feront tout pour que votre plainte échoue. Ce guide vous donne chaque contre-stratégie pour les déjouer.
          </p>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-sm font-medium text-foreground">8 tactiques de manipulation décodées</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <span className="text-sm font-medium text-foreground">7 droits inaliénables du joueur</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-sm font-medium text-foreground">4 scénarios concrets</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenu ──────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16">

        {/* ── Principe fondamental ── */}
        <div className="mb-14 p-6 rounded-2xl border border-border bg-card">
          <div className="flex items-start gap-3">
            <Quote className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm md:text-base font-medium text-foreground leading-relaxed mb-2">
                "Un admin peut nier. Un admin peut intimider. Un admin peut mobiliser son équipe. Mais un admin ne peut pas effacer une vidéo que vous détenez déjà."
              </p>
              <p className="text-xs text-muted-foreground">— Principe fondamental RPGuard</p>
            </div>
          </div>
        </div>

        {/* ── TACTIQUES DE MANIPULATION ── */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Les 8 tactiques qu'ils utilisent — et comment les retourner</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-8 max-w-lg">
            Reconnaître une tactique de manipulation, c'est déjà à moitié la déjouer. Voici les plus courantes avec votre contre-stratégie.
          </p>

          <div className="flex flex-col gap-0">
            {MANIPULATION_TACTICS.map(({ tactic, how, counter, icon: Icon, severity }, i) => {
              const style = severityStyle(severity);
              return (
                <div
                  key={tactic}
                  className={`py-8 ${i < MANIPULATION_TACTICS.length - 1 ? 'border-b border-border' : ''}`}
                >
                  {/* Header tactique */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.bg}`}>
                      <Icon className={`w-4 h-4 ${style.text}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold text-foreground">{tactic}</h3>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 ${style.bg} ${style.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {severity === 'rouge' ? 'Haute menace' : severity === 'orange' ? 'Menace moyenne' : 'Faible menace'}
                        </span>
                      </div>
                      {/* Ce qu'ils font */}
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 mb-3">
                        <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground italic leading-relaxed">{how}</p>
                      </div>
                      {/* Votre contre-attaque */}
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-foreground leading-relaxed">{counter}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── VOS 7 DROITS ── */}
        <div className="mb-14 border-t border-border pt-12">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Vos 7 droits inaliénables en tant que joueur RP</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-8 max-w-lg">
            Ces droits s'appliquent sur n'importe quel serveur RP, quelles que soient les règles internes. Aucun admin ne peut vous les retirer.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PLAYER_RIGHTS.map(({ right, desc, icon: Icon }, i) => (
              <div key={right} className="flex gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center mt-0.5">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground/40">0{i + 1}</span>
                    <h3 className="text-sm font-semibold text-foreground">{right}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SCÉNARIOS CONCRETS ── */}
        <div className="mb-14 border-t border-border pt-12">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-foreground">4 scénarios concrets — stratégie gagnante</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-8 max-w-lg">
            Pour chaque situation, voici exactement ce que vous devez faire pour construire un dossier gagnant.
          </p>

          <div className="flex flex-col gap-0">
            {SCENARIOS.map(({ situation, theyDo, youDo, strength }, i) => (
              <div
                key={situation}
                className={`py-8 ${i < SCENARIOS.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-sm font-semibold text-foreground leading-snug">{situation}</h3>
                  <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950/30">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-bold text-green-600">{strength}</span>
                  </div>
                </div>

                {/* Ce qu'ils disent */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 mb-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    <span className="font-medium text-foreground not-italic">Leur argument : </span>
                    {theyDo}
                  </p>
                </div>

                {/* Votre stratégie */}
                <ul className="flex flex-col gap-2">
                  {youDo.map((action) => (
                    <li key={action} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">{action}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── FORMULATIONS PUISSANTES ── */}
        <div className="mb-14 border-t border-border pt-12">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Formulations béton pour votre description</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 max-w-lg">
            Ces tournures renforcent votre crédibilité. Adaptez-les à votre situation et copiez-les directement dans votre dossier.
          </p>

          <div className="flex flex-col gap-0">
            {POWER_PHRASES.map(({ phrase, why }, i) => (
              <div
                key={i}
                className={`flex gap-4 py-5 ${i < POWER_PHRASES.length - 1 ? 'border-b border-border/50' : ''}`}
              >
                <div className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center mt-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-mono text-foreground leading-relaxed mb-1.5 break-words">
                    "{phrase}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 font-medium">Pourquoi ça marche : </span>
                    {why}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Règle d'or ── */}
        <div className="mb-14 border-t border-border pt-12">
          <h2 className="text-lg font-semibold text-foreground mb-6">La règle d'or en 3 points</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { num: '1', title: 'Enregistrez d\'abord', desc: 'Avant de confronter, avant de signaler, avant tout — avoir la preuve. Une vidéo obtenue après coup ne vaut rien.' },
              { num: '2', title: 'Restez factuel', desc: 'Jamais d\'insultes, jamais de jugements. "Il est nul" ne prouve rien. "Il a téléporté mon personnage le 15/07 à 14h23" est une preuve.' },
              { num: '3', title: 'Mobilisez la communauté', desc: 'Partagez votre plainte validée. Les votes de joueurs extérieurs au serveur sont les plus neutres et les plus puissants.' },
            ].map(({ num, title, desc }) => (
              <div key={num} className="p-5 rounded-xl border border-border bg-card">
                <span className="text-3xl font-bold text-muted-foreground/20 block mb-3 font-mono">{num}</span>
                <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="border-t border-border pt-12 p-6 rounded-2xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1">Vous êtes prêt à les affronter.</h3>
            <p className="text-sm text-muted-foreground">Consultez aussi notre guide de dépôt pour maximiser votre score de dossier.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button asChild variant="outline" className="rounded-full px-5">
              <Link to="/guide">Guide de dépôt</Link>
            </Button>
            <Button asChild className="rounded-full px-6">
              <Link to="/inscription">
                Déposer ma plainte
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

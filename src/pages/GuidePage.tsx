import { Link } from 'react-router-dom';
import {
  Video, CheckCircle2, FileText, CalendarDays,
  Users, TrendingUp, ShieldCheck, AlertTriangle, ArrowRight,
  ArrowLeft, Star, Quote, Swords, MessageCircle, Clock, Gamepad2, Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageMeta from '@/components/common/PageMeta';

// ── Données ───────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    title: 'Rassemblez vos preuves AVANT de rédiger',
    desc: 'Une vidéo vaut 10 captures. Avant même d\'ouvrir le formulaire, cherchez : l\'enregistrement de la session, les logs de chat, les captures horodatées. Sans preuve, votre plainte sera ignorée.',
    tips: ['Vidéo avec le pseudo visible = preuve irréfutable', 'Capture chat + heure = preuve solide', 'Témoignage seul = preuve faible'],
    icon: Video,
    weight: '30 pts',
    weightColor: 'text-green-600',
    weightBg: 'bg-green-50 dark:bg-green-950/30',
  },
  {
    num: '02',
    title: 'Notez le pseudo exact de chaque personne mise en cause',
    desc: 'Un seul caractère de différence invalide votre plainte. Vérifiez la casse, les chiffres à la place de lettres, les caractères spéciaux. Copiez-collez depuis le jeu si possible.',
    tips: ['Copier-coller depuis le jeu ou le panneau admin', 'Vérifier majuscules, chiffres et caractères spéciaux', 'Capturer l\'écran du profil IG pour preuve'],
    icon: CheckCircle2,
    weight: 'Critique',
    weightColor: 'text-red-600',
    weightBg: 'bg-red-50 dark:bg-red-950/30',
  },
  {
    num: '03',
    title: 'Rédigez une description claire',
    desc: 'Décrivez les faits dans l\'ordre chronologique. Utilisez des phrases courtes. Séparez vos paragraphes. Évitez les jugements de valeur et restez concentré sur les faits objectifs.',
    tips: ['Contexte → Faits → Conséquences', 'Aérez votre texte (paragraphes)', 'Faits uniquement, pas d\'insultes'],
    icon: FileText,
    weight: '25 pts',
    weightColor: 'text-amber-600',
    weightBg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    num: '04',
    title: 'Renseignez la date et le contexte',
    desc: 'La date ancre les faits. Le contexte aide à comprendre l\'historique (est-ce un fait isolé ou répété ?). Ces informations structurent votre récit pour les lecteurs.',
    tips: ['Date exacte si possible', 'Mentionnez les antécédents connus', 'Soyez concis dans le contexte'],
    icon: CalendarDays,
    weight: '25 pts',
    weightColor: 'text-amber-600',
    weightBg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    num: '05',
    title: 'Mobilisez la communauté après dépôt',
    desc: 'Partagez votre plainte dans les canaux RP concernés (Discord du serveur, communautés GTA RP, etc.). Les votes de soutien amplifient la visibilité et la pression sur l\'administration.',
    tips: ['Partagez sur Discord communautaire', 'Demandez à des témoins de voter', 'Restez factuel dans vos partages'],
    icon: Users,
    weight: '+ votes',
    weightColor: 'text-primary',
    weightBg: 'bg-primary/8',
  },
];

const SCORE_TABLE = [
  { label: 'Vidéo jointe',           pts: '+30', strong: true },
  { label: 'Description 200+ car.',  pts: '+25', strong: false },
  { label: 'Raison formulée',        pts: '+15', strong: false },
  { label: 'Date de l\'incident',    pts: '+15', strong: false },
  { label: 'Contexte ajouté',        pts: '+10', strong: false },
  { label: '2+ accusés identifiés',  pts: '+5',  strong: false },
  { label: 'Capture seule (pas vidéo)', pts: '+15', strong: false },
];

const MISTAKES = [
  { title: 'Pseudo approximatif', desc: 'Écrire "Admin_TrucBidule" au lieu de "Admin_TrucBidule01" fait rejeter la plainte.' },
  { title: 'Description émotionnelle', desc: '« Il est nul et abusif » ne prouve rien. Les faits seuls comptent.' },
  { title: 'Aucune preuve jointe', desc: 'Sans preuve, la plainte sera contestée et possiblement retirée.' },
  { title: 'Date inconnue', desc: 'Si vous dites "ça fait 3 semaines", c\'est moins fiable qu\'une date précise.' },
  { title: 'Plainte doublée', desc: 'Déposer plusieurs plaintes identiques diminue votre crédibilité.' },
];

// Jeux RP — depuis la source unique de vérité
import { GAMES_RP } from '@/lib/games';
const GAMES = GAMES_RP.map((g) => ({ name: g.label, engine: g.engine, platforms: g.platforms, desc: g.desc, tips: g.tips, status: g.status }));

const CHECKLIST = [
  'Pseudo exact vérifié (copier-coller)',
  'Vidéo ou capture horodatée jointe',
  'Date précise de l\'incident renseignée',
  'Description chronologique 200+ caractères',
  'Raison du signalement clairement formulée',
  'Contexte ou antécédents mentionnés',
  'Relecture : faits uniquement, pas de jugements',
];

// ── Composant ────────────────────────────────────────────────────────────

export default function GuidePage() {
  return (
    <div className="w-full">
      <PageMeta
        title="Guide de Rédaction des Plaintes RP — RPGuard"
        description="Apprenez à constituer un dossier solide sur RPGuard : récupérer les preuves, formuler les faits sans insulte, et maximiser l'impact de votre signalement."
        keywords="guide plainte RP, comment signaler abus GTA, dossier solide RPGuard, règles de plainte, preuve abus admin"
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

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-full px-3 py-1 uppercase tracking-wide">
              Guide stratégique
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-semibold text-foreground leading-tight mb-4 text-balance">
            Comment déposer une plainte qui gagne
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg mb-8">
            Chaque étape compte. Un dossier solide obtient plus de soutiens, plus de visibilité, et une meilleure chance d'action de la part du serveur. Suivez ce guide avant de rédiger.
          </p>

          {/* Score preview */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background">
              <TrendingUp className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">Score 80–100 = Dossier solide</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background">
              <Star className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-sm font-medium text-foreground">5 étapes clés</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenu principal ── */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16">

        {/* ── Les 5 étapes ── */}
        <div className="mb-14">
          <h2 className="text-lg font-semibold text-foreground mb-1">Les 5 étapes d'un dossier gagnant</h2>
          <p className="text-sm text-muted-foreground mb-8">Suivez cet ordre. Chaque étape maximise la crédibilité de votre signalement.</p>

          <div className="flex flex-col gap-0">
            {STEPS.map(({ num, title, desc, tips, icon: Icon, weight, weightColor, weightBg }, i) => (
              <div
                key={num}
                className={`flex gap-5 py-8 ${i < STEPS.length - 1 ? 'border-b border-border' : ''}`}
              >
                {/* Numéro */}
                <div className="shrink-0 flex flex-col items-center gap-2 w-10">
                  <span className="text-xs font-mono text-muted-foreground/40 tabular-nums">{num}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${weightBg}`}>
                    <Icon className={`w-4 h-4 ${weightColor}`} />
                  </div>
                </div>

                {/* Texte */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-foreground leading-snug">{title}</h3>
                    <span className={`text-xs font-bold shrink-0 ${weightColor}`}>{weight}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{desc}</p>
                  <ul className="flex flex-col gap-1.5">
                    {tips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tableau de score ── */}
        <div className="mb-14 border-t border-border pt-12">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Comment le score est calculé</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 max-w-lg">
            RPGuard calcule automatiquement la "Force du dossier" sur 100. Voici comment maximiser votre score.
          </p>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Élément</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {SCORE_TABLE.map(({ label, pts, strong }) => (
                    <tr key={label} className="border-b border-border/50 last:border-0">
                      <td className={`px-4 py-3 ${strong ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {strong && <Star className="w-3 h-3 text-amber-500 inline mr-1.5 mb-0.5" />}
                        {label}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold tabular-nums ${strong ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {pts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Légende */}
          <div className="flex flex-wrap gap-3 mt-4">
            {[
              { label: 'Dossier solide', range: '80–100', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
              { label: 'Correct',        range: '55–79',  color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
              { label: 'Partiel',        range: '30–54',  color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
              { label: 'Faible',         range: '0–29',   color: 'text-red-600',   bg: 'bg-red-50 dark:bg-red-950/30' },
            ].map(({ label, range, color, bg }) => (
              <span key={label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${bg} ${color}`}>
                {label} ({range})
              </span>
            ))}
          </div>
        </div>

        {/* ── Erreurs à éviter ── */}
        <div className="mb-14 border-t border-border pt-12">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Les erreurs qui font rejeter une plainte</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Évitez ces pièges classiques pour ne pas perdre votre crédibilité.</p>

          <div className="flex flex-col gap-0">
            {MISTAKES.map(({ title, desc }, i) => (
              <div
                key={title}
                className={`flex items-start gap-3 py-4 ${i < MISTAKES.length - 1 ? 'border-b border-border/50' : ''}`}
              >
                <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-destructive">✕</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground mb-0.5">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Par jeu ── */}
        <div className="mb-14 border-t border-border pt-12">
          <div className="flex items-center gap-2 mb-2">
            <Gamepad2 className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Conseils par jeu</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Chaque jeu a ses spécificités. Sélectionnez votre jeu ci-dessous pour adapter votre dossier.
          </p>

          <div className="flex flex-col gap-4">
            {GAMES.map(({ name, engine, platforms, desc, tips, status }) => (
              <div key={name} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* En-tête jeu */}
                <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground flex-1 min-w-0">{name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                    status === 'actif'    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/40'
                    : status === 'émergent' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/40'
                    : 'bg-muted text-muted-foreground border-border'
                  }`}>
                    {status === 'actif' ? '● Actif' : status === 'émergent' ? '✦ Émergent' : '○ Stable'}
                  </span>
                </div>

                {/* Corps */}
                <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Infos */}
                  <div className="md:col-span-1 flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Monitor className="w-3 h-3 shrink-0" />
                        {engine}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Gamepad2 className="w-3 h-3 shrink-0" />
                        {platforms.join(' · ')}
                      </span>
                    </div>
                  </div>

                  {/* Conseils preuves */}
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Conseils preuves</p>
                    <ul className="flex flex-col gap-2">
                      {tips.map((tip) => (
                        <li key={tip} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="w-1 h-1 rounded-full bg-primary/50 shrink-0 mt-1.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Citation ── */}
        <div className="mb-14 border-t border-border pt-12">
          <div className="flex items-start gap-3 p-5 rounded-xl bg-muted/20 border border-border">
            <Quote className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-medium leading-relaxed italic mb-2">
                "Un dossier bien monté vaut mieux que dix plaintes bâclées. La communauté soutient ce qu'elle peut vérifier."
              </p>
              <p className="text-xs text-muted-foreground">— Principe RPGuard</p>
            </div>
          </div>
        </div>

        {/* ── Checklist finale ── */}
        <div className="mb-14 border-t border-border pt-12">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h2 className="text-lg font-semibold text-foreground">Checklist avant de soumettre</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Vérifiez chaque point avant de valider votre plainte.</p>

          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CHECKLIST.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded border-2 border-border flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-mono">{i + 1}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Métriques ── */}
        <div className="mb-14 border-t border-border pt-12">
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Clock, label: 'Temps moyen', value: '8 min', sub: 'pour un bon dossier' },
              { icon: TrendingUp, label: 'Score cible', value: '80+', sub: 'pour max visibilité' },
              { icon: MessageCircle, label: 'Impact', value: '3×', sub: 'plus de soutiens' },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="text-center p-4 rounded-xl border border-border bg-card">
                <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-2" />
                <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Renvoi Arsenal ── */}
        <div className="mb-14 border-t border-border pt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/40 dark:bg-red-950/10">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0 mt-0.5">
                <Swords className="w-4 h-4 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground mb-0.5">L'admin résiste ? Passez au Bouclier.</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  8 tactiques de manipulation décodées, 7 droits du joueur, 4 scénarios concrets avec stratégie gagnante étape par étape.
                </p>
              </div>
            </div>
            <Button asChild className="rounded-full px-5 shrink-0 bg-foreground text-background hover:bg-foreground/90">
              <Link to="/arsenal">
                Bouclier joueur
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* ── CTA final ── */}
        <div className="border-t border-border pt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 rounded-2xl border border-border bg-card">
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1">Prêt à déposer ?</h3>
            <p className="text-sm text-muted-foreground">Vous avez tout ce qu'il faut. Un bon dossier commence maintenant.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button asChild variant="outline" className="rounded-full px-5">
              <Link to="/plaintes">Voir les plaintes</Link>
            </Button>
            <Button asChild className="rounded-full px-6">
              <Link to="/inscription">
                Créer un compte
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

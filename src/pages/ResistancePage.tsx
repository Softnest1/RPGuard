// Page Résistance — Guide pour diffuser un dossier RPGuard même banni de Discord
// URL : /resistance — publique, indexée par Google
import { Link } from 'react-router-dom';
import {
  Shield, Globe, Share2, Copy, FileText,
  ChevronRight, ExternalLink, Megaphone,
  Search, Lock, Users, Zap, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageMeta from '@/components/common/PageMeta';
import PageContainer from '@/components/layouts/PageContainer';

// ── Données statiques ────────────────────────────────────────────────────────

const METHODS = [
  {
    num: '01',
    icon: Globe,
    title: 'Lien direct RPGuard',
    level: 'Toujours disponible',
    levelColor: 'text-green-600 dark:text-green-400',
    desc: 'Chaque dossier RPGuard a une URL permanente. Collez ce lien partout — forums, commentaires YouTube, description de vidéo TikTok. Le serveur ne peut pas le supprimer.',
    actions: [
      { label: 'Voir tous les dossiers', to: '/plaintes' },
    ],
  },
  {
    num: '02',
    icon: Search,
    title: 'Google vous protège',
    level: 'Permanent',
    levelColor: 'text-green-600 dark:text-green-400',
    desc: 'La page dédiée à chaque serveur est indexée par Google. Quand un joueur cherche le nom du serveur, il tombe sur le dossier RPGuard. Aucun admin ne peut supprimer ça.',
    actions: [
      { label: 'Classement serveurs', to: '/serveurs' },
    ],
  },
  {
    num: '03',
    icon: FileText,
    title: 'Texte copiable prêt à l\'emploi',
    level: 'Partage immédiat',
    levelColor: 'text-amber-600 dark:text-amber-400',
    desc: 'Depuis chaque dossier ou fiche serveur, copiez un texte pré-formaté avec le nom du serveur, le score, et le lien. Collez-le dans n\'importe quel Discord ou forum — même ceux qui ne vous ont pas banni.',
    actions: [
      { label: 'Ouvrir un dossier', to: '/plaintes' },
    ],
  },
  {
    num: '04',
    icon: Share2,
    title: 'Partage natif (mobile)',
    level: 'Disponible sur iOS/Android',
    levelColor: 'text-blue-600 dark:text-blue-400',
    desc: 'Sur mobile, le bouton "Partager" ouvre la feuille de partage native : WhatsApp, Telegram, SMS, Instagram Stories. Le dossier sort du Discord et rejoint des plateformes non filtrables.',
    actions: [],
  },
  {
    num: '05',
    icon: Megaphone,
    title: 'Créateurs & Streamers',
    level: 'Fort impact',
    levelColor: 'text-purple-600 dark:text-purple-400',
    desc: 'Si un créateur de contenu couvre le serveur, le lien RPGuard dans sa description YouTube/TikTok atteint des milliers de joueurs. Un seul créateur peut générer plus de visibilité qu\'un Discord entier.',
    actions: [
      { label: 'Contact presse', to: '/contact' },
    ],
  },
  {
    num: '06',
    icon: Users,
    title: 'Rejoindre d\'autres communautés',
    level: 'Effet de réseau',
    levelColor: 'text-amber-600 dark:text-amber-400',
    desc: 'Postez le lien du dossier dans les Discords des autres serveurs RP (hors le serveur visé), sur Reddit France, les groupes Facebook gaming, les forums FiveM/ONESTATE. Ce sont des espaces où vous n\'êtes pas banni.',
    actions: [],
  },
];

const CANT_DO = [
  'Supprimer votre dossier RPGuard',
  'Effacer la fiche Google de leur serveur',
  'Bloquer le lien direct de la plainte',
  'Empêcher d\'autres joueurs de vous croire',
  'Retirer leur score du classement public',
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ResistancePage() {
  return (
    <div className="w-full bg-background min-h-screen">
      <PageMeta
        title="Guide de Résistance — Diffuser un dossier même si vous êtes banni | RPGuard"
        description="Même banni d'un Discord ou d'un groupe RP, votre dossier RPGuard reste accessible, indexé par Google et partageable partout. Découvrez comment faire entendre votre voix malgré la censure."
        keywords="banni Discord RPGuard, diffuser dossier RP, résistance abus serveur, partager signalement, RPGuard censure, porter plainte RP malgré ban"
      />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-muted/10 pt-16 pb-20 md:pt-24 md:pb-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
        <PageContainer width="xl" className="text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-8">
            <Shield className="w-3.5 h-3.5" /> Guide de Résistance
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-5 text-balance max-w-3xl">
            Ils vous ont banni. <span className="text-muted-foreground font-light">Votre dossier, lui, est libre.</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium mb-10 max-w-2xl leading-relaxed text-pretty">
            Bannir quelqu'un d'un Discord ne supprime pas la vérité. RPGuard est conçu pour résister : vos signalements sont permanents, indexés par Google, et partageables partout — sans leur permission.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button asChild size="lg" className="rounded-full h-12 px-8">
              <Link to="/plaintes">
                Consulter tous les dossiers <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-8">
              <Link to="/soumettre">Déposer mon dossier</Link>
            </Button>
          </div>
        </PageContainer>
      </section>

      {/* ── CE QU'ILS NE PEUVENT PAS FAIRE ──────────────────────────── */}
      <section className="py-14 md:py-20 border-b border-border bg-background">
        <PageContainer width="xl">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-balance">
              Ce qu'un admin abusif <span className="text-muted-foreground font-light">ne peut pas faire</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Même en vous bannissant ou en signalant RPGuard, il reste impuissant face à ces réalités.
            </p>
            <ul className="space-y-3">
              {CANT_DO.map((item) => (
                <li key={item} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                  <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-3 h-3 text-destructive" />
                  </div>
                  <span className="text-sm font-medium text-foreground">❌ {item}</span>
                </li>
              ))}
            </ul>
          </div>
        </PageContainer>
      </section>

      {/* ── 6 MÉTHODES ───────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 border-b border-border bg-muted/10">
        <PageContainer width="xl">
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-balance">
              6 façons de vous faire entendre malgré le ban
            </h2>
            <p className="text-muted-foreground max-w-xl">
              RPGuard a été pensé pour chaque scénario. Voici vos armes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {METHODS.map(({ num, icon: Icon, title, level, levelColor, desc, actions }) => (
              <div key={num} className="flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border/60">
                    <Icon className="w-5 h-5 text-foreground/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">{num}</span>
                      <span className={`text-[11px] font-bold uppercase tracking-wide ${levelColor}`}>{level}</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground">{title}</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                {actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    {actions.map(({ label, to }) => (
                      <Button key={to} asChild variant="outline" size="sm" className="rounded-full text-xs">
                        <Link to={to}>{label} <ChevronRight className="w-3 h-3 ml-1" /></Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-background">
        <PageContainer width="xl" className="text-center flex flex-col items-center">
          <Zap className="w-10 h-10 text-primary mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-balance max-w-2xl">
            Votre dossier est votre arme. Diffusez-le.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl text-pretty">
            Les serveurs abusifs comptent sur votre silence. Chaque partage de lien RPGuard est un vote pour un RP plus sain.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button asChild size="lg" className="rounded-full h-12 px-8">
              <Link to="/soumettre">
                <FileText className="w-4 h-4 mr-2" />
                Déposer un dossier maintenant
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-8">
              <Link to="/serveurs">Voir le classement des serveurs</Link>
            </Button>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}

import { Link } from 'react-router-dom';
import {
  ShieldCheck, ArrowLeft, Scale, MessageSquareWarning, Eye, HandHeart,
  CheckCircle, XCircle, AlertTriangle, FileSearch, ArrowRight, MessageCircle,
  Clock, Users, Lock, TrendingUp, Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageMeta from '@/components/common/PageMeta';

// ── WhatsApp — obfusqué anti-spam ─────────────────────────────────────────
const WA_PARTS = ['3', '3', '6', '6', '7', '4', '8', '5', '2', '2', '6'];
const waBase = () => `https://wa.me/${WA_PARTS.join('')}`;
// Message pré-rempli : contestation de contenu
const waContestLink = () =>
  `${waBase()}?text=${encodeURIComponent(
    'Bonjour, je souhaite contester un contenu publié sur RPGuard. Voici les détails de ma demande : [URL de la plainte + motif]'
  )}`;
// Message pré-rempli : urgence / mise en demeure
const waUrgentLink = () =>
  `${waBase()}?text=${encodeURIComponent(
    'Bonjour, je vous adresse une demande urgente concernant RPGuard. Objet : [précisez]. Merci de traiter ce message en priorité.'
  )}`;

// ── Principes fondamentaux ─────────────────────────────────────────────────
const PRINCIPLES = [
  {
    num: '01',
    icon: Eye,
    title: 'Liberté d\'expression et droit au témoignage',
    text: "Chaque joueur a le droit de témoigner publiquement d'une expérience vécue. RPGuard protège ce droit fondamental. Partager son vécu n'est pas de la diffamation — c'est de la transparence communautaire.",
  },
  {
    num: '02',
    icon: Scale,
    title: 'Politique anti-diffamation stricte',
    items: [
      'Seuls les faits vérifiables sont acceptés — pas d\'insultes, pas d\'accusations sans preuve.',
      'Tout contenu doit désigner un pseudonyme en jeu, jamais une identité réelle.',
      'Les captures d\'écran ne peuvent pas être altérées ou fabriquées.',
      'Une plainte mensongère engage la responsabilité personnelle de son auteur.',
    ],
  },
  {
    num: '03',
    icon: HandHeart,
    title: 'Statut d\'hébergeur — nous ne sommes pas auteurs',
    text: "RPGuard est un hébergeur au sens de la LCEN (loi n° 2004-575). Nous ne rédigeons pas les plaintes — nous les hébergeons. Nous ne pouvons pas être tenus responsables de contenus tiers tant que nous agissons promptement sur tout signalement d'illicite. C'est notre protection légale, et c'est la loi française.",
  },
  {
    num: '04',
    icon: FileSearch,
    title: 'Charte de modération transparente',
    items: [
      'Tout contenu signalé est examiné dans un délai de 72 h ouvrées.',
      'La modération distingue : opinion, témoignage factuel, attaque personnelle.',
      "Une plainte contestée par l'accusé est notée — elle n'est pas supprimée sauf preuve de falsification.",
      "L'équipe de modération peut solliciter des preuves supplémentaires.",
    ],
  },
];

// ── Actions de modération ──────────────────────────────────────────────────
const MODERATION_ACTIONS = [
  {
    icon: CheckCircle,
    label: 'Contenu validé',
    desc: 'Témoignage factuel, preuve crédible, pseudonyme en jeu uniquement.',
    color: 'text-green-600 dark:text-green-400',
    bg:    'bg-green-50 dark:bg-green-950/30',
  },
  {
    icon: MessageSquareWarning,
    label: 'Avertissement',
    desc: 'Ton inapproprié, manque de précision — l\'auteur est invité à corriger.',
    color: 'text-amber-600 dark:text-amber-400',
    bg:    'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    icon: XCircle,
    label: 'Suppression',
    desc: 'Contenu faux, haineux, diffamatoire ou ne respectant pas les règles.',
    color: 'text-red-600 dark:text-red-400',
    bg:    'bg-red-50 dark:bg-red-950/30',
  },
];

// ── Droits des personnes mentionnées ──────────────────────────────────────
const RIGHTS = [
  'Droit de réponse : toute personne citée peut laisser un commentaire factuel sur la plainte la concernant.',
  'Droit de contestation : signaler une plainte comme inexacte via le bouton dédié — examen dans 72 h.',
  'Droit à l\'effacement : si une plainte est prouvée fausse, elle est retirée et l\'auteur sanctionné.',
  "Droit d'information : nous contacter via WhatsApp pour toute question ou réclamation urgente.",
];

export default function ModerationPage() {
  return (
    <div className="w-full">
      <PageMeta
        title="Charte de modération — RPGuard"
        description="Découvrez les principes de modération de RPGuard, vos droits en tant que joueur cité, et nos obligations légales en tant qu'hébergeur."
      />
      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Conformité RPGuard</p>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
                Charte de modération
              </h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            RPGuard est une plateforme légale, transparente et responsable.
            Cette charte définit nos principes, nos protections légales et les droits de toutes les parties.
          </p>
        </div>
      </div>

      {/* ── Principes ────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col gap-0">
          {PRINCIPLES.map(({ num, icon: Icon, title, text, items }, i) => (
            <div
              key={num}
              className={`flex gap-6 py-8 ${i < PRINCIPLES.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="shrink-0 flex flex-col items-center gap-2 w-10">
                <span className="text-xs font-mono text-muted-foreground/50 tabular-nums">{num}</span>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-sm font-semibold text-foreground mb-3">{title}</h2>
                {items ? (
                  <ul className="flex flex-col gap-2">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <span className="mt-2 w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Tableau des décisions de modération ─────────── */}
        <div className="mt-12 pt-10 border-t border-border">
          <h2 className="text-base font-semibold text-foreground mb-1">Décisions possibles</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Chaque signalement aboutit à l'une de ces trois décisions, notifiée par l'équipe.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {MODERATION_ACTIONS.map(({ icon: Icon, label, desc, color, bg }) => (
              <div key={label} className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-card">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`text-xs font-semibold ${color}`}>{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Droits des personnes citées ─────────────────── */}
        <div className="mt-12 pt-10 border-t border-border">
          <h2 className="text-base font-semibold text-foreground mb-1">Droits des personnes mentionnées</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Toute personne citée dans une plainte bénéficie des droits suivants.
          </p>
          <ul className="flex flex-col gap-3">
            {RIGHTS.map((right) => (
              <li key={right} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                {right}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Actions directes WhatsApp ────────────────────── */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Contester un contenu */}
          <a
            href={waContestLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
              <MessageCircle className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground mb-0.5">Contester un contenu</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vous êtes cité et contestez les faits — envoyez une demande via WhatsApp avec le lien de la plainte.
              </p>
            </div>
          </a>
          {/* Demande urgente */}
          <a
            href={waUrgentLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground mb-0.5">Demande urgente</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mise en demeure, demande légale urgente ou signalement prioritaire — WhatsApp avec objet précis.
              </p>
            </div>
          </a>
        </div>

        {/* ── Bloc conformité finale ───────────────────────── */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="p-5 rounded-xl border border-border bg-muted/30">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                RPGuard opère dans le cadre légal français (LCEN, RGPD, loi du 29 juillet 1881 sur la presse).
                Toute tentative de retrait abusif de contenu légal sera considérée comme une pression illégitime
                et documentée. Dernière mise à jour : Juillet 2026.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link to="/mentions-legales">
                  Mentions légales <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link to="/reglement">
                  Règlement <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link to="/contact">
                  Formulaire de contact <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

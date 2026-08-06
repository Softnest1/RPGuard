import { Link } from 'react-router-dom';
import { Lock, ArrowLeft, UserCircle, Database, Server, ShieldCheck, AlertTriangle } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';

const SECTIONS = [
  {
    num: '01',
    icon: Database,
    title: 'Données collectées',
    items: [
      "Nom d'utilisateur (pseudonyme de votre choix)",
      'Contenu des plaintes et commentaires que vous publiez',
      'Fichiers de preuves uploadés (images)',
      'Votes et signalements',
    ],
  },
  {
    num: '02',
    icon: UserCircle,
    title: 'Utilisation des données',
    text: 'Vos données sont utilisées uniquement pour faire fonctionner RPGuard. Elles ne sont ni vendues, ni partagées avec des tiers à des fins commerciales.',
  },
  {
    num: '03',
    icon: Server,
    title: 'Stockage et sécurité',
    text: "Les données sont stockées sur Supabase (infrastructure cloud sécurisée européenne AWS/GCP). Les fichiers uploadés sont protégés par des règles d'accès strictes (Row Level Security) limitant l'accès aux seules personnes autorisées.",
  },
  {
    num: '04',
    icon: ShieldCheck,
    title: 'Vos droits',
    textJsx: true,
  },
];

export default function ConfidentialitePage() {
  return (
    <div className="w-full">
      <PageMeta
        title="Politique de Confidentialité — RPGuard"
        description="Consultez notre politique de confidentialité. Découvrez comment RPGuard protège, collecte et utilise vos données de manière transparente et sécurisée."
        keywords="confidentialité RPGuard, protection données, vie privée serveur RP, données personnelles, anonymat plainte RP"
      />
      {/* Hero */}
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
              <Lock className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">RPGuard</p>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
                Politique de confidentialité
              </h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            Transparence totale sur la collecte, l'utilisation et la protection de vos données personnelles.
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col gap-0">
          {SECTIONS.map(({ num, icon: Icon, title, items, text, textJsx }, i) => (
            <div
              key={num}
              className={`flex gap-6 py-8 ${i < SECTIONS.length - 1 ? 'border-b border-border' : ''}`}
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
                ) : textJsx ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Vous pouvez demander la suppression de votre compte et de l'ensemble de vos données en nous
                    contactant via la page{' '}
                    <Link to="/contact" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                      Contact
                    </Link>.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/40">
          <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dernière mise à jour : Juillet 2026. Cette politique est conforme au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
          </p>
        </div>
      </div>
    </div>
  );
}

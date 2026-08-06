import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, FileText, Image, ThumbsUp, ShieldAlert, AlertTriangle, Star, Swords, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageMeta from '@/components/common/PageMeta';

const RULES = [
  {
    num: '01',
    icon: FileText,
    title: 'Utilisation acceptable',
    items: [
      'Les plaintes doivent être fondées sur des faits réels et vérifiables.',
      "L'identité des personnes mentionnées doit correspondre à leurs pseudonymes en jeu.",
      'Tout contenu diffamatoire, haineux ou illégal est interdit.',
    ],
  },
  {
    num: '02',
    icon: Image,
    title: 'Preuves',
    items: [
      "Les captures d'écran ne doivent pas être modifiées ou falsifiées.",
      'Les preuves uploadées doivent être directement liées à la plainte.',
    ],
  },
  {
    num: '03',
    icon: ThumbsUp,
    title: 'Votes et commentaires',
    items: [
      'La manipulation des votes (comptes multiples, vote automatisé) est interdite.',
      'Les commentaires doivent rester respectueux et factuels.',
    ],
  },
  {
    num: '04',
    icon: ShieldAlert,
    title: 'Modération',
    text: "RPGuard se réserve le droit de supprimer tout contenu non conforme au présent règlement et de suspendre les comptes en infraction.",
  },
  {
    num: '05',
    icon: AlertTriangle,
    title: 'Fausses déclarations',
    text: "Déposer une plainte mensongère engage la responsabilité personnelle de l'utilisateur. RPGuard coopèrera avec toute procédure légale en cas de contentieux.",
  },
];

export default function ReglementPage() {
  return (
    <div className="w-full">
      <PageMeta
        title="Règlement de la Plateforme — RPGuard"
        description="Découvrez les règles d'utilisation de RPGuard. Pour une justice communautaire saine, suivez notre charte : preuves valides, respect, absence d'insultes."
        keywords="règlement RPGuard, charte de bonne conduite, conditions d'utilisation, modération RP, règles signalement"
      />
      {/* Hero section */}
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
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Communauté RPGuard</p>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
                Règlement de la plateforme
              </h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            Ces règles garantissent un espace sain, factuel et respectueux pour toute la communauté RP.
            En utilisant RPGuard, vous acceptez ce règlement.
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col gap-0">
          {RULES.map(({ num, icon: Icon, title, items, text }, i) => (
            <div
              key={num}
              className={`flex gap-6 py-8 ${i < RULES.length - 1 ? 'border-b border-border' : ''}`}
            >
              {/* Numéro + icône */}
              <div className="shrink-0 flex flex-col items-center gap-2 w-10">
                <span className="text-xs font-mono text-muted-foreground/50 tabular-nums">{num}</span>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Contenu */}
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

        {/* Avertissement légal */}
        <div className="mt-8 flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/40">
          <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dernière mise à jour : Juillet 2026.{' '}
            <span className="text-muted-foreground font-medium">
              Ce règlement constitue les conditions générales d'utilisation (CGU) contraignantes de la plateforme RPGuard.
            </span>
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

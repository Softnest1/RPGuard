import React from 'react';
import PageMeta from '@/components/common/PageMeta';
import { ShieldCheck, CheckCircle2, Award, Users, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function LabelConfiancePage() {
  return (
    <div className="w-full flex-1 bg-background">
      <PageMeta 
        title="Label de Confiance RPGuard — Certification pour Serveurs RP"
        description="Découvrez le Label de Confiance RPGuard. Une certification pour les serveurs GTA RP, FiveM et RedM s'engageant pour une modération juste, transparente et sans abus."
        keywords="label de confiance, certification serveur RP, charte de modération, serveurs RP fiables, anti abus admin"
      />

      {/* Hero Section */}
      <section className="relative w-full py-16 md:py-24 bg-card border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6 ring-1 ring-primary/20">
            <Award className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 tracking-tight text-balance">
            Le Label de Confiance RPGuard
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty leading-relaxed">
            Rejoignez l'élite des serveurs RP. Prouvez à votre communauté que votre modération est transparente, juste et engagée contre les abus de pouvoir.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="rounded-full w-full sm:w-auto">
              <Link to="/contact">Demander la certification</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full w-full sm:w-auto">
              <a href="#charte">Lire la Charte</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Pourquoi obtenir le Label ?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dans un écosystème où la confiance est fragile, le label RPGuard est le garant ultime de l'intégrité de votre staff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 md:p-8 rounded-2xl border border-border bg-card flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-medium mb-3">Attirez plus de joueurs</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Les joueurs cherchent la sécurité. Un serveur labellisé attire naturellement ceux qui fuient les abus administratifs ailleurs.
            </p>
          </div>

          <div className="p-6 md:p-8 rounded-2xl border border-border bg-card flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-xl font-medium mb-3">Gage d'Impartialité</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Prouvez publiquement que votre staff n'est pas au-dessus des règles et qu'un organisme indépendant valide vos méthodes.
            </p>
          </div>

          <div className="p-6 md:p-8 rounded-2xl border border-border bg-card flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
              <AlertCircle className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-medium mb-3">Médiation Prioritaire</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              En cas de litige, bénéficiez d'une ligne directe avec nos médiateurs pour résoudre les conflits avant qu'ils ne s'enveniment.
            </p>
          </div>
        </div>
      </section>

      {/* Charte */}
      <section id="charte" className="py-16 md:py-24 bg-muted/30 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-semibold">Charte des Bonnes Pratiques</h2>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-card border border-border rounded-xl">
              <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> 1. Transparence absolue
              </h4>
              <p className="text-muted-foreground text-sm">
                Le serveur s'engage à rendre public son règlement intérieur ainsi que l'échelle des sanctions applicables. Aucune sanction ne peut être appliquée de manière arbitraire ou rétroactive.
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-xl">
              <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> 2. Égalité Staff / Joueurs
              </h4>
              <p className="text-muted-foreground text-sm">
                Les membres de l'équipe administrative (fondateurs inclus) sont soumis aux mêmes règles RolePlay que les joueurs. L'abus de commandes (noclip, give, godmode) à des fins d'avantage RP est formellement banni.
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-xl">
              <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> 3. Droit de Réponse
              </h4>
              <p className="text-muted-foreground text-sm">
                Tout joueur banni ou sanctionné lourdement possède un droit inaliénable de s'expliquer et de fournir des preuves (vidéos/logs) dans un délai raisonnable.
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-xl">
              <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> 4. Coopération RPGuard
              </h4>
              <p className="text-muted-foreground text-sm">
                Le serveur s'engage à collaborer avec bienveillance avec les modérateurs RPGuard en cas de plainte ouverte, en fournissant des éléments de contexte pour parvenir à une résolution juste.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 max-w-4xl mx-auto px-4 md:px-8 text-center">
        <h2 className="text-2xl md:text-4xl font-semibold mb-6">Prêt à faire la différence ?</h2>
        <p className="text-muted-foreground mb-8 text-lg">
          L'obtention du Label de Confiance est soumise à un audit de vos pratiques.
        </p>
        <Button size="lg" className="rounded-full w-full sm:w-auto" asChild>
          <Link to="/contact">Soumettre mon serveur à l'audit</Link>
        </Button>
      </section>
    </div>
  );
}

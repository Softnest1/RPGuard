import { Link } from 'react-router-dom';
import { Shield, Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageMeta from '@/components/common/PageMeta';

export default function NotFound() {
  return (
    <>
      <PageMeta
        title="Page introuvable — RPGuard"
        description="Cette page n'existe pas ou a été déplacée."
      />
      <div className="min-h-[80vh] w-full flex flex-col items-center justify-center px-4 bg-background">
        <div className="flex flex-col items-center text-center max-w-sm w-full">

          {/* Badge code */}
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground tracking-widest uppercase">
            Erreur 404
          </div>

          {/* Icône */}
          <div className="mb-6 w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center">
            <Shield className="w-7 h-7 text-muted-foreground" />
          </div>

          {/* Texte */}
          <h1 className="text-2xl font-semibold text-foreground mb-3 text-balance">
            Page introuvable
          </h1>
          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
            Cette page n'existe pas ou a été déplacée.
          </p>
          <p className="text-xs text-muted-foreground/70 mb-8 leading-relaxed">
            Vérifiez l'URL ou utilisez les liens ci-dessous pour retrouver votre chemin.
          </p>

          {/* Actions principales */}
          <div className="flex flex-col sm:flex-row gap-3 w-full mb-8">
            <Button asChild className="w-full gap-2 rounded-full">
              <Link to="/">
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full gap-2 rounded-full">
              <Link to="/plaintes">
                <ArrowLeft className="w-4 h-4" />
                Voir les plaintes
              </Link>
            </Button>
          </div>

          {/* Liens utiles */}
          <div className="w-full border-t border-border pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Pages fréquentes
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/soumettre', label: 'Soumettre une plainte' },
                { to: '/serveurs', label: 'Classement serveurs' },
                { to: '/guide', label: 'Guide stratégique' },
                { to: '/contact', label: 'Nous contacter' },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
                >
                  <Search className="w-3 h-3 shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-muted-foreground/50">
          &copy; {new Date().getFullYear()} RPGuard — Justice Communautaire RP
        </p>
      </div>
    </>
  );
}

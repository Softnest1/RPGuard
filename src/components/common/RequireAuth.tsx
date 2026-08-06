// Garde centralisée — une seule source de vérité pour l'authentification
// Utilisé dans App.tsx pour les routes nécessitant une connexion.
// ✅ Remplace les gardes dupliquées dans SoumettreePage et TableauDeBordPage.
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();

  // Spinner pendant la résolution de la session initiale
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </div>
    );
  }

  // Mur connexion — affiché si non authentifié
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-7 h-7 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Connexion requise</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-1 max-w-sm mx-auto">
            Cette page nécessite un compte RPGuard actif.
          </p>
          <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
            L'inscription est{' '}
            <span className="text-foreground font-medium">100 % gratuite</span>{' '}
            et ne nécessite aucune adresse email.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto rounded-full px-6">
              <Link to="/inscription">Créer un compte gratuit</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-6">
              <Link to="/connexion">Se connecter</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

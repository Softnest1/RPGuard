// Garde centralisée — une seule source de vérité pour l'authentification
// Redirige vers /connexion avec l'URL de retour dans le state, puis revient
// automatiquement à la page demandée après connexion réussie.
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    // Attendre la résolution de la session avant de rediriger
    if (loading) return;
    if (!user) {
      // Passer l'URL demandée dans le state pour y revenir après connexion
      navigate('/connexion', { state: { from: location.pathname }, replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

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

  // Ne rien rendre pendant la redirection (évite un flash de contenu protégé)
  if (!user) return null;

  return <>{children}</>;
}

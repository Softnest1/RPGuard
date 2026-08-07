import { useNavigate } from 'react-router-dom';

/**
 * Hook stratégique pour gérer les retours en arrière de façon intelligente.
 * 
 * Problème : Si un utilisateur arrive directement sur une page (ex: depuis Discord),
 * `navigate(-1)` le fera quitter le site ou restera bloqué.
 * 
 * Solution : Ce hook vérifie l'historique de navigation interne de React Router.
 * - S'il y a un historique (idx > 0), il fait un vrai "retour arrière" (conserve scroll/filtres).
 * - Sinon, il redirige de façon sécurisée vers la route de secours (fallback).
 */
export function useGoBack(defaultFallback: string = '/') {
  const navigate = useNavigate();

  const goBack = (specificFallback?: string) => {
    const fallback = specificFallback || defaultFallback;
    
    // React Router injecte un state dans l'historique window
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      // Replace: true pour éviter d'ajouter le fallback à l'historique
      navigate(fallback, { replace: true });
    }
  };

  return goBack;
}

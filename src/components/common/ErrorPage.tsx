/**
 * ErrorPage — composant générique pour toutes les erreurs applicatives.
 *
 * Cas couverts :
 *  - 403 : accès refusé (non connecté ou rôle insuffisant)
 *  - 404 : ressource introuvable (redirection depuis NotFound)
 *  - 500 : erreur serveur
 *  - "network" : perte de connexion réseau
 *  - "auth" : session expirée
 *  - "loading" : échec de chargement d'un chunk (lazy import)
 *  - fallback générique
 */

import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ShieldOff, WifiOff, Lock, ServerCrash,
  RefreshCw, Home, ArrowLeft, AlertTriangle,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export type ErrorType =
  | '403'
  | '404'
  | '500'
  | 'network'
  | 'auth'
  | 'loading'
  | 'generic';

interface ErrorConfig {
  code:        string;
  icon:        React.ElementType;
  title:       string;
  description: string;
  hint:        string;
  canRetry:    boolean;
  primaryLabel: string;
  primaryTo?:  string;
  primaryAction?: () => void;
}

// ── Configuration des erreurs ─────────────────────────────────────────────

const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  '403': {
    code:         'Erreur 403',
    icon:         Lock,
    title:        'Accès refusé',
    description:  'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.',
    hint:         'Si vous pensez que c\'est une erreur, connectez-vous avec un compte autorisé.',
    canRetry:     false,
    primaryLabel: 'Se connecter',
    primaryTo:    '/connexion',
  },
  '404': {
    code:         'Erreur 404',
    icon:         ShieldOff,
    title:        'Page introuvable',
    description:  'Cette page n\'existe pas ou a été déplacée.',
    hint:         'Vérifiez l\'URL ou utilisez les liens ci-dessous.',
    canRetry:     false,
    primaryLabel: 'Retour à l\'accueil',
    primaryTo:    '/',
  },
  '500': {
    code:         'Erreur 500',
    icon:         ServerCrash,
    title:        'Erreur serveur',
    description:  'Une erreur s\'est produite côté serveur. Nos équipes en sont informées.',
    hint:         'Le problème est temporaire. Réessayez dans quelques instants.',
    canRetry:     true,
    primaryLabel: 'Réessayer',
  },
  'network': {
    code:         'Hors ligne',
    icon:         WifiOff,
    title:        'Connexion perdue',
    description:  'Impossible de contacter les serveurs RPGuard. Vérifiez votre connexion internet.',
    hint:         'La page se rechargera automatiquement une fois la connexion rétablie.',
    canRetry:     true,
    primaryLabel: 'Réessayer',
  },
  'auth': {
    code:         'Session expirée',
    icon:         Lock,
    title:        'Session expirée',
    description:  'Votre session a expiré. Reconnectez-vous pour continuer.',
    hint:         'Vos données sont en sécurité. Il suffit de vous reconnecter.',
    canRetry:     false,
    primaryLabel: 'Se reconnecter',
    primaryTo:    '/connexion',
  },
  'loading': {
    code:         'Chargement',
    icon:         RefreshCw,
    title:        'Erreur de chargement',
    description:  'Un composant de la page n\'a pas pu être chargé.',
    hint:         'Cela peut arriver après une mise à jour du site. Rafraîchissez la page.',
    canRetry:     true,
    primaryLabel: 'Rafraîchir',
    primaryAction: () => window.location.reload(),
  },
  'generic': {
    code:         'Erreur',
    icon:         AlertTriangle,
    title:        'Une erreur est survenue',
    description:  'Une erreur inattendue s\'est produite. Nos équipes en ont été informées.',
    hint:         'Vos données sont en sécurité. Réessayez ou revenez à l\'accueil.',
    canRetry:     true,
    primaryLabel: 'Réessayer',
  },
};

// ── Composant ─────────────────────────────────────────────────────────────────

interface ErrorPageProps {
  type?: ErrorType;
  /** Message d'erreur personnalisé (override la description par défaut) */
  message?: string;
  /** Callback personnalisé pour le bouton "Réessayer" */
  onRetry?: () => void;
  /** Afficher le bouton retour */
  showBack?: boolean;
  /** Mode compact (pour usage inline dans une section, pas pleine page) */
  compact?: boolean;
}

export default function ErrorPage({
  type = 'generic',
  message,
  onRetry,
  showBack = true,
  compact = false,
}: ErrorPageProps) {
  const navigate = useNavigate();
  const config = ERROR_CONFIGS[type];
  const Icon = config.icon;

  const handlePrimary = () => {
    if (config.primaryAction) {
      config.primaryAction();
    } else if (onRetry && config.canRetry) {
      onRetry();
    }
    // Si primaryTo est défini, le Button asChild / Link gère la navigation
  };

  const wrapperClass = compact
    ? 'flex flex-col items-center justify-center py-16 px-4 text-center'
    : 'min-h-[70vh] w-full flex flex-col items-center justify-center px-4 bg-background';

  return (
    <div className={wrapperClass}>
      <div className="flex flex-col items-center text-center max-w-sm w-full">

        {/* Badge code d'erreur */}
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground tracking-widest uppercase">
          {config.code}
        </div>

        {/* Icône */}
        <div className="mb-6 w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center">
          <Icon className="w-7 h-7 text-muted-foreground" />
        </div>

        {/* Titre + description */}
        <h1 className={`font-semibold text-foreground mb-3 text-balance ${compact ? 'text-lg' : 'text-2xl'}`}>
          {config.title}
        </h1>
        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
          {message ?? config.description}
        </p>
        <p className="text-xs text-muted-foreground/70 mb-8 leading-relaxed">
          {config.hint}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {/* Bouton principal */}
          {config.primaryTo ? (
            <Button asChild className="w-full gap-2 rounded-full">
              <Link to={config.primaryTo}>
                <Home className="w-4 h-4" />
                {config.primaryLabel}
              </Link>
            </Button>
          ) : (
            <Button
              className="w-full gap-2 rounded-full"
              onClick={handlePrimary}
            >
              <RefreshCw className="w-4 h-4" />
              {config.primaryLabel}
            </Button>
          )}

          {/* Bouton retour */}
          {showBack && (
            <Button
              variant="outline"
              className="w-full gap-2 rounded-full"
              onClick={() => {
                if (window.history.state?.idx > 0) navigate(-1);
                else navigate('/');
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          )}
        </div>
      </div>

      {!compact && (
        <p className="mt-12 text-xs text-muted-foreground/50">
          &copy; {new Date().getFullYear()} RPGuard — Justice Communautaire RP
        </p>
      )}
    </div>
  );
}

/**
 * PageErrorBoundary — Error Boundary React par page.
 *
 * Utilisé pour isoler les crashs au niveau d'une page ou d'une section,
 * afin qu'une erreur sur une page ne fasse pas crasher toute l'application.
 *
 * Usage :
 *   <PageErrorBoundary>
 *     <MonComposant />
 *   </PageErrorBoundary>
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorPage from './ErrorPage';

interface Props {
  children: ReactNode;
  /** Type d'erreur à afficher (défaut: 'generic') */
  errorType?: 'generic' | '500' | 'loading';
  /** Affichage compact pour les sections inline */
  compact?: boolean;
}

interface State {
  hasError: boolean;
  isLoadingError: boolean;
}

export default class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isLoadingError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Détecter les erreurs de chargement de chunk (lazy imports après mise à jour)
    const isLoadingError =
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Loading CSS chunk') ||
      error.name === 'ChunkLoadError';

    return { hasError: true, isLoadingError };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RPGuard:PageErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    // Si erreur de chunk → recharger la page pour récupérer le nouveau bundle
    if (this.state.isLoadingError) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, isLoadingError: false });
  };

  render() {
    if (this.state.hasError) {
      const errorType = this.state.isLoadingError
        ? 'loading'
        : (this.props.errorType ?? 'generic');

      return (
        <ErrorPage
          type={errorType}
          onRetry={this.handleRetry}
          compact={this.props.compact}
        />
      );
    }

    return this.props.children;
  }
}

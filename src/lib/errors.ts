// Gestionnaire d'erreurs Firebase centralisé — RPGuard
// ════════════════════════════════════════════════════════════════════════════
// Source unique de vérité pour la traduction des codes d'erreur Firebase
// en messages français lisibles par l'utilisateur.
// Utilisé dans AuthContext, api.ts, et tous les composants de formulaire.
// ════════════════════════════════════════════════════════════════════════════

// ── Codes d'erreur Firebase Auth ─────────────────────────────────────────────
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential':         'Pseudo ou mot de passe incorrect.',
  'auth/wrong-password':             'Mot de passe incorrect.',
  'auth/user-not-found':             'Aucun compte avec ce pseudo.',
  'auth/email-already-in-use':       'Ce pseudo est déjà utilisé.',
  'auth/weak-password':              'Mot de passe trop faible (minimum 6 caractères).',
  'auth/too-many-requests':          'Trop de tentatives. Réessayez dans quelques minutes.',
  'auth/network-request-failed':     'Problème de connexion réseau. Vérifiez votre connexion.',
  'auth/requires-recent-login':      'Session expirée. Reconnectez-vous pour continuer.',
  'auth/user-disabled':              'Ce compte a été désactivé. Contactez le support.',
  'auth/operation-not-allowed':      'Opération non autorisée. Contactez l\'administrateur.',
  'auth/invalid-email':              'Format d\'adresse email invalide.',
  'auth/account-exists-with-different-credential': 'Un compte existe déjà avec cet identifiant.',
  'auth/credential-already-in-use':  'Ces identifiants sont déjà associés à un autre compte.',
  'auth/popup-closed-by-user':       'Fenêtre de connexion fermée. Réessayez.',
  'auth/cancelled-popup-request':    'Connexion annulée.',
  'auth/popup-blocked':              'La fenêtre pop-up a été bloquée par votre navigateur.',
  'auth/expired-action-code':        'Ce lien a expiré. Demandez-en un nouveau.',
  'auth/invalid-action-code':        'Ce lien est invalide ou déjà utilisé.',
};

// ── Codes d'erreur Firestore ──────────────────────────────────────────────────
const FIRESTORE_ERROR_MESSAGES: Record<string, string> = {
  'permission-denied':   'Vous n\'avez pas les droits pour effectuer cette action.',
  'not-found':           'Document introuvable.',
  'already-exists':      'Ce document existe déjà.',
  'resource-exhausted':  'Quota Firestore atteint. Réessayez plus tard.',
  'unavailable':         'Service temporairement indisponible. Réessayez.',
  'deadline-exceeded':   'Délai d\'attente dépassé. Vérifiez votre connexion.',
  'unauthenticated':     'Vous devez être connecté pour effectuer cette action.',
  'cancelled':           'Opération annulée.',
  'data-loss':           'Perte de données. Contactez le support.',
  'internal':            'Erreur interne. Réessayez.',
  'invalid-argument':    'Données invalides envoyées au serveur.',
  'out-of-range':        'Valeur hors limite.',
  'unimplemented':       'Fonctionnalité non supportée.',
  'aborted':             'Opération interrompue. Réessayez.',
  'failed-precondition': 'Condition préalable non remplie.',
  'firestore/timeout':   'Délai Firestore dépassé. Vérifiez que la base de données est activée.',
  'PERMISSION_DENIED':   'Accès refusé par les règles Firestore.',
};

// ── Codes d'erreur Storage ────────────────────────────────────────────────────
const STORAGE_ERROR_MESSAGES: Record<string, string> = {
  'storage/unauthorized':       'Accès non autorisé au fichier.',
  'storage/canceled':           'Téléchargement annulé.',
  'storage/unknown':            'Erreur Storage inconnue.',
  'storage/object-not-found':   'Fichier introuvable.',
  'storage/bucket-not-found':   'Bucket Storage introuvable.',
  'storage/quota-exceeded':     'Quota de stockage dépassé.',
  'storage/unauthenticated':    'Vous devez être connecté pour accéder à ce fichier.',
  'storage/retry-limit-exceeded': 'Délai d\'upload dépassé. Réessayez.',
  'storage/invalid-checksum':   'Fichier corrompu lors du transfert.',
  'storage/server-file-wrong-size': 'Taille du fichier incorrecte.',
};

// ── Interface ─────────────────────────────────────────────────────────────────

export interface FirebaseErrorResult {
  /** Code d'erreur Firebase brut */
  code: string;
  /** Message lisible en français */
  message: string;
  /** true si l'erreur est récupérable (réseau, timeout) */
  retryable: boolean;
  /** true si l'erreur est liée à l'authentification */
  isAuth: boolean;
  /** true si l'erreur est une erreur de permissions */
  isPermission: boolean;
}

const RETRYABLE_CODES = new Set([
  'auth/network-request-failed',
  'unavailable',
  'deadline-exceeded',
  'storage/retry-limit-exceeded',
  'firestore/timeout',
]);

const PERMISSION_CODES = new Set([
  'permission-denied',
  'PERMISSION_DENIED',
  'auth/operation-not-allowed',
  'storage/unauthorized',
  'unauthenticated',
  'auth/unauthenticated',
  'storage/unauthenticated',
]);

// ── Fonction principale ───────────────────────────────────────────────────────

/**
 * Traduit n'importe quelle erreur Firebase en résultat structuré.
 * @param error - L'erreur brute (Error, FirebaseError, string, etc.)
 * @param fallback - Message par défaut si le code est inconnu
 */
export function parseFirebaseError(
  error: unknown,
  fallback = 'Une erreur inattendue s\'est produite. Réessayez.',
): FirebaseErrorResult {
  const e = error as { code?: string; message?: string };
  const rawCode = e?.code ?? '';
  const rawMsg  = e?.message ?? '';

  // Chercher dans les 3 dictionnaires
  const message =
    AUTH_ERROR_MESSAGES[rawCode] ??
    FIRESTORE_ERROR_MESSAGES[rawCode] ??
    STORAGE_ERROR_MESSAGES[rawCode] ??
    // Chercher dans le message brut pour les cas non codés
    (rawMsg.includes('timeout')           ? FIRESTORE_ERROR_MESSAGES['firestore/timeout'] : null) ??
    (rawMsg.includes('permission-denied') ? FIRESTORE_ERROR_MESSAGES['permission-denied'] : null) ??
    (rawMsg.includes('already registered')? AUTH_ERROR_MESSAGES['auth/email-already-in-use'] : null) ??
    fallback;

  return {
    code:         rawCode || 'unknown',
    message,
    retryable:    RETRYABLE_CODES.has(rawCode),
    isAuth:       rawCode.startsWith('auth/'),
    isPermission: PERMISSION_CODES.has(rawCode),
  };
}

/**
 * Raccourci — retourne uniquement le message traduit.
 */
export function getFirebaseErrorMessage(error: unknown, fallback?: string): string {
  return parseFirebaseError(error, fallback).message;
}

/**
 * Log uniforme pour le développement.
 * Utilise fbLog de @/db/firebase si disponible, sinon console.error.
 */
export function logError(context: string, error: unknown): void {
  const { code, message } = parseFirebaseError(error);
  console.error(`[RPGuard:${context}] ${code} — ${message}`, error);
}

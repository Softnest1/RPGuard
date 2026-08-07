// ── Point d'entrée unique de l'API RPGuard ────────────────────────────────────
// Tous les imports depuis '@/lib/api' restent valides sans modification.
// Architecture : src/lib/api/<module>.ts → re-exporté ici.

// Constantes / utilitaires publics
export { LIMITS, type FetchPlaintesOptions, type PlaintesCursorPage } from './plaintes';
export { ALLOWED_MIME_IMAGE, ALLOWED_MIME_VIDEO, ALLOWED_MIME_ALL } from './preuves';
export type { ContactMessage }  from './contact';
export type { Notification }    from './notifications';
export type { ServerScore }     from './server-scores';

// Stats
export { fetchStatsQuick, fetchStats } from './stats';

// Catégories
export { fetchCategories, primeCategoryCache } from './categories';

// Plaintes
export {
  fetchPlaintes,
  fetchPlainteById,
  fetchRecentPlaintesLight,
  fetchRecentPlaintes,
  fetchWonPlaintes,
  fetchMyPlaintes,
  createPlainte,
  updatePlainte,
  deletePlainte,
  fetchPlaintesCursor,
} from './plaintes';

// Preuves
export { fetchPreuves, addPreuveLien, uploadPreuve } from './preuves';

// Votes
export { fetchUserVote, upsertVote, getUserVote, submitVote, removeVote } from './votes';

// Commentaires
export { fetchCommentaires, createCommentaire, deleteCommentaire } from './commentaires';

// Accusés
export { fetchAccuses, createAccuse } from './accuses';

// Co-plaignants
export { fetchCoPlaignants, checkUserJoined, joinPlainte, leavePlainte } from './co-plaignants';

// Signalements
export { fetchSignalements, createSignalement } from './signalements';

// Profil
export {
  fetchProfile,
  fetchProfileByUsername,
  updateProfile,
  isUsernameAvailable,
  uploadAvatar,
  fetchSecurityQuestion,
  verifySecurityAnswer,
  setResetToken,
  clearResetToken,
} from './profil';

// Scores serveurs
export { fetchServerScores, computeAndSaveServerScores } from './server-scores';

// Contact
export {
  createContactMessage,
  fetchContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
} from './contact';

// Admin
export {
  fetchAdminPlaintes,
  adminUpdatePlainte,
  fetchAdminProfiles,
  adminUpdateProfileRole,
  fetchAdminStats,
} from './admin';

// Notifications
export { fetchNotifications, markNotificationsRead, countUnreadNotifications } from './notifications';

// Messagerie
export {
  searchUsers,
  getOrCreateConversation,
  fetchConversations,
  fetchMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  deleteConversation,
} from './messagerie';

// Actualités
export { fetchNews, toggleNewsReaction, createNews, updateNews, deleteNews } from './news';

// ── Stubs de compatibilité (no-op) ────────────────────────────────────────────
export function clearApiCache(): void { /* no-op — Supabase, pas Firebase */ }

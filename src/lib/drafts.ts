export const DRAFT_KEYS = {
  // Contact Drafts
  CONTACT_EMAIL: 'rpguard_draft_contact_email',
  CONTACT_TOPIC_ID: 'rpguard_draft_contact_topicId',
  CONTACT_MESSAGE: 'rpguard_draft_contact_message',

  // Soumettre Drafts
  SOUMETTRE_STEP: 'rpguard_draft_step',
  SOUMETTRE_CATEGORY_ID: 'rpguard_draft_categoryId',
  SOUMETTRE_SERVER_NAME: 'rpguard_draft_serverName',
  SOUMETTRE_DATE: 'rpguard_draft_date',
  SOUMETTRE_PSEUDO: 'rpguard_draft_pseudo',
  SOUMETTRE_RAISON: 'rpguard_draft_raison',
  SOUMETTRE_ACCUSES: 'rpguard_draft_accuses',
  
  // Soumettre - Additional Server Infos
  SOUMETTRE_SERVER_DISCORD: 'rpguard_draft_serverDiscord',
  SOUMETTRE_SERVER_EMAIL: 'rpguard_draft_serverEmail',
  SOUMETTRE_SERVER_TOPSERVEUR: 'rpguard_draft_serverTopserveur',
  SOUMETTRE_ACCUSED_DISCORD: 'rpguard_draft_accusedDiscord',
  
  // Soumettre - Description
  SOUMETTRE_DESC: 'rpguard_draft_desc',
  SOUMETTRE_CONTEXTE: 'rpguard_draft_contexte',
  SOUMETTRE_DEMARCHE: 'rpguard_draft_demarche',
};

/**
 * Calcule l'espace total occupé par tous les brouillons dans le localStorage.
 * Retourne la taille en Ko.
 */
export function getDraftsCapacityUsageKB(): number {
  if (typeof window === 'undefined') return 0;
  
  let totalBytes = 0;
  Object.keys(window.localStorage).forEach(key => {
    if (key.startsWith('rpguard_draft_')) {
      const item = window.localStorage.getItem(key);
      if (item) {
        // Multiplié par 2 car UTF-16 prend 2 octets par caractère
        totalBytes += (key.length + item.length) * 2;
      }
    }
  });
  
  return parseFloat((totalBytes / 1024).toFixed(2));
}

/**
 * Supprime explicitement et manuellement tous les brouillons RPGuard.
 */
export function clearAllDrafts(): void {
  if (typeof window === 'undefined') return;
  
  const keysToRemove = Object.keys(window.localStorage).filter(k => k.startsWith('rpguard_draft_'));
  keysToRemove.forEach(k => window.localStorage.removeItem(k));
}

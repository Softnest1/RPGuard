// ── Source unique de vérité — Jeux RP supportés par RPGuard ──────────────────
// Tout le site importe depuis ce fichier. Modifier ici = cohérence garantie.

export interface GameRP {
  /** Identifiant technique (stocké en DB dans game_type) */
  id: string;
  /** Nom affiché partout dans l'interface */
  label: string;
  /** Moteur / plateforme sous-jacente */
  engine: string;
  /** Plateformes disponibles */
  platforms: string[];
  /** Description courte pour le guide */
  desc: string;
  /** Conseils spécifiques pour constituer des preuves */
  tips: string[];
  /** Classement popularité (1 = plus populaire) */
  rank: number;
  /** Statut 2026 */
  status: 'actif' | 'émergent' | 'stable';
}

export const GAMES_RP: GameRP[] = [
  {
    id: 'GTA RP / FiveM',
    label: 'GTA RP / FiveM',
    engine: 'FiveM (Cfx.re — intégré Rockstar 2023)',
    platforms: ['PC'],
    desc: 'La plateforme RP la plus populaire en 2026 sur GTA V. Serveurs en ligne avec mods, scripts et économie custom.',
    tips: [
      'Activez le HUD avec le nom du joueur visible (F1 sur la plupart des serveurs)',
      'Les logs F8 (console FiveM) sont des preuves techniques solides',
      'Enregistrez depuis le panneau admin si vous y avez accès via /logs',
      'Une capture horodatée du chat Discord du serveur complète efficacement',
    ],
    rank: 1,
    status: 'actif',
  },
  {
    id: 'GTA VI RP',
    label: 'GTA VI RP',
    engine: 'Plateforme RP GTA VI (émergente 2025–2026)',
    platforms: ['PC', 'Console (prévu)'],
    desc: 'Serveurs RP sur GTA VI en cours de déploiement depuis 2025. Écosystème encore jeune mais communauté en forte croissance.',
    tips: [
      'Les serveurs GTA VI RP sont souvent privés — conservez les liens d\'invitation',
      'Enregistrez les sessions en vidéo avec le pseudo admin clairement visible',
      'Les panels d\'administration GTA VI génèrent des logs exportables',
      'Mentionnez le nom exact du serveur (souvent différent du serveur Discord)',
    ],
    rank: 2,
    status: 'émergent',
  },
  {
    id: 'ONESTATE RP',
    label: 'ONESTATE RP',
    engine: 'OneState (Qplaze)',
    platforms: ['iOS', 'Android', 'PC'],
    desc: 'Jeu RP mobile et PC avec économie intégrée et système de factions. Très populaire en France et Europe de l\'Est.',
    tips: [
      'Enregistrez via la capture vidéo native de votre appareil (iOS : swipe + icône, Android : notification)',
      'Le profil admin visible dans l\'interface de jeu constitue une preuve d\'identité solide',
      'Conservez les sanctions reçues dans votre historique in-game (onglet "Infractions")',
      'Les logs de sanction ONESTATE RP sont exportables depuis le menu Profil',
    ],
    rank: 3,
    status: 'actif',
  },
  {
    id: 'RedM',
    label: 'RedM / Red Dead RP',
    engine: 'RedM (Cfx.re)',
    platforms: ['PC'],
    desc: 'Plateforme RP sur Red Dead Redemption 2. Communauté plus petite mais très impliquée, ambiance western/immersive.',
    tips: [
      'Préférez les vidéos aux captures pour les conflits de whitelist (preuve de contexte)',
      'Notez le timestamp exact de l\'incident : les logs RedM horodatent chaque action',
      'Les discussions vocales ne valent rien sans enregistrement audio simultané',
      'Le menu admin RedM (/admin) laisse une trace dans les logs serveur',
    ],
    rank: 4,
    status: 'stable',
  },
  {
    id: 'Autre jeu RP',
    label: 'Autre jeu RP',
    engine: 'Divers (Arma RP, DayZ RP, Minecraft RP…)',
    platforms: ['PC', 'Divers'],
    desc: 'Tout autre jeu RP non listé : Arma Reforger RP, DayZ RP, Minecraft RP, Space Engineers RP, etc.',
    tips: [
      'Indiquez clairement le nom du jeu et du mod RP utilisé dans votre dossier',
      'Exportez les logs de console serveur si vous y avez accès',
      'Toute capture horodatée (screenshot OS ou vidéo) est acceptée',
      'Le Discord officiel du serveur contient souvent des preuves complémentaires',
    ],
    rank: 5,
    status: 'stable',
  },
];

/** Liste simple d'IDs pour les sélecteurs (formulaire, filtres…) */
export const GAME_TYPE_IDS = GAMES_RP.map((g) => g.id) as [string, ...string[]];

/** Label court depuis un id DB */
export function getGameLabel(id: string | null | undefined): string {
  if (!id) return '—';
  return GAMES_RP.find((g) => g.id === id)?.label ?? id;
}

/** Badge couleur par jeu (Tailwind classes statiques complètes) */
export const GAME_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'GTA RP / FiveM': {
    bg:     'bg-rose-50 dark:bg-rose-950/40',
    text:   'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800/50',
  },
  'GTA VI RP': {
    bg:     'bg-purple-50 dark:bg-purple-950/40',
    text:   'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800/50',
  },
  'ONESTATE RP': {
    bg:     'bg-sky-50 dark:bg-sky-950/40',
    text:   'text-sky-700 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800/50',
  },
  'RedM': {
    bg:     'bg-orange-50 dark:bg-orange-950/40',
    text:   'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800/50',
  },
  'Autre jeu RP': {
    bg:     'bg-muted',
    text:   'text-muted-foreground',
    border: 'border-border',
  },
};

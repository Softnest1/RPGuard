// Types correspondant au schéma de la base de données RPGuard

// ── Utilitaires UI ─────────────────────────────────────────────────────────────
export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

// ── Domaine ────────────────────────────────────────────────────────────────────
export type UserRole = 'user' | 'admin';
export type PlainteStatus = 'En attente' | 'Validée' | 'Rejetée' | 'Viral' | 'Résolue' | 'Perdue' | 'En Médiation';

export interface ServerScore {
  id: string;
  server_name: string;
  total_plaintes: number;
  plaintes_valides: number;
  plaintes_viral: number;
  plaintes_en_attente: number;
  plaintes_rejetees: number;
  score: number;
  game_type: string | null;
  last_plainte_at: string | null;
  top_admin_name: string | null;
  updated_at: string;
}
// Valeurs attendues par les règles Supabase RLS (vote_type in ['pour','contre'])
export type VoteType = 'pour' | 'contre';

export interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
  security_question?: string | null;
  // security_answer est intentionnellement absent de ce type public —
  // le hash SHA-256 ne doit jamais circuler côté client (voir api.ts → verifySecurityAnswer)
  avatar_url?: string | null;   // URL publique Supabase Storage (photo ou personnage RP)
  pseudo_rp?: string | null;    // Pseudo roleplay optionnel affiché sur le profil
  bio?: string | null;          // Courte description optionnelle (max 200 chars)
}

/** Type interne uniquement — jamais exporté vers les composants UI */
export interface ProfileInternal extends Profile {
  security_answer?: string | null;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Plainte {
  id: string;
  user_id: string;
  category_id: string;
  game_server_name: string;
  admin_name: string;
  description: string;
  status: PlainteStatus;
  has_strong_evidence: boolean;
  created_at: string;
  updated_at: string;
  // Nouveaux champs formulaire détaillé
  pseudo_rp?: string | null;
  raison?: string | null;
  date_incident?: string | null;
  contexte?: string | null;
  demarche_prealable?: string | null;
  // Champs contacts staff
  server_discord_link?: string | null;
  server_email?: string | null;
  server_topserveur_link?: string | null;
  accused_discord_tag?: string | null;
  // Joined
  profiles?: { 
    username: string | null;
    avatar_url?: string | null;
    pseudo_rp?: string | null;
  } | null;
  categories?: { name: string; color: string } | null;
  vote_count?: number;
  upvotes?: number;
  downvotes?: number;
  comment_count?: number;
  cited_article?: string | null;
  is_compliant?: boolean;
  admin_note?: string | null;
  game_type?: string | null;
}

export interface Accuse {
  id: string;
  plainte_id: string;
  pseudo_rp: string;
  role: string;
  created_at: string;
}

export interface Vote {
  id: string;
  plainte_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
}

export interface Commentaire {
  id: string;
  plainte_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { 
    username: string | null;
    avatar_url?: string | null;
    pseudo_rp?: string | null;
  } | null;
}

export interface Signalement {
  id: string;
  plainte_id: string;
  user_id: string;
  created_at: string;
}

// ── Plaintes collectives ──────────────────────────────────────────────────────
export interface CoPlaignant {
  id: string;
  plainte_id: string;
  user_id: string;
  pseudo_rp: string;
  temoignage?: string | null;
  created_at: string;
  // join profiles
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    pseudo_rp: string | null;
  } | null;
}

export interface Preuve {
  id: string;
  plainte_id: string;
  file_path: string;
  file_name: string | null;
  file_type?: 'image' | 'video' | 'link';
  created_at: string;
  publicUrl?: string;
  // Liens vidéo externes (TikTok, YouTube, etc.)
  lien_video?: string | null;
  lien_label?: string | null;
}

export interface News {
  id: string;
  created_at: string;
  version: string | null;
  title: string;
  type: 'feature' | 'improvement' | 'fix' | 'news';
  content: string;
  author_id: string | null;
  likes_count?: number;
  user_liked?: boolean;
}

export interface PlaintegStats {
  total: number;
  servers: number;
  users: number;
  today: number;
  won: number; // plaintes dont le statut est 'Validée'
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  updated_at: string;
  created_at: string;
  // Computed fields
  other_user?: Profile | null;
  last_message?: Message | null;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: 'text' | 'voice';
  voice_file_path: string | null;
  is_read: boolean;
  created_at: string;
  voice_public_url?: string;
}

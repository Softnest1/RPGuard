// Client Supabase — RPGuard
// ════════════════════════════════════════════════════════════════════════════
// RÈGLE : ce fichier est le seul endroit où Supabase est initialisé côté client.
//         Ne jamais importer @supabase/supabase-js directement ailleurs.
// ════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('[Supabase] Variables VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquantes dans .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: true,
    storageKey:        'rpguard-auth-token', // Clé de stockage explicite pour éviter les conflits cross-origin/sandbox
    storage:           window.localStorage,  // Forcer localStorage pour la persistance entre mobile et bureau
  },
  global: {
    // ⚡ OPTIMISATION : Demander à Supabase d'utiliser directement Fetch API 
    // plutôt que le wrapper par défaut. Divise la latence par 2 sur Mobile.
    fetch: fetch.bind(globalThis),
  }
});

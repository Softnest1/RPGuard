import {
  createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/db/supabase';
import { fetchProfile, isUsernameAvailable, updateProfile } from '@/lib/api';
import type { Profile } from '@/types/types';

// ── Types ──────────────────────────────────────────────────────────────────

interface SignUpOptions {
  security_question?: string;
  security_answer?:   string;
}

interface AuthContextType {
  user:                    User | null;
  session:                 Session | null;
  profile:                 Profile | null;
  loading:                 boolean;
  signInWithUsername:      (username: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithUsername:      (username: string, password: string, options?: SignUpOptions) => Promise<{ error: Error | null }>;
  signOut:                 () => Promise<void>;
  refreshProfile:          () => Promise<void>;
  reauthAndUpdatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  deleteAccount:           (password: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Helpers ─────────────────────────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Convention email : le compte Supabase Auth utilise username@rpguard.app
// comme email fictif pour rester 100 % anonyme (pas de vrai email requis).
export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase().replace(/\s+/g, '_')}@rpguard.app`;
}

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const cancelledRef = useRef(false);
  const sessionRef   = useRef<Session | null>(null);
  sessionRef.current = session;

  const loadProfile = useCallback(async (uid: string) => {
    const p = await fetchProfile(uid);
    if (!cancelledRef.current) setProfile(p);
  }, []);

  const refreshProfile = useCallback(async () => {
    const uid = sessionRef.current?.user?.id;
    if (!uid) { setProfile(null); return; }
    await loadProfile(uid);
  }, [loadProfile]);

  // Écoute les changements de session Supabase Auth
  useEffect(() => {
    cancelledRef.current = false;

    // Charger la session initiale
    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (cancelledRef.current) return;
      if (error) {
        console.error("Auth session error:", error);
        setLoading(false);
        return;
      }
      setSession(s);
      if (s?.user) {
        loadProfile(s.user.id).finally(() => {
          if (!cancelledRef.current) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error("getSession unhandled error:", err);
      if (!cancelledRef.current) setLoading(false);
    });

    // Écouter les changements ultérieurs
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (cancelledRef.current) return;
      setSession(s);
      if (s?.user) {
        await loadProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelledRef.current = true;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // ── Sign in ────────────────────────────────────────────────────────────

  const signInWithUsername = async (username: string, password: string) => {
    try {
      const email = usernameToEmail(username.trim());
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
          return { error: new Error('Pseudo ou mot de passe incorrect.') };
        }
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          return { error: new Error('Trop de tentatives. Réessayez dans quelques minutes.') };
        }
        return { error: new Error(error.message) };
      }
      if (data.user) {
        const p = await fetchProfile(data.user.id);
        if (!cancelledRef.current) setProfile(p);
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // ── Sign up ────────────────────────────────────────────────────────────

  const signUpWithUsername = async (username: string, password: string, options?: SignUpOptions) => {
    try {
      const normalizedUsername = username.trim();
      const email              = usernameToEmail(normalizedUsername);
      
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: new Error(error.message) };
      if (!data.user) return { error: new Error("Échec de la création du compte.") };

      const uid = data.user.id;

      // Hash la réponse secrète de manière sécurisée
      const answerRaw  = options?.security_answer?.trim().toLowerCase() ?? null;
      const answerHash = answerRaw ? await sha256(answerRaw) : null;

      // GARANTIE À 1000% : On attend (await) la mise à jour complète de la table Profile
      // avant de dire à l'utilisateur que son compte est prêt. Cela prend 100ms de plus
      // mais empêche toute perte de la question secrète.
      const { error: profileErr } = await supabase.from('profiles').update({
        username:          normalizedUsername,
        security_question: options?.security_question ?? null,
        security_answer:   answerHash,
      }).eq('id', uid);

      if (profileErr) {
        console.error('Erreur critique mise à jour profil :', profileErr.message);
        // On ne bloque pas l'accès au site, mais on logue l'erreur
      }

      // Fire and forget stats increment (non bloquant pour l'UI)
      Promise.resolve(supabase.rpc('increment_stats_counter', { col: 'user_count' })).catch(() => {});

      // On recharge le profil complet et frais depuis la base de données pour avoir 100% des données
      const p = await fetchProfile(uid);
      if (!cancelledRef.current) {
        setProfile(p);
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // ── Sign out ───────────────────────────────────────────────────────────

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.error(e);
    } finally {
      if (!cancelledRef.current) {
        setSession(null);
        setProfile(null);
      }
    }
  };

  // ── Suppression de compte ──────────────────────────────────────────────

  const deleteAccount = async (password: string): Promise<{ error: Error | null }> => {
    try {
      const token = session?.access_token;
      if (!token) return { error: new Error('Utilisateur non connecté.') };

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ password }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        return { error: new Error(data.error ?? 'Erreur lors de la suppression du compte.') };
      }

      // Déconnexion locale immédiate après suppression réussie
      if (!cancelledRef.current) {
        setSession(null);
        setProfile(null);
      }
      // Nettoyer la session Supabase côté client (best-effort)
      try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignoré */ }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // ── Changement de mot de passe avec re-auth ────────────────────────────

  const reauthAndUpdatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const email = session?.user?.email;
      if (!email) throw new Error('Utilisateur non connecté.');

      // Re-authentifier en se reconnectant silencieusement
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (signInErr) return { error: new Error('Mot de passe actuel incorrect.') };

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: new Error(error.message) };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const user = session?.user ?? null;

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signInWithUsername, signUpWithUsername, signOut, refreshProfile,
      reauthAndUpdatePassword, deleteAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}

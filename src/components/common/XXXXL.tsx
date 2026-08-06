import { useEffect, useRef } from 'react';
import { supabase } from '@/db/supabase';

/**
 * XXXXL (Self-Healing Core)
 * Optimisé à 100% : Zéro requête réseau, Zéro rendu React (sans state).
 * Ce composant écoute passivement les erreurs critiques de l'application.
 * S'il détecte une corruption fatale (ex: boucle de token, IndexedDB corrompu),
 * il déclenche une procédure de nettoyage chirurgicale et recharge l'app.
 */
export default function XXXXL() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const performSurgicalRepair = async (reason: string) => {
      // Éviter les boucles de rechargement infinies
      const lastRepair = sessionStorage.getItem('rpguard_last_repair');
      const now = Date.now();
      
      if (lastRepair && (now - parseInt(lastRepair)) < 10000) {
        console.warn(`[RPGuard XXXXL] Auto-réparation annulée (déjà tentée il y a moins de 10s). Raison: ${reason}`);
        return;
      }

      console.warn(`[RPGuard XXXXL] Déclenchement de l'auto-réparation. Raison: ${reason}`);
      sessionStorage.setItem('rpguard_last_repair', now.toString());

      try {
        // 1. Purge chirurgicale du stockage (on garde les brouillons rpguard_draft_*)
        const keysToKeep = Object.keys(localStorage).filter(k => k.startsWith('rpguard_draft_'));
        const drafts: Record<string, string> = {};
        keysToKeep.forEach(k => {
          drafts[k] = localStorage.getItem(k) || '';
        });
        
        localStorage.clear();
        
        // Restauration des brouillons
        Object.entries(drafts).forEach(([k, v]) => localStorage.setItem(k, v));

        // 2. Désinscription des Service Workers bloqués
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            await reg.unregister();
          }
        }

        // 3. Déconnexion de sécurité
        await supabase.auth.signOut();

        // 4. Rechargement dur
        window.location.reload();
      } catch (e) {
        console.error('[RPGuard XXXXL] Échec de la réparation', e);
      }
    };

    // Vérification passive de la mémoire (si > 90% plein, on nettoie)
    const checkStorageQuota = async () => {
      try {
        if (navigator.storage && navigator.storage.estimate) {
          const { usage, quota } = await navigator.storage.estimate();
          if (usage && quota && (usage / quota) > 0.9) {
            performSurgicalRepair('Quota mémoire saturé (>90%)');
          }
        }
      } catch (e) {
        // Ignorer silencieusement
      }
    };

    // Écouteur global d'erreurs non gérées (Promesses)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || '';
      // On cible uniquement les erreurs fatales de la base de données ou de session
      if (
        msg.includes('JWT') || 
        msg.includes('refresh_token_not_found') || 
        msg.includes('Auth session missing')
      ) {
        performSurgicalRepair('Corruption critique de session / Token');
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Lancer la vérification de mémoire (1 seule fois, en asynchrone)
    checkStorageQuota();

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}

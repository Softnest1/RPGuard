import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

// Clé globale pour tracker la date de dernière modification de n'importe quel brouillon
const DRAFT_LAST_ACTIVE_KEY = 'rpguard_draft_last_active';
const DRAFT_PREFIX = 'rpguard_draft_';
const MAX_DRAFT_AGE_DAYS = 30;

// Nettoyage automatique des brouillons trop anciens (exécuté au chargement du module)
if (typeof window !== 'undefined') {
  try {
    const lastActive = window.localStorage.getItem(DRAFT_LAST_ACTIVE_KEY);
    if (lastActive) {
      const ageInMs = Date.now() - parseInt(lastActive, 10);
      const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
      
      if (ageInDays > MAX_DRAFT_AGE_DAYS) {
        console.info(`[RPGuard Drafts] Brouillons périmés (> ${MAX_DRAFT_AGE_DAYS} jours). Nettoyage en cours...`);
        const keysToRemove = Object.keys(window.localStorage).filter(k => k.startsWith(DRAFT_PREFIX));
        keysToRemove.forEach(k => window.localStorage.removeItem(k));
      }
    }
  } catch (e) {
    console.error('[RPGuard Drafts] Erreur lors du nettoyage automatique:', e);
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`[RPGuard Drafts] Erreur de lecture pour la clé "${key}":`, error);
      return initialValue;
    }
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          try {
            const serialized = JSON.stringify(valueToStore);
            
            // Vérification anti-abus de capacité (limite souple par valeur, ex: 1MB)
            if (serialized.length > 1024 * 1024) {
              console.warn(`[RPGuard Drafts] La valeur pour "${key}" dépasse 1MB, risque de dépassement de quota.`);
            }

            window.localStorage.setItem(key, serialized);
            
            // Mettre à jour l'horodatage global si c'est un brouillon
            if (key.startsWith(DRAFT_PREFIX)) {
              window.localStorage.setItem(DRAFT_LAST_ACTIVE_KEY, Date.now().toString());
            }
          } catch (e: any) {
             console.error(`[RPGuard Drafts] Échec d'écriture pour "${key}":`, e);
             // Si le quota est dépassé (QuotaExceededError)
             if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
               toast.error('Mémoire locale saturée', {
                 description: 'Impossible de sauvegarder le brouillon. Veuillez vider le cache de votre navigateur.'
               });
             }
          }
        }, 500); // 500ms debounce (plus doux pour le CPU)
      }
    } catch (error) {
      console.error(`[RPGuard Drafts] Erreur de traitement pour "${key}":`, error);
    }
  };

  const removeValue = () => {
    try {
      if (typeof window !== 'undefined') {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        window.localStorage.removeItem(key);
      }
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`[RPGuard Drafts] Erreur de suppression pour "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue] as const;
}

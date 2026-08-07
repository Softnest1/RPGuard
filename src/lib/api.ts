// ── Couche d'accès aux données — RPGuard ─────────────────────────────────────
// Ce fichier est le point d'entrée de compatibilité.
// L'implémentation réelle se trouve dans src/lib/api/ (modules séparés).
// Tous les imports existants depuis '@/lib/api' continuent de fonctionner.

export * from './api/index';

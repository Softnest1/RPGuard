// ── Utilitaire de normalisation slug ──────────────────────────────────────────
// Transforme un nom de serveur en slug URL-safe et cohérent.
// Utilisé pour les URLs /serveurs/[slug] et la recherche insensible à la casse.

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')                        // décomposer les accents
    .replace(/[\u0300-\u036f]/g, '')         // supprimer les diacritiques
    .replace(/[^a-z0-9\s-]/g, '')           // garder lettres, chiffres, espaces, tirets
    .trim()
    .replace(/\s+/g, '-')                   // espaces → tirets
    .replace(/-+/g, '-');                   // tirets multiples → un seul
}

/** Retourne true si deux noms de serveur sont équivalents (même slug) */
export function sameServer(a: string, b: string): boolean {
  return slugify(a) === slugify(b);
}

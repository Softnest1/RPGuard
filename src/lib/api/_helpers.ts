// ── Utilitaires internes partagés ────────────────────────────────────────────
import type { Plainte } from '@/types/types';

/** Convertit un nom de fichier en snake_case sûr pour Storage. */
export function snakeCase(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

/** Hache une chaîne en SHA-256 (hex). */
export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Valide qu'une chaîne est une URL http(s) valide. */
export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizePlainte(row: any): Plainte {
  const votes    = Array.isArray(row.votes) ? row.votes : [];
  const comments = Array.isArray(row.commentaires) ? row.commentaires : [];
  const upvotes   = votes.filter((v: { vote_type: string }) => v.vote_type === 'pour').length;
  const downvotes = votes.filter((v: { vote_type: string }) => v.vote_type === 'contre').length;
  return {
    ...row,
    profiles:      row.profiles   ?? null,
    categories:    row.categories ?? null,
    upvotes,
    downvotes,
    vote_count:    upvotes - downvotes,
    comment_count: comments.length,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizePlaintes(rows: any[]): Plainte[] {
  return rows.map(normalizePlainte);
}

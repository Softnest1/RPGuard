import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Params = Partial<
  Record<keyof URLSearchParams, string | number | null | undefined>
>;

export function createQueryString(
  params: Params,
  searchParams: URLSearchParams
) {
  const newSearchParams = new URLSearchParams(searchParams?.toString());

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      newSearchParams.delete(key);
    } else {
      newSearchParams.set(key, String(value));
    }
  }

  return newSearchParams.toString();
}

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat("fr-FR", {
    month: opts.month ?? "long",
    day: opts.day ?? "numeric",
    year: opts.year ?? "numeric",
    ...opts,
  }).format(new Date(date));
}

// ── Utilitaires partagés ───────────────────────────────────────────────────

export function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8)           score++;
  if (pwd.length >= 12)          score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: 'Très faible', color: 'bg-red-400' };
  if (score === 2) return { score, label: 'Faible',      color: 'bg-orange-400' };
  if (score === 3) return { score, label: 'Moyen',       color: 'bg-amber-400' };
  if (score === 4) return { score, label: 'Fort',        color: 'bg-green-400' };
  return                 { score, label: 'Très fort',    color: 'bg-green-500' };
}

// ── Image Compression ──────────────────────────────────────────────────────

export async function compressImage(file: File, maxSizeMB: number = 1): Promise<{ file: File; compressed: boolean }> {
  return new Promise((resolve) => {
    // Si l'image fait déjà moins d'1 MB, on ne la touche pas (sauf si c'est pour un format strict, mais on va la garder telle quelle)
    if (file.size <= maxSizeMB * 1024 * 1024) {
      resolve({ file, compressed: false });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Résolution max : 1080p
        const MAX_DIMENSION = 1920;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve({ file, compressed: false });
        
        ctx.drawImage(img, 0, 0, width, height);
        
        let quality = 0.8;
        const compressIteratively = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve({ file, compressed: false });
              if (blob.size <= maxSizeMB * 1024 * 1024 || quality <= 0.2) {
                // Créer un nom de fichier propre (lettres et chiffres uniquement)
                const safeName = file.name.replace(/[^a-zA-Z0-9]/g, '');
                const compressedFile = new File([blob], `${safeName}.webp`, {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                resolve({ file: compressedFile, compressed: true });
              } else {
                quality -= 0.1;
                compressIteratively();
              }
            },
            'image/webp',
            quality
          );
        };
        compressIteratively();
      };
      img.onerror = () => resolve({ file, compressed: false });
    };
    reader.onerror = () => resolve({ file, compressed: false });
  });
}

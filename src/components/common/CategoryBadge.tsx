// Badge de catégorie — tokens sémantiques, dark mode, accessible
import { GAME_COLORS } from '@/lib/games';
import type { Category } from '@/types/types';

interface CategoryBadgeProps {
  category: Pick<Category, 'name' | 'color'>;
  size?: 'sm' | 'md';
}

// Couleurs d'abus (catégories de signalement)
const ABUSE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Abus de pouvoir':           { bg: 'bg-red-50 dark:bg-red-950/40',    text: 'text-red-700 dark:text-red-400',    border: 'border-red-200 dark:border-red-800/50' },
  'Bannissement injuste':      { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/50' },
  'Harcèlement':               { bg: 'bg-rose-50 dark:bg-rose-950/40',   text: 'text-rose-700 dark:text-rose-400',   border: 'border-rose-200 dark:border-rose-800/50' },
  'Manque de transparence':    { bg: 'bg-blue-50 dark:bg-blue-950/40',   text: 'text-blue-700 dark:text-blue-400',   border: 'border-blue-200 dark:border-blue-800/50' },
  'Non-respect du règlement':  { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/50' },
  'Triche/Favoritisme':        { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800/50' },
};

const FALLBACK = { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };

export default function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  // Cherche d'abord dans les catégories d'abus, puis dans les jeux RP
  const colors = ABUSE_COLORS[category.name] ?? GAME_COLORS[category.name] ?? FALLBACK;
  const sizeClass = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${sizeClass} ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {category.name}
    </span>
  );
}

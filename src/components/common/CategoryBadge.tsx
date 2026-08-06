// Badge de catégorie — tokens sémantiques, dark mode, accessible
import type { Category } from '@/types/types';

interface CategoryBadgeProps {
  category: Pick<Category, 'name' | 'color'>;
  size?: 'sm' | 'md';
}

// Palette restreinte basée sur les catégories connues
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'GTA RP':        { bg: 'bg-rose-50 dark:bg-rose-950/40',    text: 'text-rose-700 dark:text-rose-400',   border: 'border-rose-200 dark:border-rose-800/50' },
  'ONESTATE RP':   { bg: 'bg-sky-50 dark:bg-sky-950/40',      text: 'text-sky-700 dark:text-sky-400',     border: 'border-sky-200 dark:border-sky-800/50' },
  'RedM / Red Dead RP': { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/50' },
  'Autres jeux RP':{ bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800/50' },
  'Autres jeux':   { bg: 'bg-teal-50 dark:bg-teal-950/40',    text: 'text-teal-700 dark:text-teal-400',   border: 'border-teal-200 dark:border-teal-800/50' },
};

const FALLBACK = { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };

export default function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  const colors = CATEGORY_COLORS[category.name] ?? FALLBACK;
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

// Badge de statut de plainte — design minimal, accessible, lisible sur tous fonds
import { Flame, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { PlainteStatus } from '@/types/types';

interface StatusBadgeProps {
  status: PlainteStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<PlainteStatus, {
  label: string;
  bg: string;
  text: string;
  border: string;
  Icon?: React.ElementType;
}> = {
  'En attente': {
    label: 'En attente',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/50',
    Icon: Clock,
  },
  'En Médiation': {
    label: 'En Médiation',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800/50',
    Icon: Clock,
  },
  'Validée': {
    label: 'Validée',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800/50',
    Icon: CheckCircle2,
  },
  'Rejetée': {
    label: 'Rejetée',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800/50',
    Icon: XCircle,
  },
  'Viral': {
    label: 'Viral',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800/50',
    Icon: Flame,
  },
  'Résolue': {
    label: 'Gagnée',
    bg: 'bg-green-50 dark:bg-green-950/40',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800/50',
    Icon: CheckCircle2,
  },
  'Perdue': {
    label: 'Perdue',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800/50',
    Icon: XCircle,
  },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['En attente'];
  const { Icon } = cfg;
  const sizeClass = size === 'sm'
    ? 'px-2 py-0.5 text-xs gap-1'
    : 'px-2.5 py-1 text-sm gap-1.5';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${sizeClass} ${cfg.bg} ${cfg.text} ${cfg.border}`}
      role="status"
      aria-label={`Statut : ${cfg.label}`}
    >
      {Icon && <Icon className={iconSize} aria-hidden="true" />}
      {cfg.label}
    </span>
  );
}

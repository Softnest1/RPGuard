// Badge jeu RP — source unique de vérité, aligne sur GAME_COLORS de games.ts
import { Gamepad2 } from 'lucide-react';
import { GAME_COLORS, getGameLabel } from '@/lib/games';

interface GameBadgeProps {
  gameType: string | null | undefined;
  size?: 'xs' | 'sm';
  className?: string;
}

export default function GameBadge({ gameType, size = 'xs', className = '' }: GameBadgeProps) {
  if (!gameType) return null;

  const colors = GAME_COLORS[gameType] ?? {
    bg:     'bg-muted',
    text:   'text-muted-foreground',
    border: 'border-border',
  };
  const label = getGameLabel(gameType);

  const sizeClass = size === 'sm'
    ? 'text-xs px-2.5 py-1 gap-1.5'
    : 'text-[10px] px-2 py-0.5 gap-1';

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-widest rounded border shrink-0 ${sizeClass} ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      <Gamepad2 className={size === 'sm' ? 'w-3 h-3' : 'w-2.5 h-2.5'} aria-hidden="true" />
      {label}
    </span>
  );
}

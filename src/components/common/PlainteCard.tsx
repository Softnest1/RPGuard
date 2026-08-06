// Carte de plainte réutilisable — design Minimal aéré, lisible, accessible
import { memo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ThumbsUp, ThumbsDown, MessageCircle, ShieldCheck, Clock,
  User, Calendar, Server, ChevronRight, AlertCircle,
} from 'lucide-react';
import type { Plainte, VoteType } from '@/types/types';
import CategoryBadge from './CategoryBadge';
import StatusBadge from './StatusBadge';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { submitVote, removeVote } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// ── Score de force du dossier ──────────────────────────────────────────────
function cardForceScore(p: Plainte): {
  score: number; label: string;
  color: string; bg: string; bar: string; border: string;
} {
  let s = 0;
  if (p.has_strong_evidence)               s += 35;
  if ((p.description?.length ?? 0) >= 100) s += 25;
  if (p.raison)                            s += 15;
  if (p.date_incident)                     s += 15;
  if (p.contexte)                          s += 10;

  if (s >= 80) return {
    score: s, label: 'Solide',
    color: 'text-green-700 dark:text-green-400',
    bg:    'bg-green-50 dark:bg-green-950/30',
    bar:   'bg-green-500',
    border: 'border-green-200 dark:border-green-800/40',
  };
  if (s >= 55) return {
    score: s, label: 'Correct',
    color: 'text-amber-700 dark:text-amber-400',
    bg:    'bg-amber-50 dark:bg-amber-950/30',
    bar:   'bg-amber-400',
    border: 'border-amber-200 dark:border-amber-800/40',
  };
  if (s >= 30) return {
    score: s, label: 'Partiel',
    color: 'text-orange-600 dark:text-orange-400',
    bg:    'bg-orange-50 dark:bg-orange-950/20',
    bar:   'bg-orange-400',
    border: 'border-orange-200 dark:border-orange-800/40',
  };
  return {
    score: s, label: 'Faible',
    color: 'text-red-600 dark:text-red-400',
    bg:    'bg-red-50 dark:bg-red-950/20',
    bar:   'bg-red-400',
    border: 'border-red-200 dark:border-red-800/40',
  };
}

interface PlainteCardProps {
  plainte: Plainte;
}

const PlainteCard = memo(function PlainteCard({ plainte }: PlainteCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [upvotes,   setUpvotes]   = useState(plainte.upvotes   ?? 0);
  const [downvotes, setDownvotes] = useState(plainte.downvotes ?? 0);
  const [myVote,    setMyVote]    = useState<VoteType | null>(null);
  const [voting,    setVoting]    = useState(false);

  const timeAgo   = formatDistanceToNow(new Date(plainte.created_at), { addSuffix: true, locale: fr });
  const dateLabel = plainte.date_incident
    ? format(new Date(plainte.date_incident), 'd MMM yyyy', { locale: fr })
    : null;
  const force     = cardForceScore(plainte);
  const voteScore = upvotes - downvotes;

  const handleVote = useCallback(async (e: React.MouseEvent, type: VoteType) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Connectez-vous pour voter.', {
        action: { label: 'Se connecter', onClick: () => navigate('/connexion') },
      });
      return;
    }
    if (voting) return;
    setVoting(true);

    if (myVote === type) {
      // Annuler le vote
      setMyVote(null);
      if (type === 'pour')   setUpvotes((n)   => Math.max(0, n - 1));
      if (type === 'contre') setDownvotes((n) => Math.max(0, n - 1));
      try { await removeVote(plainte.id); }
      catch {
        setMyVote(type);
        if (type === 'pour') setUpvotes((n) => n + 1); else setDownvotes((n) => n + 1);
      }
    } else {
      const prev = myVote;
      setMyVote(type);
      if (type === 'pour') {
        setUpvotes((n) => n + 1);
        if (prev === 'contre') setDownvotes((n) => Math.max(0, n - 1));
      } else {
        setDownvotes((n) => n + 1);
        if (prev === 'pour') setUpvotes((n) => Math.max(0, n - 1));
      }
      try { await submitVote(plainte.id, type); }
      catch {
        setMyVote(prev);
        if (type === 'pour') {
          setUpvotes((n) => Math.max(0, n - 1));
          if (prev === 'contre') setDownvotes((n) => n + 1);
        } else {
          setDownvotes((n) => Math.max(0, n - 1));
          if (prev === 'pour') setUpvotes((n) => n + 1);
        }
        toast.error('Erreur lors du vote. Réessayez.');
      }
    }
    setVoting(false);
  }, [user, voting, myVote, plainte.id, navigate]);

  return (
    <Link
      to={`/plaintes/${plainte.id}`}
      className="group flex flex-col h-full bg-card border border-border rounded-2xl hover:border-foreground/20 hover:shadow-lg transition-all duration-200 overflow-hidden relative"
      aria-label={`Plainte contre ${plainte.game_server_name} — ${plainte.status}`}
    >
      {/* ── BARRE DE STATUT (Décorative en haut) ───────────────────── */}
      <div className={`h-1.5 w-full ${force.bg.replace('bg-', 'bg-').split(' ')[0]} ${force.bar}`} />

      {/* ── EN-TÊTE ─────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-3">

        {/* Badges statut + catégorie */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <StatusBadge status={plainte.status} />
          {plainte.categories && <CategoryBadge category={plainte.categories} />}
          {plainte.has_strong_evidence && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border bg-primary/8 text-primary border-primary/15 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Preuves
            </span>
          )}
        </div>

        {/* Serveur — titre principal de la carte */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50">
                <Server className="w-4 h-4 text-foreground/70" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-base md:text-lg text-foreground truncate leading-snug group-hover:text-primary transition-colors duration-150">
                {plainte.game_server_name}
              </h3>
            </div>
            {/* Admin mis en cause */}
            <div className="flex items-center gap-1.5 ml-10">
              <AlertCircle className="w-3.5 h-3.5 text-destructive/70 shrink-0" aria-hidden="true" />
              <p className="text-sm text-muted-foreground truncate">
                Admin visé : <span className="font-semibold text-foreground/90">{plainte.admin_name}</span>
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
            <ChevronRight
              className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* ── SÉPARATEUR ──────────────────────────────────── */}
      <div className="mx-5 h-px bg-border/40" />

      {/* ── CORPS ────────────────────────────────────────── */}
      <div className="px-5 py-4 flex-1 flex flex-col gap-4">

        {/* Raison (citée) */}
        {plainte.raison && (
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 relative">
            <p className="text-sm font-medium text-foreground line-clamp-2">
              &ldquo;{plainte.raison}&rdquo;
            </p>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1">
          {plainte.description}
        </p>

        {/* Score de force du dossier - Redesigné */}
        <div className={`rounded-xl p-3 border ${force.bg} ${force.border} flex flex-col gap-2 mt-auto`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${force.bar}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${force.color}`}>Dossier {force.label}</span>
            </div>
            <span className={`text-sm font-black tabular-nums ${force.color}`}>{force.score}/100</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${force.bar} shadow-sm`}
              style={{ width: `${force.score}%` }}
            />
          </div>
        </div>
        
        {/* Méta-données */}
        <div className="flex flex-wrap items-center justify-between gap-y-2 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40">
          <span className="flex items-center gap-1.5 shrink-0">
            {plainte.profiles?.avatar_url ? (
              <img src={plainte.profiles.avatar_url} alt="Avatar" className="w-5 h-5 rounded-full object-cover ring-2 ring-background shadow-sm" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center ring-2 ring-background shadow-sm">
                <User className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
              </div>
            )}
            <span className="font-medium text-foreground/80">
              {plainte.profiles?.username || 'Anonyme'}
            </span>
          </span>
          <span className="flex items-center gap-1 shrink-0 font-medium">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            {timeAgo}
          </span>
        </div>
      </div>

      {/* ── PIED — votes + commentaires ──────────────────── */}
      <div className="px-5 pb-4 pt-3 border-t border-border/80 flex items-center justify-between gap-3 bg-muted/10">

        {/* Votes */}
        <div className="flex items-center gap-1">
          {/* Upvote */}
          <button
            type="button"
            onClick={(e) => handleVote(e, 'pour')}
            disabled={voting}
            aria-label={`Soutenir (${upvotes})`}
            aria-pressed={myVote === 'pour'}
            className={[
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 shrink-0',
              myVote === 'pour'
                ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 ring-1 ring-green-300/60 dark:ring-green-800/60'
                : 'text-muted-foreground hover:bg-background hover:text-foreground',
              voting ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="tabular-nums">{upvotes}</span>
          </button>

          {/* Downvote */}
          <button
            type="button"
            onClick={(e) => handleVote(e, 'contre')}
            disabled={voting}
            aria-label={`S'opposer (${downvotes})`}
            aria-pressed={myVote === 'contre'}
            className={[
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 shrink-0',
              myVote === 'contre'
                ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400 ring-1 ring-red-300/60 dark:ring-red-800/60'
                : 'text-muted-foreground hover:bg-background hover:text-foreground',
              voting ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            <ThumbsDown className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="tabular-nums">{downvotes}</span>
          </button>

          {/* Score net */}
          <span className={[
            'text-xs font-bold tabular-nums px-1.5 py-1 rounded-md shrink-0 ml-0.5',
            voteScore > 0 ? 'text-green-600 dark:text-green-400'
              : voteScore < 0 ? 'text-red-600 dark:text-red-400'
              : 'text-muted-foreground',
          ].join(' ')}>
            {voteScore > 0 ? '+' : ''}{voteScore}
          </span>
        </div>

        {/* Commentaires */}
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 px-2 py-1.5">
          <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="tabular-nums">{plainte.comment_count ?? 0}</span>
          <span className="hidden sm:inline text-muted-foreground/60">
            cmt{(plainte.comment_count ?? 0) !== 1 ? 's' : ''}
          </span>
        </span>
      </div>
    </Link>
  );
});

export default PlainteCard;

import { useState, useEffect, useMemo, useRef } from 'react';
import PageMeta from '@/components/common/PageMeta';
import PageContainer from '@/components/layouts/PageContainer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  RefreshCcw, ShieldCheck, Zap, ThumbsUp,
  Megaphone, Wrench, Rocket, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { fetchNews, toggleNewsReaction } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { News } from '@/types/types';

// ── Types visuels par catégorie ───────────────────────────────────────────────
const TYPE_CONFIG: Record<string, {
  label: string;
  Icon: React.FC<{ className?: string }>;
  dot: string;
}> = {
  feature: {
    label: 'Nouveauté',
    Icon: Rocket,
    dot: 'bg-primary',
  },
  improvement: {
    label: 'Amélioration',
    Icon: RefreshCcw,
    dot: 'bg-sky-500',
  },
  fix: {
    label: 'Correctif',
    Icon: Wrench,
    dot: 'bg-amber-500',
  },
  news: {
    label: 'Annonce',
    Icon: Megaphone,
    dot: 'bg-violet-500',
  },
};

// ── Filtres disponibles ───────────────────────────────────────────────────────
type FilterKey = 'all' | 'feature' | 'improvement' | 'fix' | 'news';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',         label: 'Tout'         },
  { key: 'news',        label: 'Annonces'     },
  { key: 'feature',     label: 'Nouveautés'   },
  { key: 'improvement', label: 'Améliorations' },
  { key: 'fix',         label: 'Correctifs'   },
];

// ── Skeleton card ─────────────────────────────────────────────────────────────
function NewsCardSkeleton() {
  return (
    <div className="flex gap-4 md:gap-6 py-8 border-b border-border/40">
      <div className="flex flex-col items-center gap-2 shrink-0 pt-1">
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="w-px flex-1 min-h-[40px]" />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-6 w-3/4 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function ActualitesPage() {
  const { user } = useAuth();
  const [news, setNews]       = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const likingRef = useRef<Set<string>>(new Set());
  const [filter, setFilter]   = useState<FilterKey>('all');

  useEffect(() => { loadNews(); }, [user?.id]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const data = await fetchNews(user?.id);
      setNews(data);
    } catch {
      toast.error('Impossible de charger les actualités.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async (
    newsId: string,
    isLiked: boolean | undefined,
    count: number | undefined,
  ) => {
    if (!user) {
      toast.info('Connectez-vous pour réagir aux actualités.', {
        action: { label: 'Se connecter', onClick: () => { window.location.href = '/connexion'; } },
      });
      return;
    }
    // Anti-double-clic : ignorer si déjà en cours pour cet item
    if (likingRef.current.has(newsId)) return;
    likingRef.current.add(newsId);
    const liked = !!isLiked;
    const cur   = count ?? 0;
    // Optimistic update
    setNews(prev => prev.map(n =>
      n.id === newsId
        ? { ...n, user_liked: !liked, likes_count: liked ? Math.max(0, cur - 1) : cur + 1 }
        : n,
    ));
    try {
      await toggleNewsReaction(newsId, user.id, liked);
    } catch {
      toast.error('Erreur lors de l\'enregistrement.');
      await loadNews();
    } finally {
      likingRef.current.delete(newsId);
    }
  };

  // Filtrer
  const filtered = useMemo(() =>
    news.filter(n => filter === 'all' || n.type === filter),
    [news, filter],
  );

  // Grouper par mois/année
  const grouped = useMemo(() => {
    const map = new Map<string, News[]>();
    for (const item of filtered) {
      const key = format(new Date(item.created_at), 'MMMM yyyy', { locale: fr });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <>
      <PageMeta
        title="Actualités & Mises à jour — RPGuard"
        description="Suivez l'évolution de RPGuard : nouveautés, améliorations et correctifs depuis le lancement."
      />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-card">
        <PageContainer width="content">
          <div className="py-14 md:py-20">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Changelog
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold text-foreground tracking-tight text-balance mb-4 leading-[1.1]">
              Actualités &amp; Mises à jour
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl text-pretty">
              Toutes les évolutions de RPGuard depuis le lancement — fonctionnalités, améliorations et correctifs.
            </p>
          </div>
        </PageContainer>
      </section>

      {/* ── Filtres sticky ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <PageContainer width="content">
          <div className="py-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all
                  ${filter === key
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
              >
                {label}
              </button>
            ))}
            {/* compteur */}
            {!loading && (
              <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums pl-2">
                {filtered.length} entrée{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </PageContainer>
      </div>

      {/* ── Timeline ────────────────────────────────────────────────────── */}
      <PageContainer width="content">
        <div className="py-12 md:py-16">

          {loading ? (
            /* Skeleton */
            <div className="space-y-0">
              {Array.from({ length: 5 }).map((_, i) => <NewsCardSkeleton key={i} />)}
            </div>

          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-muted-foreground text-sm">Aucune entrée dans cette catégorie.</p>
            </div>

          ) : (
            grouped.map(([month, items]) => (
              <div key={month} className="mb-12">
                {/* ── Séparateur de mois ── */}
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap capitalize">
                    {month}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* ── Cartes du mois ── */}
                <div className="space-y-0">
                  {items.map((item, idx) => {
                    const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.news;
                    const Icon = cfg.Icon;
                    const isLast = idx === items.length - 1;

                    return (
                      <div key={item.id} className="flex gap-5 md:gap-7">

                        {/* Indicateur timeline */}
                        <div className="flex flex-col items-center shrink-0 pt-[5px]">
                          <div className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${cfg.dot}`} />
                          {!isLast && (
                            <div className="w-px flex-1 bg-border/60 mt-2 mb-0" />
                          )}
                        </div>

                        {/* Contenu */}
                        <article className={`flex-1 min-w-0 pb-10 ${isLast ? '' : ''}`}>

                          {/* En-tête */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {/* Badge type */}
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              <Icon className="w-3.5 h-3.5" />
                              {cfg.label}
                            </span>

                            {/* Version tag */}
                            {item.version && (
                              <span className="text-[11px] font-mono font-semibold text-muted-foreground/70
                                               bg-muted/50 px-2 py-0.5 rounded">
                                {item.version}
                              </span>
                            )}

                            <div className="flex-1" />

                            {/* Date */}
                            <time className="text-xs text-muted-foreground tabular-nums">
                              {format(new Date(item.created_at), 'd MMM yyyy', { locale: fr })}
                            </time>
                          </div>

                          {/* Titre */}
                          <h2 className="text-lg md:text-xl font-semibold text-foreground text-balance mb-3 leading-snug">
                            {item.title}
                          </h2>

                          {/* Corps */}
                          <div className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty
                                          whitespace-pre-wrap max-w-2xl">
                            {item.content.replace(/\\n/g, '\n')}
                          </div>

                          {/* Like */}
                          <div className="mt-5">
                            <button
                              onClick={() => handleToggleLike(item.id, item.user_liked, item.likes_count)}
                              className={`inline-flex items-center gap-1.5 text-xs font-medium
                                         px-3 py-1.5 rounded-full border transition-all
                                         ${item.user_liked
                                           ? 'bg-primary/8 text-primary border-primary/20 hover:bg-primary/15'
                                           : 'text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
                                         }`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 transition-transform ${item.user_liked ? 'scale-110' : ''}`} />
                              <span>{item.likes_count ?? 0}</span>
                            </button>
                          </div>
                        </article>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </PageContainer>
    </>
  );
}

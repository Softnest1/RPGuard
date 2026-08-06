import { useState, useEffect } from 'react';
import PageMeta from '@/components/common/PageMeta';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RefreshCcw, ShieldCheck, Zap, UserPlus, ThumbsUp, Megaphone, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { fetchNews, toggleNewsReaction } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { News } from '@/types/types';

export default function ActualitesPage() {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'news' | 'updates'>('all');

  useEffect(() => {
    loadNews();
  }, [user?.id]);

  const loadNews = async () => {
    try {
      const data = await fetchNews(user?.id);
      setUpdates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async (newsId: string, currentLikeState: boolean | undefined, currentLikesCount: number | undefined) => {
    if (!user) {
      toast.info("Vous devez être connecté pour réagir aux actualités.", {
        action: { label: "Se connecter", onClick: () => window.location.href = '/connexion' }
      });
      return;
    }

    const isCurrentlyLiked = !!currentLikeState;
    const currentCount = currentLikesCount || 0;

    // Optimistic UI update
    setUpdates(prev => prev.map(n => {
      if (n.id === newsId) {
        return {
          ...n,
          user_liked: !isCurrentlyLiked,
          likes_count: isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1
        };
      }
      return n;
    }));

    try {
      await toggleNewsReaction(newsId, user.id, isCurrentlyLiked);
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement de votre réaction.");
      // Rollback on error
      await loadNews();
    }
  };

  const filteredUpdates = updates.filter(update => {
    if (filter === 'all') return true;
    if (filter === 'news') return update.type === 'feature' || update.type === 'news';
    if (filter === 'updates') return update.type === 'improvement' || update.type === 'fix';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-24 min-h-screen">
      <PageMeta
        title="Actualités & Mises à jour — RPGuard"
        description="Suivez l'évolution de RPGuard. Découvrez nos dernières fonctionnalités, améliorations et correctifs."
      />

      {/* ── En-tête ─────────────────────────────────────────── */}
      <header className="mb-12">
        <h1 className="text-3xl md:text-5xl font-semibold text-foreground tracking-tight text-balance mb-4">
          Actualités & Mises à jour
        </h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl text-pretty">
          Découvrez en temps réel tout ce qui change sur RPGuard. Triez par catégorie pour séparer les annonces majeures des simples correctifs.
        </p>
      </header>

      {/* ── Filtres ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-12 pb-6 border-b border-border/50">
        <div className="flex items-center gap-2 mr-4 text-muted-foreground text-sm font-medium">
          <Filter className="w-4 h-4" /> Filtrer :
        </div>
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('all')}
          className="rounded-full"
        >
          Tout afficher
        </Button>
        <Button 
          variant={filter === 'news' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('news')}
          className="rounded-full"
        >
          Annonces & Nouveautés
        </Button>
        <Button 
          variant={filter === 'updates' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('updates')}
          className="rounded-full"
        >
          Correctifs & Améliorations
        </Button>
      </div>

      {/* ── Timeline ────────────────────────────────────────── */}
      <div className="space-y-8 pb-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 border border-border/50 rounded-2xl">
            <p className="text-muted-foreground">Aucune publication dans cette catégorie.</p>
          </div>
        ) : (
          filteredUpdates.map((update) => {
            // Déterminer l'icône et la couleur selon le type
            let Icon = Zap;
            let badgeColor = 'bg-primary/10 text-primary border-primary/20';
            let label = 'Nouveau';

            if (update.type === 'improvement') {
              Icon = RefreshCcw;
              badgeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
              label = 'Amélioration';
            } else if (update.type === 'feature') {
              Icon = UserPlus;
              badgeColor = 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-green-200 dark:border-green-900/50';
              label = 'Fonctionnalité';
            } else if (update.type === 'fix') {
              Icon = ShieldCheck;
              badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
              label = 'Correctif';
            } else if (update.type === 'news') {
              Icon = Megaphone;
              badgeColor = 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-900/50';
              label = 'Actualité communautaire';
            }

            return (
              <article key={update.id} className="relative bg-card border border-border/60 hover:border-border transition-colors rounded-2xl p-6 md:p-8 shadow-sm">
                
                {/* En-tête de la carte */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-2">
                    <Icon className="w-5 h-5 text-foreground/70" />
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                    {label}
                  </span>
                  {update.version && (
                    <span className="text-sm font-semibold text-foreground/80 bg-muted/50 px-2 py-0.5 rounded-md">
                      {update.version}
                    </span>
                  )}
                  <div className="flex-1" />
                  <time className="text-sm text-muted-foreground font-medium">
                    {format(new Date(update.created_at), 'dd MMM yyyy', { locale: fr })}
                  </time>
                </div>

                {/* Contenu */}
                <div className="pl-0 md:pl-14">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground text-balance mb-3">
                    {update.title}
                  </h2>

                  {/* Interprétation du contenu Markdown-like très basique ou rendu direct du texte avec sauts de ligne */}
                  <div className="text-base text-muted-foreground leading-relaxed text-pretty max-w-3xl whitespace-pre-wrap">
                    {update.content.replace(/\\n/g, '\n')}
                  </div>

                  {/* Actions / Réactions */}
                  <div className="mt-6 pt-4 border-t border-border/40 flex items-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleToggleLike(update.id, update.user_liked, update.likes_count)}
                      className={`h-9 px-4 rounded-full text-xs font-medium border transition-all ${
                        update.user_liked 
                          ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 shadow-sm' 
                          : 'bg-background text-muted-foreground border-border hover:bg-muted'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 mr-2 ${update.user_liked ? 'fill-current text-primary' : ''}`} />
                      {update.likes_count || 0} {update.likes_count && update.likes_count > 1 ? 'j\'aimes' : 'j\'aime'}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

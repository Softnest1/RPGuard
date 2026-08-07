import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PageMeta from '@/components/common/PageMeta';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, FilePlus, SlidersHorizontal, LogIn, Star, Trophy,
  Flame, Clock, TrendingUp, Gamepad2,
} from 'lucide-react';
import PlainteCard from '@/components/common/PlainteCard';
import { fetchPlaintes, fetchCategories } from '@/lib/api';
import { GAMES_RP } from '@/lib/games';
import type { Plainte, Category } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_TABS = [
  { value: 'all',          label: 'Toutes',       icon: null },
  { value: 'Viral',        label: 'Virales',      icon: Flame },
  { value: 'Validée',      label: 'Validées',     icon: Trophy },
  { value: 'En attente',   label: 'En attente',   icon: Clock },
  { value: 'En Médiation', label: 'En Médiation', icon: Clock },
  { value: 'Rejetée',      label: 'Rejetées',     icon: null },
] as const;

export default function PlaintesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [plaintes, setPlaintes]     = useState<Plainte[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);

  // Lire le statut initial depuis l'URL (ex: /plaintes?status=Validée)
  const [search,     setSearch]     = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [status,     setStatus]     = useState(() => searchParams.get('status') ?? 'all');
  const [gameType,   setGameType]   = useState(() => searchParams.get('game') ?? 'all');
  const [sortBy,     setSortBy]     = useState<'date' | 'votes'>('date');

  // Appliquer le filtre ?server= envoyé par ServeursPage au premier montage
  useEffect(() => {
    const serverParam = searchParams.get('server');
    if (serverParam) setSearch(serverParam);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('server');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasActiveFilter = search.trim() !== '' || categoryId !== 'all' || status !== 'all' || gameType !== 'all';

  // Synchroniser le statut avec l'URL quand il change
  const handleStatusChange = (val: string) => {
    setStatus(val);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val !== 'all') next.set('status', val); else next.delete('status');
      return next;
    }, { replace: true });
  };

  // Synchroniser le filtre jeu avec l'URL
  const handleGameTypeChange = (val: string) => {
    setGameType(val);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val !== 'all') next.set('game', val); else next.delete('game');
      return next;
    }, { replace: true });
  };

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh && plaintes.length === 0) setLoading(true);
    try {
      const data = await fetchPlaintes({
        search:     search.trim() || undefined,
        categoryId: categoryId !== 'all' ? categoryId : undefined,
        status:     status !== 'all' ? status : undefined,
        gameType:   gameType !== 'all' ? gameType : undefined,
        sortBy,
      });
      setPlaintes(data);
    } catch (err) {
      console.error('Erreur chargement plaintes:', err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, status, gameType, sortBy, plaintes.length]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(true), 350);
    return () => clearTimeout(t);
  }, [load]);

  const resetFilters = () => {
    setSearch('');
    setCategoryId('all');
    setStatus('all');
    setGameType('all');
    setSortBy('date');
    setSearchParams({}, { replace: true });
  };

  const activeStatusLabel = STATUS_TABS.find(t => t.value === status)?.label ?? 'cette catégorie';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <PageMeta
        title="Liste des Plaintes & Abus signalés — RPGuard"
        description="Parcourez, filtrez et votez pour les plaintes d'abus sur GTA RP / FiveM, GTA VI RP, ONESTATE RP et RedM. Filtrez par jeu, statut ou catégorie."
        keywords="plaintes serveurs RP, signalements abus GTA RP, liste plaintes FiveM, ONESTATE RP abus, RedM abus, preuves abus RP, dénoncer admin"
      />
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-semibold text-foreground mb-1">
            Toutes les plaintes
          </h1>
          <p className="text-muted-foreground text-sm">
            {loading
              ? 'Chargement…'
              : `${plaintes.length} plainte${plaintes.length !== 1 ? 's' : ''} trouvée${plaintes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {user ? (
          <Button asChild size="sm" className="shrink-0">
            <Link to="/soumettre">
              <FilePlus className="w-4 h-4 mr-1.5" />
              <span className="hidden md:inline">Déposer</span>
            </Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link to="/inscription">
              <LogIn className="w-4 h-4 mr-1.5" />
              <span className="hidden md:inline">Signaler</span>
            </Link>
          </Button>
        )}
      </div>

      {/* ── Bannière visiteur ────────────────────────────── */}
      {!user && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl border border-border bg-card">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0 mt-0.5">
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground leading-snug mb-0.5">
                Vous avez subi un abus ?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Lisez notre guide pour déposer un dossier solide — vidéo, pseudo exact, description précise.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link to="/guide">Guide stratégique</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/inscription">S'inscrire</Link>
            </Button>
          </div>
        </div>
      )}

      {/* ── Onglets de statut ────────────────────────────── */}
      <div
        className="flex items-center gap-1 mb-3 overflow-x-auto pb-1 scrollbar-none"
        role="tablist"
        aria-label="Filtrer par statut"
      >
        {STATUS_TABS.map(({ value, label, icon: Icon }) => {
          const isActive = status === value;
          return (
            <button
              key={value}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleStatusChange(value)}
              className={[
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors shrink-0',
                isActive
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              ].join(' ')}
            >
              {Icon && <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />}
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Filtre jeu RP ─────────────────────────────────── */}
      <div
        className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none"
        role="group"
        aria-label="Filtrer par jeu RP"
      >
        <Gamepad2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
        <button
          onClick={() => handleGameTypeChange('all')}
          className={[
            'inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors shrink-0 border',
            gameType === 'all'
              ? 'bg-foreground text-background border-foreground'
              : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30',
          ].join(' ')}
        >
          Tous les jeux
        </button>
        {GAMES_RP.map((g) => (
          <button
            key={g.id}
            onClick={() => handleGameTypeChange(g.id)}
            className={[
              'inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors shrink-0 border',
              gameType === g.id
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30',
            ].join(' ')}
          >
            {g.label}
            {g.status === 'émergent' && (
              <span className="ml-1.5 text-[10px] font-semibold text-purple-500">NEW</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Filtres avancés ──────────────────────────────── */}
      <div className="flex flex-col gap-2 mb-6">
        {/* Barre de recherche */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Serveur, admin, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full"
            aria-label="Rechercher une plainte"
          />
        </div>

        {/* Ligne catégorie + tri */}
        <div className="grid grid-cols-2 md:flex md:flex-row gap-2">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full md:w-44 min-w-0">
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'votes')}>
            <SelectTrigger className="w-full md:w-40 min-w-0">
              <TrendingUp className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Tri" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Plus récentes</SelectItem>
              <SelectItem value="votes">Plus votées</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Réinitialiser */}
        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-xs shrink-0 px-3 self-start md:self-auto h-9"
          >
            Réinitialiser
          </Button>
        )}
      </div>

      {/* ── Résultats ───────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-3 md:gap-4 2xl:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
              <div className="p-4 pb-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="px-4 pb-3 space-y-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-5/6" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
              <div className="px-4 py-3 border-t border-border flex items-center gap-3">
                <div className="h-3 bg-muted rounded w-14" />
                <div className="h-3 bg-muted rounded w-14" />
                <div className="ml-auto h-5 bg-muted rounded-full w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : plaintes.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-lg px-4 bg-muted/30">
          <p className="text-foreground font-medium mb-2">
            {hasActiveFilter ? 'Aucun résultat' : 'C\'est très calme ici...'}
          </p>
          <p className="text-muted-foreground text-sm mb-5">
            {hasActiveFilter
              ? `Aucune plainte "${activeStatusLabel}" ne correspond à vos critères.`
              : 'Aucune plainte pour le moment. Soyez le premier à signaler un serveur abusif.'}
          </p>
          {hasActiveFilter ? (
            <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-full">
              Réinitialiser les filtres
            </Button>
          ) : user ? (
            <Button asChild size="sm" className="rounded-full shadow-sm">
              <Link to="/soumettre">Rédiger une plainte</Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="rounded-full shadow-sm">
              <Link to="/inscription">Rejoindre pour signaler</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-3 md:gap-4 2xl:gap-6">
          {plaintes.map((p) => (
            <PlainteCard key={p.id} plainte={p} />
          ))}
        </div>
      )}
    </div>
  );
}

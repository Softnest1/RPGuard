import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchServerScores, type ServerScore } from '@/lib/api';
import {
  Server, ShieldCheck, ArrowRight, Flame,
  AlertTriangle, ChevronRight, RefreshCw, Search,
  TrendingUp, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageMeta from '@/components/common/PageMeta';
import { Input } from '@/components/ui/input';

// ── Helpers score ───────────────────────────────────────────────────────────
function scoreLabel(score: number): {
  label: string; color: string; bg: string; bar: string; border: string;
} {
  if (score >= 80) return { label: 'Sain',      color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-950/30',   bar: 'bg-green-500',  border: 'border-green-200 dark:border-green-800/40' };
  if (score >= 60) return { label: 'Correct',   color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/30',   bar: 'bg-amber-400',  border: 'border-amber-200 dark:border-amber-800/40' };
  if (score >= 40) return { label: 'Risqué',    color: 'text-orange-600 dark:text-orange-400',bg: 'bg-orange-50 dark:bg-orange-950/20', bar: 'bg-orange-400', border: 'border-orange-200 dark:border-orange-800/40' };
  return              { label: 'Dangereux', color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-950/20',      bar: 'bg-red-500',    border: 'border-red-200 dark:border-red-800/40' };
}

function ScoreBar({ score }: { score: number }) {
  const { bar } = scoreLabel(score);
  return (
    <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 shadow-sm ${bar}`}
        style={{ width: `${Math.min(score, 100)}%` }}
      />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ServeursPage() {
  const [servers, setServers] = useState<ServerScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setLoading(true);
    try {
      const data = await fetchServerScores();
      setServers(data);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(true); }, [load]);

  const filtered = servers.filter(s =>
    s.server_name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:        servers.length,
    danger:       servers.filter(s => s.score < 40).length,
    sains:        servers.filter(s => s.score >= 80).length,
    viralTotal:   servers.reduce((acc, s) => acc + s.plaintes_viral, 0),
  };

  return (
    <div className="w-full">
      <PageMeta
        title="Classement & Trust Score des serveurs RP — RPGuard"
        description="Découvrez le Trust Score en temps réel des serveurs GTA RP, FiveM et RedM. Choisissez votre prochain serveur en évitant les abus et la toxicité grâce au classement communautaire."
        keywords="classement serveurs RP, trust score RP, meilleur serveur GTA RP, serveurs FiveM à éviter, avis serveurs RedM, statistiques RP"
      />

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-16">

          {/* Titre */}
          <div className="mb-6 md:mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/8 rounded-full px-3 py-1 mb-4">
              <BarChart3 className="w-3 h-3 shrink-0" />
              Données en temps réel
            </div>
            <h1 className="text-2xl md:text-4xl font-semibold text-foreground mb-3 text-balance">
              Classement des serveurs&nbsp;RP
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
              Score calculé à partir des plaintes déposées. Plus le score est bas, plus le serveur est signalé par la communauté.
            </p>
          </div>

          {/* Stats en 4 tuiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Server,        value: stats.total,      label: 'Serveurs suivis',     accent: false },
              { icon: AlertTriangle, value: stats.danger,     label: 'Dangereux (< 40)',     accent: true  },
              { icon: ShieldCheck,   value: stats.sains,      label: 'Sains (≥ 80)',         accent: false },
              { icon: Flame,         value: stats.viralTotal, label: 'Plaintes virales',     accent: false },
            ].map(({ icon: Icon, value, label, accent }) => (
              <div key={label} className={`flex items-center gap-3 p-4 rounded-xl border ${accent ? 'border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/10' : 'border-border bg-background'}`}>
                <Icon className={`w-4 h-4 shrink-0 ${accent ? 'text-red-500' : 'text-muted-foreground'}`} aria-hidden="true" />
                <div className="min-w-0">
                  <p className={`text-xl font-bold tabular-nums ${accent ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>{value}</p>
                  <p className="text-xs text-muted-foreground truncate">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTENU ────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-10">

        {/* Barre de recherche + refresh */}
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              placeholder="Rechercher un serveur…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Rechercher un serveur"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Effacer la recherche"
              >
                <TrendingUp className="w-3.5 h-3.5 opacity-0" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => load(true)}
            disabled={loading}
            aria-label="Actualiser le classement"
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* ── LISTE ────────────────────────────────────── */}
        {loading ? (
          <div className="border border-border rounded-2xl bg-card overflow-hidden divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-6 h-4 bg-muted rounded shrink-0" />
                <div className="w-9 h-9 bg-muted rounded-xl shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="h-4 bg-muted rounded w-2/5" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
                <div className="hidden md:flex gap-6 shrink-0">
                  <div className="h-3 bg-muted rounded w-16" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
                <div className="h-6 bg-muted rounded-full w-20 shrink-0" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border rounded-2xl px-4">
            <Server className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground mb-1">
              {search ? 'Aucun serveur trouvé' : 'Aucun serveur enregistré'}
            </p>
            <p className="text-xs text-muted-foreground">
              {search
                ? 'Essayez un autre terme de recherche.'
                : 'Les serveurs apparaissent dès la première plainte déposée.'}
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-2xl bg-card overflow-hidden">
            {filtered.map((srv, idx) => {
              const { label, color, bg, border } = scoreLabel(srv.score);
              const isLast = idx === filtered.length - 1;
              return (
                <div
                  key={srv.id}
                  className={`flex items-center gap-3 md:gap-5 px-4 py-5 md:py-6 ${!isLast ? 'border-b border-border/60' : ''} hover:bg-muted/10 transition-colors group`}
                >
                  {/* Rang */}
                  <span className="text-sm font-black text-muted-foreground w-6 shrink-0 tabular-nums text-right select-none">
                    #{idx + 1}
                  </span>

                  {/* Nom + barre */}
                  <div className="flex-1 min-w-0 ml-1 md:ml-3">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50">
                        <Server className="w-4 h-4 text-foreground/70" aria-hidden="true" />
                      </div>
                      <p className="text-lg md:text-xl font-bold text-foreground truncate">{srv.server_name}</p>
                      {srv.plaintes_viral > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-red-600 bg-red-50 dark:bg-red-950/30 rounded-md px-2 py-0.5 shrink-0 border border-red-200 dark:border-red-800/40 shadow-sm">
                          <Flame className="w-3 h-3" aria-hidden="true" />
                          Tendance
                        </span>
                      )}
                    </div>
                    <ScoreBar score={srv.score} />
                    <div className="flex items-center flex-wrap gap-2 mt-3">
                      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap bg-muted/30 px-2 py-1 rounded">
                        {srv.total_plaintes} plaintes signalées
                      </span>
                      {srv.plaintes_valides > 0 && (
                        <span className="text-xs font-semibold text-green-700 dark:text-green-400 whitespace-nowrap bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 px-2 py-1 rounded">
                          {srv.plaintes_valides} vérifiées
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score + badge */}
                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    <div className="text-right flex flex-col justify-center items-end mr-2">
                      <p className={`text-2xl sm:text-3xl font-black tabular-nums leading-none tracking-tight ${color}`}>{srv.score}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">Trust Score</p>
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-widest px-4 h-9 items-center justify-center rounded-lg border hidden md:flex ${bg} ${color} ${border}`}>
                      {label}
                    </span>
                    <Button asChild variant="ghost" size="icon" className="w-10 h-10 rounded-full opacity-60 hover:opacity-100 transition-opacity bg-muted/40 hover:bg-muted shrink-0 shadow-sm">
                      <Link to={`/plaintes?server=${encodeURIComponent(srv.server_name)}`} aria-label={`Voir les plaintes pour ${srv.server_name}`}>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CTA BAS ───────────────────────────────────── */}
        <div className="mt-10 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground mb-1">Votre serveur est absent ?</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Il apparaîtra automatiquement dès que la première plainte sera déposée.
            </p>
          </div>
          <Button asChild className="rounded-full px-5 shrink-0 gap-2">
            <Link to="/soumettre">
              Déposer une plainte
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

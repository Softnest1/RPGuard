import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchServerScores, type ServerScore } from '@/lib/api';
import {
  Server, ShieldCheck, ArrowRight, Flame,
  AlertTriangle, RefreshCw, Search,
  TrendingUp, BarChart3, Clock,
  UserX, ShieldAlert, CheckCircle2, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageMeta from '@/components/common/PageMeta';
import { Input } from '@/components/ui/input';
import GameBadge from '@/components/common/GameBadge';
import { slugify } from '@/lib/slugify';

// ── Helpers score ───────────────────────────────────────────────────────────
function scoreLabel(score: number): {
  label: string; color: string; bg: string; bar: string; border: string; dot: string;
} {
  if (score >= 80) return { label: 'Sain',      color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-950/30',   bar: 'bg-green-500',  border: 'border-green-200 dark:border-green-800/40',  dot: 'bg-green-500'  };
  if (score >= 60) return { label: 'Correct',   color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/30',   bar: 'bg-amber-400',  border: 'border-amber-200 dark:border-amber-800/40',  dot: 'bg-amber-400'  };
  if (score >= 40) return { label: 'Risqué',    color: 'text-orange-600 dark:text-orange-400',bg: 'bg-orange-50 dark:bg-orange-950/20', bar: 'bg-orange-400', border: 'border-orange-200 dark:border-orange-800/40', dot: 'bg-orange-400' };
  return              { label: 'Dangereux', color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-950/20',      bar: 'bg-red-500',    border: 'border-red-200 dark:border-red-800/40',      dot: 'bg-red-500'    };
}

function ScoreBar({ score }: { score: number }) {
  const { bar } = scoreLabel(score);
  return (
    <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${bar}`}
        style={{ width: `${Math.min(score, 100)}%` }}
      />
    </div>
  );
}

// Formatage date relative
function relativeDate(isoDate: string | null): string {
  if (!isoDate) return '';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 60)  return `il y a ${mins} min`;
  if (hours < 24)  return `il y a ${hours}h`;
  if (days  < 30)  return `il y a ${days}j`;
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ServeursPage() {
  const [servers, setServers]   = useState<ServerScore[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await fetchServerScores(forceRefresh);
      setServers(data);
    } catch { /* silencieux */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(false); }, [load]);

  const filtered = servers.filter(s =>
    s.server_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.game_type ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:      servers.length,
    danger:     servers.filter(s => s.score < 40).length,
    sains:      servers.filter(s => s.score >= 80).length,
    viralTotal: servers.reduce((acc, s) => acc + s.plaintes_viral, 0),
  };

  return (
    <div className="w-full">
      <PageMeta
        title="Classement & Trust Score des serveurs RP — RPGuard"
        description="Découvrez le Trust Score en temps réel des serveurs GTA RP / FiveM, GTA VI RP, ONESTATE RP et RedM. Choisissez votre prochain serveur en évitant les abus grâce au classement communautaire."
        keywords="classement serveurs RP, trust score RP, meilleur serveur GTA RP, meilleur serveur ONESTATE RP, serveurs FiveM à éviter, serveurs RedM, GTA VI RP, statistiques RP"
      />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-16">
          <div className="mb-6 md:mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/8 rounded-full px-3 py-1 mb-4">
              <BarChart3 className="w-3 h-3 shrink-0" />
              Données en temps réel
            </div>
            <h1 className="text-2xl md:text-4xl font-semibold text-foreground mb-3 text-balance">
              Classement des serveurs&nbsp;RP
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
              Score calculé à partir des plaintes déposées. Plus le score est bas, plus le serveur est signalé par la communauté. Consultez le jeu, les admins signalés et la dernière activité.
            </p>
          </div>

          {/* 4 tuiles KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Server,        value: stats.total,      label: 'Serveurs suivis',   accent: false },
              { icon: AlertTriangle, value: stats.danger,     label: 'Dangereux (< 40)',   accent: true  },
              { icon: ShieldCheck,   value: stats.sains,      label: 'Sains (≥ 80)',       accent: false },
              { icon: Flame,         value: stats.viralTotal, label: 'Plaintes virales',   accent: false },
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

      {/* ── CONTENU ───────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-10">

        {/* Barre recherche + refresh */}
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              placeholder="Rechercher un serveur ou un jeu…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Rechercher un serveur"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
            disabled={loading || refreshing}
            aria-label="Actualiser le classement"
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* ── LÉGENDE score ──────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-6 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Score Trust :</span>
          {([
            { label: 'Sain ≥80',     dot: 'bg-green-500'  },
            { label: 'Correct 60–79', dot: 'bg-amber-400'  },
            { label: 'Risqué 40–59', dot: 'bg-orange-400' },
            { label: 'Dangereux <40', dot: 'bg-red-500'    },
          ] as const).map(({ label, dot }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
              {label}
            </span>
          ))}
        </div>

        {/* ── LISTE ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="border border-border rounded-2xl bg-card overflow-hidden divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-5 animate-pulse">
                <div className="w-6 h-4 bg-muted rounded shrink-0 mt-1" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex gap-2">
                    <div className="h-4 bg-muted rounded w-2/5" />
                    <div className="h-4 bg-muted rounded w-16" />
                  </div>
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-1.5 bg-muted rounded-full w-full" />
                  <div className="flex gap-3">
                    <div className="h-3 bg-muted rounded w-20" />
                    <div className="h-3 bg-muted rounded w-20" />
                  </div>
                </div>
                <div className="shrink-0 space-y-1 text-right">
                  <div className="h-8 bg-muted rounded w-14" />
                  <div className="h-3 bg-muted rounded w-14" />
                </div>
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
                ? 'Essayez un autre nom ou type de jeu.'
                : 'Les serveurs apparaissent dès la première plainte déposée.'}
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-2xl bg-card overflow-hidden">
            {filtered.map((srv, idx) => {
              const { label, color, bg, border, dot } = scoreLabel(srv.score);
              const isLast = idx === filtered.length - 1;
              return (
                <div
                  key={srv.id}
                  className={`flex items-start gap-3 md:gap-5 px-4 py-5 md:py-6 ${!isLast ? 'border-b border-border/60' : ''} hover:bg-muted/10 transition-colors group`}
                >
                  {/* Rang */}
                  <span className="text-sm font-black text-muted-foreground w-6 shrink-0 tabular-nums text-right select-none pt-1">
                    #{idx + 1}
                  </span>

                  {/* Contenu principal */}
                  <div className="flex-1 min-w-0 ml-1 md:ml-2">

                    {/* Ligne 1 : nom + badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {/* Dot couleur score */}
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
                      <p className="text-base md:text-lg font-bold text-foreground truncate">
                        {srv.server_name}
                      </p>
                      {/* Badge jeu */}
                      <GameBadge gameType={srv.game_type} />
                      {/* Badge viral */}
                      {srv.plaintes_viral > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-red-600 bg-red-50 dark:bg-red-950/30 rounded px-2 py-0.5 shrink-0 border border-red-200 dark:border-red-800/40">
                          <Flame className="w-2.5 h-2.5" aria-hidden="true" />
                          Tendance
                        </span>
                      )}
                    </div>

                    {/* Barre de score */}
                    <ScoreBar score={srv.score} />

                    {/* Ligne 3 : métriques détaillées */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-muted-foreground">
                      {/* Total plaintes */}
                      <span className="flex items-center gap-1 font-medium">
                        <ShieldAlert className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span className="text-foreground font-semibold tabular-nums">{srv.total_plaintes}</span> plainte{srv.total_plaintes !== 1 ? 's' : ''}
                      </span>
                      {/* Validées */}
                      {srv.plaintes_valides > 0 && (
                        <span className="flex items-center gap-1 text-green-700 dark:text-green-400 font-medium">
                          <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span className="tabular-nums">{srv.plaintes_valides}</span> validée{srv.plaintes_valides !== 1 ? 's' : ''}
                        </span>
                      )}
                      {/* En attente */}
                      {srv.plaintes_en_attente > 0 && (
                        <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                          <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span className="tabular-nums">{srv.plaintes_en_attente}</span> en attente
                        </span>
                      )}
                      {/* Rejetées */}
                      {srv.plaintes_rejetees > 0 && (
                        <span className="flex items-center gap-1 font-medium">
                          <XCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span className="tabular-nums">{srv.plaintes_rejetees}</span> rejetée{srv.plaintes_rejetees !== 1 ? 's' : ''}
                        </span>
                      )}
                      {/* Admin le plus signalé */}
                      {srv.top_admin_name && (
                        <span className="flex items-center gap-1 font-medium">
                          <UserX className="w-3 h-3 shrink-0" aria-hidden="true" />
                          Admin signalé&nbsp;: <span className="text-foreground font-semibold">{srv.top_admin_name}</span>
                        </span>
                      )}
                      {/* Dernière plainte */}
                      {srv.last_plainte_at && (
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
                          Dernière activité&nbsp;: {relativeDate(srv.last_plainte_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score + badge + CTA */}
                  <div className="flex items-center gap-3 shrink-0 pl-2">
                    <div className="text-right">
                      <p className={`text-2xl sm:text-3xl font-black tabular-nums leading-none tracking-tight ${color}`}>
                        {srv.score}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        Trust Score
                      </p>
                      <span className={`hidden md:inline-flex mt-2 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-md border items-center justify-center ${bg} ${color} ${border}`}>
                        {label}
                      </span>
                    </div>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="w-9 h-9 rounded-full bg-muted/40 hover:bg-muted opacity-60 hover:opacity-100 transition-all shrink-0"
                    >
                      <Link
                        to={`/serveurs/${slugify(srv.server_name)}`}
                        aria-label={`Voir la fiche de ${srv.server_name}`}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CTA BAS ──────────────────────────────────────────────── */}
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


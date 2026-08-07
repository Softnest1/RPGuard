import { useEffect, useState, useCallback } from 'react';
import PageMeta from '@/components/common/PageMeta';
import { BarChart3, AlertTriangle, Shield, Users, Server, Trophy, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '@/db/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RealStats {
  total:       number;
  won:         number;
  en_attente:  number;
  rejetees:    number;
  viral:       number;
  users:       number;
  servers:     number;
  today:       number;
}

interface CategoryStat {
  name:  string;
  count: number;
}

// Intervalle de rafraîchissement automatique (60 secondes)
const REFRESH_INTERVAL_MS = 60_000;

// ── Composant KPI card ────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon: Icon, sub, accent = false,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="p-6 bg-card border border-border rounded-2xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
        <Icon className={`w-4 h-4 shrink-0 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground leading-relaxed">{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StatistiquesPage() {
  const [stats, setStats]         = useState<RealStats | null>(null);
  const [catStats, setCatStats]   = useState<CategoryStat[]>([]);
  const [loading, setLoading]     = useState(true);
  const [lastSync, setLastSync]   = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      // ── 1. Stats globales via RPC SECURITY DEFINER (1 seul appel) ──
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_full_stats');
      if (!rpcErr && rpcData) {
        const s = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
        setStats({
          total:      Number(s.total)      || 0,
          won:        Number(s.won)         || 0,
          en_attente: Number(s.en_attente)  || 0,
          rejetees:   Number(s.rejetees)    || 0,
          viral:      Number(s.viral)       || 0,
          users:      Number(s.users)       || 0,
          servers:    Number(s.servers)     || 0,
          today:      Number(s.today)       || 0,
        });
      }

      // ── 2. Distribution catégories via RPC SQL GROUP BY (agrégation pure) ──
      const { data: cats, error: catsErr } = await supabase.rpc('get_category_stats');
      if (!catsErr && cats) {
        const parsed: { name: string; count: number }[] =
          typeof cats === 'string' ? JSON.parse(cats) : cats;
        setCatStats(
          parsed.map(r => ({ name: r.name, count: Number(r.count) || 0 }))
        );
      }

      setLastSync(new Date());
    } catch (err) {
      console.error('[StatistiquesPage] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    // Auto-refresh silencieux toutes les 60 secondes
    const interval = setInterval(() => load(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const resolutionRate = stats && stats.total > 0
    ? Math.round((stats.won / stats.total) * 100)
    : 0;

  const maxCat = catStats[0]?.count ?? 1;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
      <PageMeta
        title="Statistiques de Transparence RPGuard — Abus et Signalements RP"
        description="Consultez les statistiques publiques de RPGuard sur les abus d'administrateurs dans les serveurs GTA RP, ONESTATE RP, GTA VI RP et RedM. Transparence totale sur les signalements et taux de résolution."
        keywords="statistiques abus RP, transparence serveurs RP, plaintes GTA RP, plaintes ONESTATE RP, plaintes RedM, RPGuard stats"
      />

      {/* En-tête */}
      <div className="flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6 ring-1 ring-primary/20">
          <BarChart3 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight text-balance">
          Transparence & Données
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto text-pretty">
          Parce que la justice exige de la transparence, RPGuard rend publiques les tendances d'abus sur la scène RP en temps réel.
        </p>
      </div>

      {/* KPIs en temps réel */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <KpiCard
            label="Plaintes déposées"
            value={stats?.total ?? 0}
            icon={AlertTriangle}
            sub="Total depuis le lancement"
          />
          <KpiCard
            label="Dossiers validés"
            value={stats?.won ?? 0}
            icon={Trophy}
            sub={stats && stats.total > 0 ? `${resolutionRate}% de taux de résolution` : 'Aucune plainte encore'}
            accent
          />
          <KpiCard
            label="En attente de traitement"
            value={stats?.en_attente ?? 0}
            icon={FileText}
            sub="Dossiers soumis à validation"
          />
          <KpiCard
            label="Plaintes virales"
            value={stats?.viral ?? 0}
            icon={BarChart3}
            sub="Fort soutien communautaire"
          />
          <KpiCard
            label="Membres inscrits"
            value={stats?.users ?? 0}
            icon={Users}
            sub="Comptes actifs"
          />
          <KpiCard
            label="Serveurs suivis"
            value={stats?.servers ?? 0}
            icon={Server}
            sub="Serveurs RP signalés"
          />
          <KpiCard
            label="Signalements aujourd'hui"
            value={stats?.today ?? 0}
            icon={AlertTriangle}
            sub="Dépôts dans les dernières 24h"
          />
          <KpiCard
            label="Dossiers rejetés"
            value={stats?.rejetees ?? 0}
            icon={Shield}
            sub="Preuves insuffisantes"
          />
        </div>
      )}

      {/* Répartition par catégorie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 md:p-8 bg-card border border-border rounded-2xl">
          <h3 className="text-base font-semibold text-foreground mb-6">
            Répartition des signalements par type d'abus
          </h3>
          {loading ? (
            <div className="flex flex-col gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                  <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : catStats.length > 0 ? (
            <div className="flex flex-col gap-5">
              {catStats.map(({ name, count }) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-foreground truncate pr-4">{name}</span>
                    <span className="text-muted-foreground shrink-0 tabular-nums">
                      {count} {count === 1 ? 'cas' : 'cas'}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.round((count / maxCat) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <BarChart3 className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Aucune donnée disponible pour le moment.
              </p>
              <p className="text-xs text-muted-foreground">
                Les statistiques apparaîtront dès les premiers signalements déposés.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 bg-card border border-border rounded-2xl flex flex-col justify-between gap-6">
          <div>
            <h3 className="text-base font-semibold text-foreground mb-3">Pourquoi ces données ?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              RPGuard n'a pas vocation à détruire les serveurs, mais à assainir l'écosystème. En exposant les comportements les plus récurrents, nous aidons les fondateurs à identifier les failles dans le recrutement de leur staff.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ces statistiques sont calculées en <span className="text-foreground font-medium">temps réel</span> directement depuis notre base de données, de manière totalement anonymisée.
            </p>
          </div>

          {/* Indicateur de fraîcheur + bouton refresh manuel */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 animate-pulse" />
              <p className="text-xs text-muted-foreground truncate">
                {lastSync
                  ? `Mis à jour : ${lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · rafraîchi toutes les 60s`
                  : 'Synchronisation en cours…'}
              </p>
            </div>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              aria-label="Rafraîchir les statistiques"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Rafraîchir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

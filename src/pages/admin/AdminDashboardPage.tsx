import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Users, Flame, Clock,
  TrendingUp, ArrowRight, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';
import { fetchAdminStats, fetchAdminPlaintes } from '@/lib/api';
import type { Plainte } from '@/types/types';

interface DashStats {
  plaintes: number;
  enAttente: number;
  validees: number;
  rejetees: number;
  viral: number;
  users: number;
  today: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats]         = useState<DashStats | null>(null);
  const [recent, setRecent]       = useState<Plainte[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, recentData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminPlaintes({ lim: 6 }),
      ]);
      setStats(s);
      setRecent(recentData as unknown as Plainte[]);
      setLoading(false);
    };
    load();
  }, []);

  const STATUS_STYLE: Record<string, string> = {
    'En attente': 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    'Validée':    'bg-green-500/10 text-green-700 dark:text-green-400',
    'Rejetée':    'bg-destructive/10 text-destructive',
    'Viral':      'bg-primary/10 text-primary',
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 animate-pulse">
        {/* Cartes stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-3 bg-muted rounded w-24" />
                <div className="w-8 h-8 bg-muted rounded-lg" />
              </div>
              <div className="h-7 bg-muted rounded w-16" />
              <div className="h-3 bg-muted rounded w-20" />
            </div>
          ))}
        </div>
        {/* Liste récente */}
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          <div className="px-5 py-4">
            <div className="h-5 bg-muted rounded w-40" />
          </div>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-3">
              <div className="w-8 h-8 bg-muted rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-4 bg-muted rounded w-2/5" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
              <div className="h-5 bg-muted rounded-full w-20 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const CARDS = [
    { label: 'Plaintes totales',  value: stats!.plaintes,        icon: FileText,    sub: `+${stats!.today} aujourd'hui` },
    { label: 'Membres',           value: stats!.users,           icon: Users,       sub: 'Comptes actifs' },
    { label: 'Plaintes Viral',    value: stats!.viral,           icon: Flame,       sub: 'Très commentées' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Titre */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de la plateforme RPGuard</p>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {CARDS.map(({ label, value, icon: Icon, sub, alert }: any) => (
          <div key={label} className={`p-5 rounded-xl border bg-card flex flex-col gap-3 ${alert ? 'border-primary/40' : 'border-border'}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${alert ? 'bg-primary/10' : 'bg-muted'}`}>
                <Icon className={`w-4 h-4 ${alert ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
            <p className={`text-xs ${alert ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Statuts plaintes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-xl border border-border bg-card flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground tabular-nums">{stats!.enAttente}</p>
            <p className="text-xs text-muted-foreground">En attente de modération</p>
          </div>
          <Link to="/admin/plaintes?status=En+attente" className="ml-auto text-xs text-primary hover:underline flex items-center gap-0.5">
            Voir <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="p-5 rounded-xl border border-border bg-card flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground tabular-nums">{stats!.validees}</p>
            <p className="text-xs text-muted-foreground">Validées</p>
          </div>
        </div>
        <div className="p-5 rounded-xl border border-border bg-card flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <XCircle className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground tabular-nums">{stats!.rejetees}</p>
            <p className="text-xs text-muted-foreground">Rejetées</p>
          </div>
        </div>
      </div>

      {/* Plaintes récentes */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Plaintes récentes</h2>
          </div>
          <Link to="/admin/plaintes" className="text-xs text-primary hover:underline flex items-center gap-0.5">
            Tout voir <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Serveur</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Accusé</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Statut</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Date</th>
                <th className="px-5 py-3 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    Aucune plainte
                  </td>
                </tr>
              ) : recent.map(p => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground whitespace-nowrap max-w-[160px] truncate">{p.game_server_name}</td>
                  <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{p.admin_name}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[p.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground whitespace-nowrap text-xs">
                    {new Date(p.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <Link to={`/admin/plaintes?id=${p.id}`} className="text-xs text-primary hover:underline">
                      Gérer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

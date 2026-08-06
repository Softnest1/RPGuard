import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PageMeta from '@/components/common/PageMeta';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  FilePlus, ExternalLink, BarChart2, LayoutDashboard,
  User, Shield, ChevronRight, Check, X, Eye, EyeOff,
  Trash2, KeyRound, Pencil, AlertTriangle, LogOut,
  Camera, UserX, ImagePlus, Loader2, ChevronLeft, ChevronsLeft, ChevronsRight,
  SortDesc, SortAsc, Filter,
} from 'lucide-react';
import PlainteCard from '@/components/common/PlainteCard';
import PlainteRecap from '@/components/common/PlainteRecap';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchMyPlaintes, updateProfile, deletePlainte, fetchProfile, uploadAvatar,
} from '@/lib/api';
import type { Plainte, PlainteStatus, Profile } from '@/types/types';
import { toast } from 'sonner';
import { SECRET_QUESTIONS } from './InscriptionPage';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getPasswordStrength } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = 'plaintes' | 'profil' | 'securite';

const STATUS_ORDER: PlainteStatus[] = ['En attente', 'Validée', 'Rejetée', 'Viral'];

// ── Composant principal ────────────────────────────────────────────────────

export default function TableauDeBordPage() {
  const { user, profile: authProfile, signOut, refreshProfile, reauthAndUpdatePassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get('tab') as Tab) ?? 'plaintes';
  const setTab = (tab: Tab) => setSearchParams({ tab });

  const [plaintes, setPlaintes] = useState<Plainte[]>([]);
  const [loadingPlaintes, setLoadingPlaintes] = useState(true);
  const [fullProfile, setFullProfile] = useState<Profile | null>(null);

  // Charger données — user est garanti non-null (RequireAuth dans App.tsx)
  const loadData = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (!isRefresh || plaintes.length === 0) setLoadingPlaintes(true);
    
    const [p, fp] = await Promise.all([
      fetchMyPlaintes(user.id).catch(() => [] as Plainte[]),
      fetchProfile(user.id).catch(() => null),
    ]);
    setPlaintes(p);
    setFullProfile(fp);
    setLoadingPlaintes(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistiques
  const total = plaintes.length;
  const byStatus = STATUS_ORDER.reduce<Record<PlainteStatus, number>>(
    (acc, s) => { acc[s] = plaintes.filter((p) => p.status === s).length; return acc; },
    { 'En attente': 0, 'Validée': 0, 'Rejetée': 0, 'Viral': 0, 'Résolue': 0, 'Perdue': 0, 'En Médiation': 0 }
  );
  const totalVotes = plaintes.reduce((sum, p) => sum + (p.vote_count ?? 0), 0);

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'plaintes', label: 'Mes plaintes', icon: LayoutDashboard },
    { id: 'profil', label: 'Mon profil', icon: User },
    { id: 'securite', label: 'Sécurité', icon: Shield },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
      <PageMeta
        title="Tableau de bord — RPGuard"
        description="Gérez vos plaintes, consultez vos statistiques et modifiez votre profil sur RPGuard."
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {/* Avatar — photo ou initiale */}
          {(fullProfile ?? authProfile)?.avatar_url ? (
            <img
              src={(fullProfile ?? authProfile)!.avatar_url!}
              alt="Avatar"
              className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-border"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary uppercase shrink-0">
              {((fullProfile ?? authProfile)?.username ?? 'U').charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground">
              {(fullProfile ?? authProfile)?.username ?? '…'}
            </h1>
            {(fullProfile ?? authProfile)?.pseudo_rp && (
              <p className="text-xs text-primary font-medium">
                🎭 {(fullProfile ?? authProfile)!.pseudo_rp}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Membre depuis {(fullProfile ?? authProfile)?.created_at
                ? formatDistanceToNow(new Date((fullProfile ?? authProfile)!.created_at), { addSuffix: true, locale: fr })
                : '…'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/soumettre">
              <FilePlus className="w-4 h-4 mr-1.5" />
              Nouvelle plainte
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive gap-1.5 rounded-full"
            onClick={async () => { await signOut(); navigate('/'); }}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Déconnexion</span>
          </Button>
        </div>
      </div>

      {/* ── Stats rapides ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total plaintes" value={total} />
        <StatCard label="En attente" value={byStatus['En attente']} accent="amber" />
        <StatCard label="Validées" value={byStatus['Validée']} accent="green" />
        <StatCard label="Score votes" value={totalVotes >= 0 ? `+${totalVotes}` : String(totalVotes)} icon={<BarChart2 className="w-4 h-4" />} />
      </div>

      {/* ── Navigation onglets ─────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-border mb-8 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
              activeTab === id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Contenu des onglets ────────────────────────── */}
      {activeTab === 'plaintes' && (
        <MesPlaintesTab
          plaintes={plaintes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())}
          loading={loadingPlaintes}
          byStatus={byStatus}
          total={total}
          onDelete={async (id) => {
            await deletePlainte(id);
            setPlaintes((prev) => prev.filter((p) => p.id !== id));
            toast.success('Plainte supprimée.');
          }}
        />
      )}

      {activeTab === 'profil' && (
        <MonProfilTab
          profile={fullProfile ?? authProfile}
          userId={user!.id}
          plaintes={plaintes}
          onSaved={async () => { await refreshProfile(); await loadData(); }}
        />
      )}

      {activeTab === 'securite' && (
        <SecuriteTab
          profile={fullProfile ?? authProfile}
          userId={user!.id}
          onSaved={async () => { await loadData(); }}
        />
      )}
    </div>
  );
}

// ── Onglet Mes Plaintes ────────────────────────────────────────────────────

const PAGE_SIZE = 10;
type SortMode = 'recent' | 'oldest' | 'votes';

function MesPlaintesTab({
  plaintes, loading, byStatus, total, onDelete,
}: {
  plaintes: Plainte[];
  loading: boolean;
  byStatus: Record<PlainteStatus, number>;
  total: number;
  onDelete: (id: string) => Promise<void>;
}) {
  const STATUS_ORDER: PlainteStatus[] = ['En attente', 'Validée', 'Rejetée', 'Résolue', 'Perdue', 'Viral'];

  // ── Filtres & tri ──────────────────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState<PlainteStatus | 'all'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [page, setPage] = useState(1);

  // Filtered + sorted list
  const filtered = plaintes
    .filter((p) => filterStatus === 'all' || p.status === filterStatus)
    .sort((a, b) => {
      if (sortMode === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortMode === 'votes') return (b.vote_count ?? 0) - (a.vote_count ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp page when filters reduce result count
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [filterStatus, sortMode]);

  const goTo = (n: number) => setPage(Math.max(1, Math.min(n, totalPages)));

  // Build compact page window: always show first, last, current ±1
  const pageWindow = (): (number | '…')[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set([1, totalPages, safePage, safePage - 1, safePage + 1].filter((n) => n >= 1 && n <= totalPages));
    const sorted = [...set].sort((a, b) => a - b);
    const result: (number | '…')[] = [];
    sorted.forEach((n, i) => {
      if (i > 0 && n - (sorted[i - 1] as number) > 1) result.push('…');
      result.push(n);
    });
    return result;
  };

  const STATUS_COLORS: Record<PlainteStatus, string> = {
    'En attente': 'bg-amber-400',
    'Validée': 'bg-blue-500',
    'Rejetée': 'bg-red-400',
    'Viral': 'bg-purple-600',
    'Résolue': 'bg-green-500',
    'Perdue': 'bg-red-600',
    'En Médiation': 'bg-indigo-500',
  };

  return (
    <div>
      {/* Répartition visuelle */}
      {total > 0 && (
        <div className="mb-6 p-4 rounded-lg border border-border bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Répartition des statuts</p>
          <div className="flex rounded-full overflow-hidden h-1.5 gap-0.5 mb-3">
            {STATUS_ORDER.map((s) => {
              const pct = total > 0 ? ((byStatus[s] || 0) / total) * 100 : 0;
              return pct > 0 ? <div key={s} className={STATUS_COLORS[s]} style={{ width: `${pct}%` }} /> : null;
            })}
          </div>
          <div className="flex flex-wrap gap-4">
            {STATUS_ORDER.map((s) => (byStatus[s] > 0) && (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
                className={`flex items-center gap-1.5 text-xs transition-opacity ${filterStatus === 'all' || filterStatus === s ? 'opacity-100' : 'opacity-40'}`}
              >
                <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[s]}`} />
                <span className={filterStatus === s ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                  {s}
                </span>
                <span className="font-medium text-foreground">({byStatus[s]})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contrôles filtre + tri */}
      {!loading && total > 0 && (
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-5">
          {/* Filtre statut */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as PlainteStatus | 'all')}>
              <SelectTrigger className="h-8 text-xs rounded-full border-border bg-card w-44">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s} {byStatus[s] > 0 ? `(${byStatus[s]})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tri */}
          <div className="flex items-center gap-1">
            {([
              { id: 'recent', label: 'Récents', icon: SortDesc },
              { id: 'oldest', label: 'Anciens', icon: SortAsc },
              { id: 'votes', label: 'Votes', icon: BarChart2 },
            ] as { id: SortMode; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSortMode(id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all border ${
                  sortMode === id
                    ? 'bg-foreground text-background border-foreground font-medium'
                    : 'border-border text-muted-foreground hover:text-foreground bg-card'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Compteur résultats */}
          {filterStatus !== 'all' && (
            <p className="text-xs text-muted-foreground shrink-0">
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
              <div className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
                <div className="h-5 bg-muted rounded-full w-20 shrink-0" />
              </div>
              <div className="px-4 pb-3 space-y-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-4/5" />
              </div>
              <div className="px-4 py-3 border-t border-border flex gap-3">
                <div className="h-3 bg-muted rounded w-20" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : plaintes.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-2xl">
          <FilePlus className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-sm mb-4">Vous n'avez pas encore déposé de plainte.</p>
          <Button asChild className="rounded-full"><Link to="/soumettre">Déposer ma première plainte</Link></Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground text-sm">Aucune plainte avec ce statut.</p>
          <button onClick={() => setFilterStatus('all')} className="mt-2 text-xs text-primary underline-offset-2 hover:underline">
            Afficher toutes mes plaintes
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {paginated.map((p) => (
              <div key={p.id} className="relative group">
                <PlainteRecap plainte={p} />
                {/* Bouton supprimer (seulement En attente) */}
                {p.status === 'En attente' && (
                  <div className="absolute top-3 right-3 md:right-10">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="w-8 h-8 rounded-md bg-background border border-border text-muted-foreground hover:text-destructive hover:border-destructive flex items-center justify-center transition-all shadow-sm">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette plainte ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. La plainte "{p.game_server_name}" sera définitivement supprimée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(p.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center gap-3">
              {/* Info page */}
              <p className="text-xs text-muted-foreground">
                Page <span className="font-medium text-foreground">{safePage}</span> sur{' '}
                <span className="font-medium text-foreground">{totalPages}</span>
                {' '}· {filtered.length} dossier{filtered.length !== 1 ? 's' : ''}
              </p>

              {/* Contrôles */}
              <div className="flex items-center gap-1">
                {/* Première page */}
                <button
                  onClick={() => goTo(1)}
                  disabled={safePage === 1}
                  aria-label="Première page"
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-muted-foreground disabled:opacity-30 hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                {/* Précédent */}
                <button
                  onClick={() => goTo(safePage - 1)}
                  disabled={safePage === 1}
                  aria-label="Page précédente"
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-muted-foreground disabled:opacity-30 hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Numéros de pages avec ellipses */}
                {pageWindow().map((entry, i) =>
                  entry === '…' ? (
                    <span key={`ell-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground">
                      …
                    </span>
                  ) : (
                    <button
                      key={entry}
                      onClick={() => goTo(entry as number)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-xs transition-colors border ${
                        safePage === entry
                          ? 'bg-foreground text-background border-foreground font-semibold'
                          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {entry}
                    </button>
                  )
                )}

                {/* Suivant */}
                <button
                  onClick={() => goTo(safePage + 1)}
                  disabled={safePage === totalPages}
                  aria-label="Page suivante"
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-muted-foreground disabled:opacity-30 hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                {/* Dernière page */}
                <button
                  onClick={() => goTo(totalPages)}
                  disabled={safePage === totalPages}
                  aria-label="Dernière page"
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-muted-foreground disabled:opacity-30 hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {plaintes.length > 0 && (
        <div className="mt-6 text-center">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/plaintes">
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Voir toutes les plaintes publiques
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Onglet Mon Profil ──────────────────────────────────────────────────────

function MonProfilTab({
  profile, userId, onSaved, plaintes,
}: {
  profile: Profile | null;
  userId: string;
  onSaved: () => Promise<void>;
  plaintes: Plainte[];
}) {
  // ── Pseudo ────────────────────────────────────────────────────────────────
  const [username, setUsername] = useState(profile?.username ?? '');
  const [saving, setSaving] = useState(false);
  const [editUsername, setEditUsername] = useState(false);

  // ── Avatar ────────────────────────────────────────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Pseudo RP + Bio ───────────────────────────────────────────────────────
  const [pseudoRp, setPseudoRp]   = useState(profile?.pseudo_rp ?? '');
  const [bio, setBio]             = useState(profile?.bio ?? '');
  const [editRp, setEditRp]       = useState(false);
  const [savingRp, setSavingRp]   = useState(false);

  useEffect(() => {
    setUsername(profile?.username ?? '');
    setAvatarUrl(profile?.avatar_url ?? null);
    setPseudoRp(profile?.pseudo_rp ?? '');
    setBio(profile?.bio ?? '');
  }, [profile]);

  const usernameValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveUsername = async () => {
    if (!usernameValid) return;
    setSaving(true);
    try {
      await updateProfile(userId, { username });
      await onSaved();
      setEditUsername(false);
      toast.success('Pseudo mis à jour !');
    } catch {
      toast.error('Erreur lors de la mise à jour du pseudo.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;
    
    if (!originalFile.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image valide.");
      return;
    }

    setUploadingAvatar(true);
    const toastId = toast.loading("Mise à jour de l'avatar...");
    
    try {
      const { compressImage } = await import('@/lib/utils');
      const { file, compressed } = await compressImage(originalFile, 1);
      
      const url = await uploadAvatar(userId, file);
      if (url) {
        setAvatarUrl(url);
        await updateProfile(userId, { avatar_url: url });
        await onSaved();
        toast.success(`Photo de profil mise à jour ! ${compressed ? '(compressée auto)' : ''}`, { id: toastId });
      } else {
        throw new Error("Erreur URL");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'upload.', { id: toastId });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await updateProfile(userId, { avatar_url: null });
      setAvatarUrl(null);
      await onSaved();
      toast.success('Photo de profil supprimée.');
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const handleSaveRp = async () => {
    setSavingRp(true);
    try {
      await updateProfile(userId, {
        pseudo_rp: pseudoRp.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      await onSaved();
      setEditRp(false);
      toast.success('Profil RP mis à jour !');
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setSavingRp(false);
    }
  };

  // ── Statistiques ──────────────────────────────────────────────────────────
  const totalPlaintes     = plaintes.length;
  const avecPreuves       = plaintes.filter((p) => p.has_strong_evidence).length;
  const totalVotes        = plaintes.reduce((s, p) => s + (p.upvotes ?? 0) + (p.downvotes ?? 0), 0);
  const totalCommentaires = plaintes.reduce((s, p) => s + (p.comment_count ?? 0), 0);

  return (
    <div className="max-w-lg flex flex-col gap-6">

      {/* ── Avatar ─────────────────────────────────────────────────────────── */}
      <section className="p-5 rounded-2xl border border-border bg-card flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">Photo de profil</h2>

        <div className="flex items-center gap-5">
          {/* Aperçu */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-2xl object-cover border border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center border border-dashed border-border">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-2xl bg-background/70 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 min-w-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="gap-1.5"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              {avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
            </Button>

            {avatarUrl && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRemoveAvatar}
                disabled={uploadingAvatar}
                className="gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3.5 h-3.5" />
                Supprimer
              </Button>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              Photo, personnage RP ou illustration · JPEG, PNG, WEBP, GIF · Optimisée automatiquement (max 1 Mo)
            </p>
          </div>
        </div>

        {/* Option anonymat */}
        {!avatarUrl && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
            <UserX className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Mode anonyme actif.</span>{' '}
              Votre initiale est affichée à la place d'une photo. Vous pouvez rester ainsi sans aucune obligation d'ajouter une image.
            </p>
          </div>
        )}
      </section>

      {/* ── Pseudo (compte) ────────────────────────────────────────────────── */}
      <section className="p-5 rounded-2xl border border-border bg-card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Nom d'utilisateur</h2>
          {!editUsername && (
            <button
              onClick={() => setEditUsername(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Pencil className="w-3 h-3" /> Modifier
            </button>
          )}
        </div>

        {editUsername ? (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">@</span>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`pl-7 pr-9 ${usernameValid ? 'border-green-400' : 'border-red-400'}`}
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameValid
                  ? <Check className="w-4 h-4 text-green-500" />
                  : <X className="w-4 h-4 text-red-400" />}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">3–20 caractères · lettres, chiffres, _</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveUsername} disabled={saving || !usernameValid}>
                {saving ? 'Sauvegarde…' : 'Enregistrer'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditUsername(false); setUsername(profile?.username ?? ''); }}>
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary uppercase shrink-0">
                {(profile?.username ?? 'U').charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">@{profile?.username ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Visible publiquement sur vos signalements</p>
            </div>
          </div>
        )}
      </section>

      {/* ── Pseudo RP + Bio ─────────────────────────────────────────────────── */}
      <section className="p-5 rounded-2xl border border-border bg-card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Identité roleplay (optionnel)</h2>
          </div>
          {!editRp && (
            <button
              onClick={() => setEditRp(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Pencil className="w-3 h-3" /> {pseudoRp || bio ? 'Modifier' : 'Ajouter'}
            </button>
          )}
        </div>

        {!editRp ? (
          <div className="flex flex-col gap-2">
            {pseudoRp || bio ? (
              <>
                {pseudoRp && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">Pseudo RP</span>
                    <span className="text-sm font-medium text-foreground">🎭 {pseudoRp}</span>
                  </div>
                )}
                {bio && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground w-16 shrink-0 mt-0.5">Bio</span>
                    <span className="text-xs text-foreground leading-relaxed">{bio}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                <UserX className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Aucune identité RP configurée.{' '}
                  <span className="text-foreground">Entièrement optionnel</span> — vous pouvez rester anonyme.
                  Ajoutez un pseudo RP ou une courte bio si vous souhaitez personnaliser votre profil.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Pseudo RP */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Pseudo roleplay <span className="font-normal">(optionnel · max 64 car.)</span>
              </label>
              <Input
                value={pseudoRp}
                onChange={(e) => setPseudoRp(e.target.value.slice(0, 64))}
                placeholder="Ex : Capitaine Noir, Maître Zen, DarkLord42…"
              />
              <p className="text-xs text-muted-foreground">
                Votre personnage dans le monde RP. Laissez vide pour rester anonyme.
              </p>
            </div>

            {/* Bio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Bio <span className="font-normal">(optionnel · max 200 car.)</span>
              </label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                placeholder="Quelques mots sur vous ou votre personnage…"
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right tabular-nums">
                {bio.length}/200
              </p>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveRp} disabled={savingRp}>
                {savingRp ? 'Sauvegarde…' : 'Enregistrer'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditRp(false);
                  setPseudoRp(profile?.pseudo_rp ?? '');
                  setBio(profile?.bio ?? '');
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* ── Impact communautaire ─────────────────────────────────────────────── */}
      <section className="p-5 rounded-2xl border border-border bg-card flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Votre impact communautaire</h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-2 leading-relaxed">
          Toutes vos plaintes sont <span className="font-medium text-green-700 dark:text-green-400">visibles publiquement</span> par la communauté RPGuard.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <CommunityStatCard label="Signalements déposés" value={totalPlaintes} hint="visibles par tous" />
          <CommunityStatCard label="Avec preuves jointes" value={avecPreuves} hint="captures + vidéos" accent />
          <CommunityStatCard label="Votes reçus" value={totalVotes} hint="soutiens + contestations" />
          <CommunityStatCard label="Commentaires reçus" value={totalCommentaires} hint="réactions communauté" />
        </div>
        {totalPlaintes > 0 && (
          <Link
            to="/plaintes"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-4 self-start"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Voir tous les signalements publics
          </Link>
        )}
      </section>

      {/* ── Informations du compte ───────────────────────────────────────────── */}
      <section className="p-5 rounded-2xl border border-border bg-card flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground mb-1">Informations du compte</h2>
        <div className="flex flex-col gap-2">
          <ProfileInfoRow label="Rôle" value={profile?.role === 'admin' ? 'Administrateur' : 'Membre'} />
          <ProfileInfoRow label="Membre depuis" value={profile?.created_at
            ? formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: fr })
            : '—'}
          />
          <ProfileInfoRow label="Identifiant" value={profile?.id ? profile.id.slice(0, 8) + '…' : '—'} />
        </div>
      </section>

      {/* ── Zone sensible ────────────────────────────────────────────────────── */}
      <section className="p-5 rounded-2xl border border-destructive/20 bg-destructive/5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h2 className="text-sm font-semibold text-destructive">Zone sensible</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          La suppression de compte n'est pas encore disponible. Contactez-nous via la page <Link to="/contact" className="underline hover:text-foreground">Contact</Link>.
        </p>
      </section>
    </div>
  );
}

// ── Onglet Sécurité ────────────────────────────────────────────────────────

function SecuriteTab({
  profile, userId, onSaved,
}: {
  profile: Profile | null;
  userId: string;
  onSaved: () => Promise<void>;
}) {
  const { reauthAndUpdatePassword } = useAuth();
  // Changer mot de passe
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Question secrète
  const [newQuestion, setNewQuestion] = useState(profile?.security_question ?? '');
  const [newAnswer, setNewAnswer] = useState('');
  const [savingQ, setSavingQ] = useState(false);
  const [editQ, setEditQ] = useState(false);

  useEffect(() => {
    setNewQuestion(profile?.security_question ?? '');
  }, [profile]);

  const pwdStrength = getPasswordStrength(newPwd);
  const pwdMatch = confirmPwd.length > 0 && newPwd === confirmPwd;

  const handleChangePassword = async () => {
    if (!pwdMatch || pwdStrength.score < 2 || !currentPwd) return;
    setSavingPwd(true);
    const { error } = await reauthAndUpdatePassword(currentPwd, newPwd);
    setSavingPwd(false);
    if (error) {
      if (error.message.includes('incorrect')) {
        toast.error('Mot de passe actuel incorrect.');
      } else {
        toast.error('Erreur lors du changement de mot de passe.');
      }
      return;
    }
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    toast.success('Mot de passe mis à jour avec succès !');
  };

  const handleSaveQuestion = async () => {
    if (!newQuestion || newAnswer.trim().length < 2) return;
    setSavingQ(true);
    try {
      await updateProfile(userId, {
        security_question: newQuestion,
        security_answer: newAnswer.trim().toLowerCase(),
      });
      await onSaved();
      setNewAnswer('');
      setEditQ(false);
      toast.success('Question secrète mise à jour !');
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    } finally {
      setSavingQ(false);
    }
  };

  return (
    <div className="max-w-lg flex flex-col gap-6">

      {/* Changer le mot de passe */}
      <section className="p-5 rounded-2xl border border-border bg-card flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">Changer le mot de passe</h2>

        {/* Mot de passe actuel */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Mot de passe actuel</label>
          <div className="relative">
            <Input
              type={showCurrent ? 'text' : 'password'}
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              placeholder="••••••••"
              className="pr-10"
            />
            <button type="button" tabIndex={-1} onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Nouveau mot de passe */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Nouveau mot de passe</label>
          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="Minimum 8 caractères"
              className="pr-10"
            />
            <button type="button" tabIndex={-1} onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {newPwd.length > 0 && (
            <div className="flex gap-1 h-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`flex-1 rounded-full transition-all ${i <= pwdStrength.score ? pwdStrength.color : 'bg-border'}`} />
              ))}
            </div>
          )}
        </div>

        {/* Confirmation */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Confirmer le nouveau mot de passe</label>
          <Input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            placeholder="••••••••"
            className={confirmPwd.length > 0 ? (pwdMatch ? 'border-green-400' : 'border-red-400') : ''}
          />
          {confirmPwd.length > 0 && (
            <p className={`text-xs flex items-center gap-1 ${pwdMatch ? 'text-green-600' : 'text-red-500'}`}>
              {pwdMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              {pwdMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
            </p>
          )}
        </div>

        <Button
          onClick={handleChangePassword}
          disabled={savingPwd || !pwdMatch || pwdStrength.score < 2 || !currentPwd}
          size="sm"
          className="self-start"
        >
          {savingPwd ? 'Mise à jour…' : 'Enregistrer le nouveau mot de passe'}
        </Button>
      </section>

      {/* Question secrète */}
      <section className="p-5 rounded-2xl border border-border bg-card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Question secrète</h2>
          </div>
          {!editQ && (
            <button onClick={() => setEditQ(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Pencil className="w-3 h-3" /> Modifier
            </button>
          )}
        </div>

        {!editQ ? (
          <div className="flex flex-col gap-2">
            {profile?.security_question ? (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Question actuelle</p>
                <p className="text-sm text-foreground font-medium">{profile.security_question}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-green-500" />
                  Réponse enregistrée (masquée pour votre sécurité)
                </p>
              </>
            ) : (
              <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Aucune question secrète configurée. Ajoutez-en une pour pouvoir récupérer votre compte en cas d'oubli.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">Nouvelle question</label>
              <Select value={newQuestion} onValueChange={setNewQuestion}>
                <SelectTrigger><SelectValue placeholder="Choisissez une question…" /></SelectTrigger>
                <SelectContent>
                  {SECRET_QUESTIONS.map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newQuestion && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground">Nouvelle réponse</label>
                <Input
                  type="text"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Votre réponse mémorable…"
                  className={newAnswer.trim().length >= 2 ? 'border-green-400' : ''}
                />
                <p className="text-xs text-muted-foreground">Non sensible à la casse · min. 2 caractères</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveQuestion} disabled={savingQ || !newQuestion || newAnswer.trim().length < 2}>
                {savingQ ? 'Sauvegarde…' : 'Enregistrer'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditQ(false); setNewAnswer(''); }}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Info sécurité */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/15">
        <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-foreground mb-0.5">Conseils de sécurité</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Utilisez un mot de passe unique et fort. Ne partagez jamais vos identifiants. En cas de doute, changez immédiatement votre mot de passe.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Sous-composants ────────────────────────────────────────────────────────

function StatCard({ label, value, accent, icon }: {
  label: string; value: number | string; accent?: 'amber' | 'green' | 'red'; icon?: React.ReactNode;
}) {
  const accentClass = accent === 'amber' ? 'text-amber-600' : accent === 'green' ? 'text-green-600' : accent === 'red' ? 'text-red-600' : 'text-foreground';
  return (
    <div className="p-4 rounded-2xl border border-border bg-card flex flex-col gap-1.5">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <span className={`text-2xl font-semibold tabular-nums ${accentClass}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function ProfileInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}

function CommunityStatCard({
  label, value, hint, accent,
}: {
  label: string; value: number; hint: string; accent?: boolean;
}) {
  return (
    <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col gap-1">
      <span className={`text-xl font-semibold tabular-nums ${accent ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </span>
      <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, ChevronDown, ChevronUp, Trash2,
  CheckCircle, XCircle, Flame, Clock, RefreshCw,
  StickyNote, ExternalLink, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { fetchAdminPlaintes, adminUpdatePlainte, deletePlainte } from '@/lib/api';
import type { PlainteStatus } from '@/types/types';

interface PlainteRow {
  id: string;
  game_server_name: string;
  admin_name: string;
  description: string;
  status: PlainteStatus;
  has_strong_evidence: boolean;
  admin_note: string | null;
  created_at: string;
  profiles: { username: string | null } | null;
  categories: { name: string; color: string } | null;
}

const STATUSES: Array<{ value: string; label: string }> = [
  { value: 'tous',       label: 'Tous' },
  { value: 'En attente', label: 'En attente' },
  { value: 'Validée',    label: 'Validées' },
  { value: 'Résolue',    label: 'Résolues / Gagnées' },
  { value: 'Perdue',     label: 'Perdues' },
  { value: 'Rejetée',    label: 'Rejetées' },
  { value: 'Viral',      label: 'Viral' },
];

const STATUS_STYLE: Record<string, string> = {
  'En attente': 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  'En Médiation': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
  'Validée':    'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  'Résolue':    'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  'Perdue':     'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  'Rejetée':    'bg-destructive/10 text-destructive border-destructive/20',
  'Viral':      'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
};

const STATUS_ACTIONS: Array<{ status: PlainteStatus; label: string; icon: React.ElementType }> = [
  { status: 'En attente', label: 'En attente', icon: Clock },
  { status: 'En Médiation', label: 'Médiation',  icon: Clock },
  { status: 'Validée',    label: 'Valider',    icon: CheckCircle },
  { status: 'Résolue',    label: 'Gagnée',     icon: CheckCircle },
  { status: 'Perdue',     label: 'Perdue',     icon: XCircle },
  { status: 'Rejetée',    label: 'Rejeter',    icon: XCircle },
  { status: 'Viral',      label: 'Viral',      icon: Flame },
];

export default function AdminPlaintesPage() {
  const [params, setParams] = useSearchParams();
  const [plaintes, setPlaintes]     = useState<PlainteRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState(params.get('status') ?? 'tous');
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [editNote, setEditNote]     = useState<{ id: string; text: string } | null>(null);
  // Confirmation suppression via AlertDialog (pas window.confirm)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Debounce de la recherche — évite les requêtes à chaque frappe
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAdminPlaintes({
      status: filter !== 'tous' ? filter : undefined,
      search: debouncedSearch.trim() || undefined,
      lim:    100,
    });
    setPlaintes(data as unknown as PlainteRow[]);
    setLoading(false);
  }, [filter, debouncedSearch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setParams(filter !== 'tous' ? { status: filter } : {}); }, [filter, setParams]);

  const changeStatus = async (id: string, status: PlainteStatus) => {
    try {
      await adminUpdatePlainte(id, { status });
      setPlaintes(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      toast.success(`Statut mis à jour : ${status}`);
    } catch {
      toast.error('Erreur mise à jour statut');
    }
  };

  const saveNote = async (id: string, note: string) => {
    try {
      await adminUpdatePlainte(id, { admin_note: note || undefined });
      setPlaintes(prev => prev.map(p => p.id === id ? { ...p, admin_note: note || null } : p));
      setEditNote(null);
      toast.success('Note enregistrée');
    } catch {
      toast.error('Erreur sauvegarde note');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      await deletePlainte(id);
      setPlaintes(prev => prev.filter(p => p.id !== id));
      if (expanded === id) setExpanded(null);
      toast.success('Plainte supprimée');
    } catch {
      toast.error('Erreur suppression');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Gestion des plaintes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{plaintes.length} résultat{plaintes.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2 shrink-0">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </Button>
      </div>

      {/* Filtres + recherche */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Serveur, accusé…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex flex-col gap-2 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-4">
              <div className="w-8 h-8 bg-muted rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-4 bg-muted rounded w-2/5" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
              <div className="hidden md:flex gap-4 shrink-0">
                <div className="h-3 bg-muted rounded w-20" />
                <div className="h-5 bg-muted rounded-full w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : plaintes.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucune plainte trouvée</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {plaintes.map(p => (
            <div
              key={p.id}
              className={`border rounded-xl bg-card transition-all ${
                p.status === 'En attente' ? 'border-amber-500/30' : 'border-border'
              }`}
            >
              {/* En-tête */}
              <button
                className="w-full flex items-center gap-3 px-5 py-4 text-left"
                onClick={() => setExpanded(prev => prev === p.id ? null : p.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground truncate">{p.game_server_name}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[p.status] ?? ''}`}>
                      {p.status}
                    </span>
                    {p.has_strong_evidence && (
                      <span className="text-xs text-primary font-medium">📎 Preuves</span>
                    )}
                    {p.admin_note && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <StickyNote className="w-3 h-3" /> Note
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Accusé : <span className="font-medium">{p.admin_name}</span>
                    {' · '}par @{p.profiles?.username ?? '?'}
                    {' · '}{new Date(p.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {expanded === p.id
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                }
              </button>

              {/* Détail développé */}
              {expanded === p.id && (
                <div className="px-5 pb-5 border-t border-border space-y-4">
                  {/* Description */}
                  <div className="pt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Description</p>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{p.description}</p>
                  </div>

                  {/* Note admin */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Note interne</p>
                    {editNote?.id === p.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                          rows={3}
                          value={editNote.text}
                          onChange={e => setEditNote({ id: p.id, text: e.target.value })}
                          placeholder="Note privée visible uniquement par les admins…"
                          maxLength={1000}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveNote(p.id, editNote.text)}>Enregistrer</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditNote(null)}>Annuler</Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors p-3 rounded-lg border border-dashed border-border hover:border-primary/40 min-h-[48px]"
                        onClick={() => setEditNote({ id: p.id, text: p.admin_note ?? '' })}
                      >
                        {p.admin_note ?? <span className="italic opacity-60">Cliquer pour ajouter une note…</span>}
                      </div>
                    )}
                  </div>

                  {/* Actions statut */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Changer le statut</p>
                    <div className="flex gap-2 flex-wrap">
                      {STATUS_ACTIONS.map(({ status, label, icon: Icon }) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={p.status === status ? 'default' : 'outline'}
                          className="gap-1.5 text-xs h-8"
                          onClick={() => changeStatus(p.id, status)}
                          disabled={p.status === status}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Actions secondaires */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                      <Link to={`/plaintes/${p.id}`} target="_blank">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Voir la page publique
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs text-destructive border-destructive/20 hover:bg-destructive/8 ml-auto"
                      onClick={() => setDeleteTarget(p.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AlertDialog de confirmation de suppression (remplace window.confirm) */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la plainte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La plainte, ses preuves et ses commentaires seront
              définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

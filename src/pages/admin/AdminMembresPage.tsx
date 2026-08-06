import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Shield, User, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { fetchAdminProfiles, adminUpdateProfileRole } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, UserRole } from '@/types/types';

export default function AdminMembresPage() {
  const { profile: me } = useAuth();
  const [members, setMembers]         = useState<Profile[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // Cible du dialog de confirmation de changement de rôle
  const [roleTarget, setRoleTarget]   = useState<Profile | null>(null);
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce 400 ms — évite une requête DB à chaque frappe
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAdminProfiles(debouncedSearch.trim() || undefined);
    setMembers(data as Profile[]);
    setLoading(false);
  }, [debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  // Ouvre le dialog de confirmation
  const requestToggleRole = (target: Profile) => {
    if (target.id === me?.id) {
      toast.error('Vous ne pouvez pas modifier votre propre rôle.');
      return;
    }
    setRoleTarget(target);
  };

  // Exécuté après confirmation dans l'AlertDialog
  const confirmToggleRole = async () => {
    if (!roleTarget) return;
    const newRole = (roleTarget.role === 'admin' ? 'user' : 'admin') as UserRole;
    const label   = newRole === 'admin' ? 'promu administrateur' : 'rétrogradé membre';

    try {
      await adminUpdateProfileRole(roleTarget.id, newRole);
      setMembers(prev => prev.map(m => m.id === roleTarget.id ? { ...m, role: newRole } : m));
      toast.success(`@${roleTarget.username} ${label}.`);
    } catch {
      toast.error('Erreur mise à jour rôle');
    }
    setRoleTarget(null);
  };

  const adminCount  = members.filter(m => m.role === 'admin').length;
  const memberCount = members.filter(m => m.role === 'user').length;

  return (
    <>
    {/* Dialog de confirmation de changement de rôle */}
    <AlertDialog open={!!roleTarget} onOpenChange={(open) => { if (!open) setRoleTarget(null); }}>
      <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {roleTarget?.role === 'admin' ? 'Rétrograder ce membre ?' : 'Promouvoir en administrateur ?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {roleTarget?.role === 'admin'
              ? `@${roleTarget?.username} perdra ses droits d'administration.`
              : `@${roleTarget?.username} obtiendra tous les droits d'administration. Cette action est réversible.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmToggleRole}
            className={roleTarget?.role !== 'admin' ? '' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
          >
            Confirmer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Gestion des membres</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {adminCount} admin{adminCount > 1 ? 's' : ''} · {memberCount} membre{memberCount > 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2 shrink-0">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </Button>
      </div>

      {/* Recherche */}
      <div className="relative mb-5 w-full md:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un pseudo…"
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="border border-border rounded-xl bg-card overflow-hidden divide-y divide-border animate-pulse">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="w-8 h-8 bg-muted rounded-full shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/5" />
              </div>
              <div className="hidden md:flex gap-3 shrink-0">
                <div className="h-5 bg-muted rounded-full w-16" />
                <div className="h-5 bg-muted rounded-full w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucun membre trouvé</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Pseudo</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Rôle</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Inscrit le</th>
                  <th className="px-5 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          m.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {(m.username ?? '?').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">@{m.username ?? '—'}</span>
                        {m.id === me?.id && (
                          <span className="text-xs text-muted-foreground">(vous)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {m.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                          <User className="w-3 h-3" /> Membre
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(m.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      {m.id !== me?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className={`text-xs h-7 ${m.role === 'admin' ? 'text-destructive border-destructive/20 hover:bg-destructive/8' : ''}`}
                          onClick={() => requestToggleRole(m)}
                        >
                          {m.role === 'admin' ? 'Rétrograder' : 'Promouvoir admin'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

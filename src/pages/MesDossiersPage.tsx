import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import PageMeta from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Download,
  ExternalLink,
  Trash2,
  FileText,
  ShieldCheck,
  Loader2,
  FolderOpen,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PdfExport {
  id: string;
  plainte_id: string;
  server_name: string;
  admin_name: string;
  filename: string;
  exported_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: fr });
  } catch {
    return iso;
  }
}

function formatAbsolute(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export default function MesDossiersPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [exports,  setExports]  = useState<PdfExport[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [dlLoading, setDlLoading] = useState<string | null>(null); // id du dossier en téléchargement
  const [deletingId, setDeletingId] = useState<string | null>(null); // id de l'entrée en cours de suppression
  const [deletingAll, setDeletingAll] = useState(false); // suppression totale en cours

  // ── Chargement de l'historique ──────────────────────────────────────────────
  const fetchExports = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('pdf_exports')
      .select('*')
      .eq('user_id', user.id)
      .order('exported_at', { ascending: false });

    if (error) {
      toast.error('Impossible de charger votre historique.');
    } else {
      setExports((data ?? []) as PdfExport[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { navigate('/connexion'); return; }
    fetchExports();
  }, [user, fetchExports, navigate]);

  // ── Re-téléchargement d'un dossier ─────────────────────────────────────────
  const handleRedownload = async (exp: PdfExport) => {
    if (dlLoading) return;
    setDlLoading(exp.id);
    try {
      const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const { data: { session } } = await supabase.auth.getSession();
      const bearerToken = session?.access_token ?? supabaseAnonKey;

      const res = await fetch(
        `${supabaseUrl}/functions/v1/export-plainte-pdf?id=${exp.plainte_id}`,
        { headers: { 'Authorization': `Bearer ${bearerToken}`, 'apikey': supabaseAnonKey } },
      );

      if (!res.ok) throw new Error('Erreur serveur');
      const blob = await res.blob();
      if (!blob.type.includes('pdf')) throw new Error('Réponse invalide');

      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = exp.filename;
      a.click();
      URL.revokeObjectURL(objUrl);
      toast.success('Dossier re-téléchargé avec succès ✓');
    } catch {
      const pageUrl = `${window.location.origin}/plaintes/${exp.plainte_id}`;
      toast.error('Erreur PDF — ouverture dans Google Docs…', { duration: 4000 });
      setTimeout(
        () => window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(pageUrl)}&embedded=false`, '_blank', 'noopener'),
        1500,
      );
    } finally {
      setDlLoading(null);
    }
  };

  // ── Suppression d'une entrée ────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    const { error } = await supabase.from('pdf_exports').delete().eq('id', id);
    if (error) {
      toast.error('Impossible de supprimer cette entrée.');
    } else {
      setExports((prev) => prev.filter((e) => e.id !== id));
      toast.success('Entrée supprimée de l\'historique.');
    }
    setDeletingId(null);
  };

  // ── Suppression totale ──────────────────────────────────────────────────────
  const handleDeleteAll = async () => {
    if (!user || deletingAll) return;
    setDeletingAll(true);
    const { error } = await supabase.from('pdf_exports').delete().eq('user_id', user.id);
    if (error) {
      toast.error('Impossible de vider l\'historique.');
    } else {
      setExports([]);
      toast.success('Historique vidé.');
    }
    setDeletingAll(false);
  };

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <>
      <PageMeta
        title="Mes dossiers PDF — RPGuard"
        description="Historique de vos dossiers de plainte générés en PDF sur RPGuard."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">

        {/* En-tête */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <FolderOpen className="w-5 h-5 text-foreground/70" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Mes dossiers</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Historique des PDF générés — {exports.length} dossier{exports.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {exports.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Vider l'historique
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Vider l'historique ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Toutes les entrées de votre historique seront supprimées.
                      Les dossiers sur RPGuard et les fichiers PDF déjà téléchargés ne sont pas affectés.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAll}
                      disabled={deletingAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deletingAll ? 'Suppression…' : 'Vider'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Chargement…
          </div>
        ) : exports.length === 0 ? (
          /* État vide */
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
            <ShieldCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-base font-medium text-foreground mb-1">Aucun dossier généré</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Ouvrez une plainte et cliquez sur «&nbsp;Télécharger le dossier&nbsp;» pour créer votre premier PDF.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/plaintes">Voir les plaintes</Link>
            </Button>
          </div>
        ) : (
          /* Liste des exports */
          <div className="space-y-3">
            {exports.map((exp) => (
              <div
                key={exp.id}
                className="group flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-foreground/20 transition-colors"
              >
                {/* Icône */}
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-foreground/60" />
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate leading-snug">
                    {exp.server_name || 'Serveur inconnu'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    Contre&nbsp;: <span className="text-foreground/70">{exp.admin_name || '—'}</span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {exp.filename}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Calendar className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                    <span
                      className="text-xs text-muted-foreground"
                      title={formatAbsolute(exp.exported_at)}
                    >
                      {formatRelative(exp.exported_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Voir la plainte */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-foreground"
                    title="Voir la plainte sur RPGuard"
                    asChild
                  >
                    <Link to={`/plaintes/${exp.plainte_id}`}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </Button>

                  {/* Re-télécharger */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-foreground"
                    title="Re-télécharger le dossier PDF"
                    onClick={() => handleRedownload(exp)}
                    disabled={dlLoading === exp.id}
                  >
                    {dlLoading === exp.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Download className="w-3.5 h-3.5" />}
                  </Button>

                  {/* Supprimer de l'historique */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Supprimer de l'historique"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette entrée ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette entrée sera retirée de votre historique. Le dossier sur RPGuard et les fichiers
                          déjà téléchargés ne sont pas affectés.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(exp.id)}
                          disabled={!!deletingId}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deletingId === exp.id ? 'Suppression…' : 'Supprimer'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Note bas de page */}
        {exports.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-8">
            Cet historique est local à votre compte. Les fichiers PDF sont générés à la demande et ne sont pas stockés sur nos serveurs.
          </p>
        )}
      </div>
    </>
  );
}

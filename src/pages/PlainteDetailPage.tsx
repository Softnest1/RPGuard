import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGoBack } from '@/hooks/use-go-back';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import PageMeta from '@/components/common/PageMeta';
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
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  ShieldCheck,
  Flag,
  ArrowLeft,
  Clock,
  Image as ImageIcon,
  User,
  CalendarDays,
  Quote,
  Users,
  Download,
  Loader2,
  ExternalLink,
  Link2,
  UserPlus,
  LogOut,
  CheckCircle2,
  Scale,
  BookOpen,
} from 'lucide-react';
import CategoryBadge from '@/components/common/CategoryBadge';
import StatusBadge from '@/components/common/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchPlainteById,
  fetchPreuves,
  fetchCommentaires,
  fetchAccuses,
  fetchCoPlaignants,
  checkUserJoined,
  joinPlainte,
  leavePlainte,
  getUserVote,
  submitVote,
  removeVote,
  createCommentaire,
  createSignalement,
} from '@/lib/api';
import type { Plainte, Commentaire, Preuve, VoteType, CoPlaignant } from '@/types/types';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  computeDossierScore,
  DossierScoreWidget,
  DossierScoreBanner,
} from '@/lib/dossierScore.tsx';
import type { DossierScoreInput } from '@/lib/dossierScore.tsx';

export default function PlainteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const goBack = useGoBack('/plaintes');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [plainte, setPlainte] = useState<Plainte | null>(null);
  const [preuves, setPreuves] = useState<Preuve[]>([]);
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [accuses, setAccuses] = useState<{ id: string; pseudo_rp: string; role: string }[]>([]);
  const [coPlaignants, setCoPlaignants] = useState<CoPlaignant[]>([]);
  const [hasJoined, setHasJoined] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinPseudo, setJoinPseudo] = useState('');
  const [joinTemoignage, setJoinTemoignage] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [userVote, setUserVote] = useState<VoteType | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [votingLoading, setVotingLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<'image' | 'video'>('image');
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportPdf = async () => {
    if (!plainte || pdfLoading) return;
    setPdfLoading(true);
    try {
      // Export PDF via la Supabase Edge Function `export-plainte-pdf`
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const url = `${supabaseUrl}/functions/v1/export-plainte-pdf?id=${plainte.id}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });
      if (!res.ok) throw new Error('Erreur serveur');
      const blob = await res.blob();
      const serverName = plainte.game_server_name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
      const filename = `RPGuard_plainte_${serverName}_${plainte.id.slice(0, 8)}.pdf`;
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objUrl);
      toast.success('PDF téléchargé avec succès');
    } catch {
      toast.error('Impossible de générer le PDF. Réessayez.');
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchPlainteById(id),
      fetchPreuves(id),
      fetchCommentaires(id),
      fetchAccuses(id),
      fetchCoPlaignants(id),
    ])
      .then(([p, pr, c, acc, co]) => {
        if (!p) { navigate('/plaintes'); return; }
        setPlainte(p);
        setPreuves(pr);
        setCommentaires(c);
        setAccuses(acc);
        setCoPlaignants(co);
      })
      .catch(() => { setLoading(false); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Vérifie si l'utilisateur courant a déjà rejoint
  useEffect(() => {
    if (!id || !user) return;
    checkUserJoined(id).then(setHasJoined).catch(() => {});
  }, [id, user]);

  useEffect(() => {
    if (!id || !user) return;
    getUserVote(id).then((v) => setUserVote(v?.vote_type ?? null)).catch(() => {});
  }, [id, user]);

  // Fermer le lightbox avec Escape
  useEffect(() => {
    if (!lightboxSrc) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxSrc(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxSrc]);

  const handleVote = async (type: VoteType) => {    if (!user) { navigate('/connexion'); return; }
    if (!plainte) return;
    setVotingLoading(true);
    try {
      if (userVote === type) {
        // Retirer le vote
        await removeVote(plainte.id);
        setUserVote(null);
        const upvotes   = (plainte.upvotes ?? 0) - (type === 'pour' ? 1 : 0);
        const downvotes = (plainte.downvotes ?? 0) - (type === 'contre' ? 1 : 0);
        setPlainte({ ...plainte, upvotes, downvotes, vote_count: upvotes - downvotes });
      } else {
        await submitVote(plainte.id, type);
        const prevUp   = plainte.upvotes ?? 0;
        const prevDown = plainte.downvotes ?? 0;
        const upvotes   = type === 'pour'    ? prevUp + 1   : Math.max(0, prevUp   - (userVote === 'pour'    ? 1 : 0));
        const downvotes = type === 'contre'  ? prevDown + 1 : Math.max(0, prevDown - (userVote === 'contre'  ? 1 : 0));
        setUserVote(type);
        setPlainte({ ...plainte, upvotes, downvotes, vote_count: upvotes - downvotes });
      }
    } catch {
      toast.error('Erreur lors du vote');
    } finally {
      setVotingLoading(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/connexion'); return; }
    if (!newComment.trim() || !plainte) return;
    setCommentLoading(true);
    try {
      await createCommentaire(plainte.id, newComment.trim());
      const updated = await fetchCommentaires(plainte.id);
      setCommentaires(updated);
      setNewComment('');
      toast.success('Commentaire ajouté');
    } catch {
      toast.error('Erreur lors de l\'ajout du commentaire');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleSignal = async () => {
    if (!plainte) return;
    try {
      await createSignalement(plainte.id);
      toast.success('Signalement enregistré. Notre modération va examiner cette plainte.');
    } catch {
      toast.error('Vous avez déjà signalé cette plainte.');
    }
  };

  // ── Rejoindre le dossier collectif ────────────────────────────────────────
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plainte || !joinPseudo.trim()) return;
    setJoinLoading(true);
    try {
      await joinPlainte(plainte.id, joinPseudo, joinTemoignage);
      const updated = await fetchCoPlaignants(plainte.id);
      setCoPlaignants(updated);
      setHasJoined(true);
      setJoinDialogOpen(false);
      setJoinPseudo('');
      setJoinTemoignage('');
      toast.success('Vous avez rejoint ce dossier collectif.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'adhésion.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!plainte) return;
    setLeaveLoading(true);
    try {
      await leavePlainte(plainte.id);
      const updated = await fetchCoPlaignants(plainte.id);
      setCoPlaignants(updated);
      setHasJoined(false);
      toast.success('Vous avez quitté ce dossier collectif.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setLeaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 animate-pulse space-y-6">
        <PageMeta
          title="Chargement de la plainte — RPGuard"
          description="Consultez les détails de ce signalement d'abus sur RPGuard, la plateforme de justice communautaire GTA RP, FiveM et RedM."
        />
        {/* Fil d'ariane */}
        <div className="h-4 bg-muted rounded w-48" />
        {/* En-tête plainte */}
        <div className="space-y-3 pb-6 border-b border-border">
          <div className="h-7 bg-muted rounded w-2/3" />
          <div className="h-5 bg-muted rounded w-1/2" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 bg-muted rounded-full w-20" />
            <div className="h-5 bg-muted rounded-full w-24" />
          </div>
        </div>
        {/* Corps */}
        <div className="space-y-2 pb-6 border-b border-border">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-11/12" />
          <div className="h-4 bg-muted rounded w-4/5" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
        {/* Section votes */}
        <div className="flex gap-3 pb-6 border-b border-border">
          <div className="h-10 bg-muted rounded-xl w-28" />
          <div className="h-10 bg-muted rounded w-10 self-center" />
          <div className="h-10 bg-muted rounded-xl w-28" />
        </div>
        {/* Commentaires */}
        <div className="space-y-3">
          <div className="h-5 bg-muted rounded w-36" />
          {[1,2].map(j => (
            <div key={j} className="border border-border rounded-xl p-4 space-y-2">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!plainte) return null;

  const score = (plainte.upvotes ?? 0) - (plainte.downvotes ?? 0);

  // ── Score de force du dossier ────────────────────────────────────────────
  const dossierScore = computeDossierScore({
    hasPreuves: preuves.length > 0,
    hasVideo: preuves.some((p) => p.file_type === 'video'),
    descriptionLen: plainte.description?.length ?? 0,
    hasDate: !!plainte.date_incident,
    hasContexte: !!(plainte.contexte && plainte.contexte.length > 10),
    nbAccuses: accuses.length,
    hasRaison: !!(plainte.raison && plainte.raison.length >= 10),
  });

  return (
    <>
      <PageMeta
        title={plainte ? `Plainte contre ${plainte.admin_name} sur ${plainte.game_server_name} — RPGuard` : 'Détail de Plainte — RPGuard'}
        description={plainte ? `Dossier de plainte contre l'administrateur ${plainte.admin_name} du serveur ${plainte.game_server_name}. Motif: ${plainte.raison}. Consultez les preuves et votez.` : 'Détail d\'une plainte RPGuard.'}
        keywords={`${plainte?.admin_name}, ${plainte?.game_server_name}, plainte administrateur, abus de pouvoir, preuve RP, justice communautaire`}
      />
      {/* Lightbox — supporte images ET vidéos */}
      {lightboxSrc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Preuve agrandie"
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          {lightboxType === 'video' ? (
            <video
              src={lightboxSrc}
              controls
              autoPlay
              playsInline
              controlsList="nodownload"
              className="max-w-full max-h-[90vh] w-auto h-auto rounded-xl shadow-2xl ring-1 ring-white/10 object-contain bg-black"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img src={lightboxSrc} alt="Preuve agrandie" className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-xl shadow-2xl ring-1 ring-white/10 bg-black/50" onClick={(e) => e.stopPropagation()} />
          )}
          <button
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setLightboxSrc(null)}
            aria-label="Fermer"
          >✕</button>
        </div>
      )}

      <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 xl:px-12 py-12 md:py-16 2xl:py-24">
        {/* Retour */}
        <div className="flex items-center justify-between mb-8 2xl:mb-12">
          <button
            onClick={() => goBack()}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux plaintes
          </button>

          {/* Bouton export PDF — compatible tous appareils */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={pdfLoading}
            className="rounded-full gap-2 shrink-0"
          >
            {pdfLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {pdfLoading ? 'Génération…' : 'Exporter PDF'}
            </span>
          </Button>
        </div>

        {/* Bannière visiteur */}
        {!user && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl border border-border bg-card">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground leading-snug">
                <span className="text-foreground font-medium">Connectez-vous</span>{' '}
                pour voter, commenter et déposer vos propres plaintes.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link to="/connexion">Se connecter</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/inscription">S'inscrire</Link>
              </Button>
            </div>
          </div>
        )}

        {/* En-tête */}
        <div className="mb-8 pb-8 border-b border-border">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {plainte.categories && <CategoryBadge category={plainte.categories} size="md" />}
            <StatusBadge status={plainte.status} />
            {plainte.has_strong_evidence && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary">
                <ShieldCheck className="w-3.5 h-3.5" />
                Preuves vérifiées
              </span>
            )}
          </div>

          {/* Article du règlement cité par la modération */}
          {plainte.cited_article && (
            <div className="flex items-start gap-3 mb-4 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5">
              <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">
                  Article du règlement cité par la modération
                </p>
                <Link
                  to="/reglement"
                  className="text-sm font-semibold text-primary hover:underline underline-offset-2 transition-colors"
                >
                  {plainte.cited_article}
                </Link>
              </div>
            </div>
          )}
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-2 text-balance">
            {plainte.game_server_name}
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            Admin visé : <span className="font-semibold text-foreground">{plainte.admin_name}</span>
          </p>
          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 shrink-0 bg-muted/40 pr-2.5 rounded-full ring-1 ring-border/30">
              {plainte.profiles?.avatar_url ? (
                <img src={plainte.profiles.avatar_url} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-muted-foreground ml-1.5" aria-hidden="true" />
              )}
              <span className="font-medium text-foreground py-1">
                {plainte.profiles?.username ?? 'Anonyme'}
                {plainte.profiles?.pseudo_rp && <span className="text-muted-foreground/60 hidden sm:inline ml-1 font-normal">({plainte.profiles.pseudo_rp})</span>}
              </span>
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(plainte.created_at), { addSuffix: true, locale: fr })}
            </span>
          </div>
        </div>

        {/* Force du dossier */}
        <DossierScoreBanner score={dossierScore} className="mb-8" />

        {/* Identité du plaignant */}
        <section className="mb-8 pb-8 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Plaignant
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plainte.pseudo_rp && (
              <InfoPill label="Pseudo RP in-game" value={plainte.pseudo_rp} />
            )}
            {plainte.date_incident && (
              <InfoPill
                label="Date de l'incident"
                value={format(new Date(plainte.date_incident), 'dd MMMM yyyy', { locale: fr })}
                icon={<CalendarDays className="w-3.5 h-3.5" />}
              />
            )}
          </div>
          {plainte.raison && (
            <div className="mt-3 flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/5 border border-primary/10">
              <Quote className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed italic">"{plainte.raison}"</p>
            </div>
          )}
        </section>

        {/* Mis en cause */}
        {accuses.length > 0 && (
          <section className="mb-8 pb-8 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Personnes mises en cause ({accuses.length})
            </h2>
            <div className="flex flex-col gap-2">
              {accuses.map((acc) => (
                <div key={acc.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-destructive uppercase">{acc.pseudo_rp.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{acc.pseudo_rp}</p>
                  </div>
                  <RoleBadge role={acc.role} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Co-plaignants — Dossier collectif */}
        <section className="mb-8 pb-8 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4" />
              Victimes du dossier
              <span className="text-xs font-normal text-muted-foreground normal-case tracking-normal ml-1">
                {coPlaignants.length + 1} victime{coPlaignants.length + 1 !== 1 ? 's' : ''}
              </span>
            </h2>
            {/* Bouton rejoindre / quitter — uniquement pour les membres connectés non-créateurs */}
            {user && plainte && user.id !== plainte.user_id && (
              hasJoined ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5 text-xs"
                  disabled={leaveLoading}
                  onClick={handleLeave}
                >
                  {leaveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                  Quitter le dossier
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="rounded-full gap-1.5 text-xs"
                  onClick={() => setJoinDialogOpen(true)}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Rejoindre le dossier
                </Button>
              )
            )}
          </div>

          {/* Plaignant principal */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                {plainte.profiles?.avatar_url ? (
                  <img src={plainte.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-primary uppercase">
                    {(plainte.profiles?.username ?? 'A').charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {plainte.profiles?.username ?? 'Anonyme'}
                </p>
                {plainte.pseudo_rp && (
                  <p className="text-xs text-muted-foreground truncate">{plainte.pseudo_rp}</p>
                )}
              </div>
              <span className="text-xs text-primary font-medium shrink-0 bg-primary/10 px-2 py-0.5 rounded-full">
                Plaignant principal
              </span>
            </div>

            {/* Co-plaignants */}
            {coPlaignants.map((cp) => (
              <div key={cp.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
                  {cp.profiles?.avatar_url ? (
                    <img src={cp.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      {(cp.profiles?.username ?? cp.pseudo_rp ?? 'A').charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {cp.profiles?.username ?? 'Membre'}
                    </p>
                    {cp.pseudo_rp && (
                      <span className="text-xs text-muted-foreground">({cp.pseudo_rp})</span>
                    )}
                    {/* Badge "Vous" si c'est l'utilisateur courant */}
                    {user && cp.user_id === user.id && (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                        Vous
                      </span>
                    )}
                  </div>
                  {cp.temoignage && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed italic line-clamp-2">
                      "{cp.temoignage}"
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 mt-1">
                  {formatDistanceToNow(new Date(cp.created_at), { addSuffix: true, locale: fr })}
                </span>
              </div>
            ))}

            {/* Invitation à rejoindre si non connecté ou non encore membre */}
            {!user && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border bg-muted/10 mt-1">
                <UserPlus className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Victime du même admin ?{' '}
                  <Link to="/connexion" className="text-primary font-medium hover:underline">
                    Connectez-vous
                  </Link>{' '}
                  pour rejoindre ce dossier collectif.
                </p>
              </div>
            )}
            {user && plainte && user.id !== plainte.user_id && !hasJoined && (
              <button
                type="button"
                onClick={() => setJoinDialogOpen(true)}
                className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left mt-1 group"
              >
                <UserPlus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Victime du même admin ? <span className="text-primary font-medium">Rejoindre ce dossier collectif</span>
                </p>
              </button>
            )}
          </div>
        </section>

        {/* Description */}
        <section className="mb-8 pb-8 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Description de l'abus</h2>
          <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap text-pretty">{plainte.description}</p>
          {plainte.contexte && (
            <div className="mt-4 p-3.5 rounded-xl bg-muted/30 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Contexte supplémentaire</p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{plainte.contexte}</p>
            </div>
          )}
          {plainte.demarche_prealable && (
            <div className="mt-4 p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/10">
              <h3 className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                Démarche préalable avec le staff
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{plainte.demarche_prealable}</p>
            </div>
          )}
        </section>

        {/* Timeline */}
        <section className="mb-8 pb-8 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Chronologie</h2>
          <div className="flex flex-col gap-3">
            {plainte.date_incident && (
              <TimelineEntry label="Incident signalé" date={plainte.date_incident} dateOnly />
            )}
            <TimelineEntry
              label="Plainte déposée"
              date={plainte.created_at}
            />
            {plainte.updated_at !== plainte.created_at && (
              <TimelineEntry label="Dernière mise à jour" date={plainte.updated_at} />
            )}
            <div className="flex items-start gap-3 text-sm">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{(plainte.comment_count ?? 0)}</span> commentaire{(plainte.comment_count ?? 0) !== 1 ? 's' : ''} · score communautaire{' '}
                <span className={`font-semibold ${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {score >= 0 ? '+' : ''}{score}
                </span>
              </span>
            </div>
          </div>
        </section>

        {/* Preuves */}
        {preuves.length > 0 && (
          <section className="mb-8 pb-8 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Preuves ({preuves.length})
            </h2>

            {/* Fichiers image/vidéo uploadés */}
            {preuves.filter(p => p.file_type !== 'link').length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {preuves.filter(p => p.file_type !== 'link').map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setLightboxSrc(p.publicUrl ?? ''); setLightboxType(p.file_type === 'video' ? 'video' : 'image'); }}
                    className="aspect-video w-full rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-colors bg-muted relative"
                    aria-label={`Voir la preuve : ${p.file_name ?? 'fichier'}`}
                  >
                    {p.file_type === 'video' ? (
                      <>
                        <video src={p.publicUrl} className="w-full h-full object-cover" preload="metadata" muted playsInline />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            <span className="text-black text-xl leading-none ml-1">▶</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <img
                        src={p.publicUrl}
                        alt={p.file_name ?? 'Preuve'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Liens vidéo externes (TikTok, YouTube, etc.) */}
            {preuves.filter(p => p.file_type === 'link').length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" />
                  Liens vidéo externes
                </p>
                {preuves.filter(p => p.file_type === 'link').map((p) => {
                  const url = p.lien_video ?? '';
                  const isTikTok   = url.includes('tiktok.com');
                  const isYouTube  = url.includes('youtube.com') || url.includes('youtu.be');
                  const isTwitch   = url.includes('twitch.tv');
                  const platformLabel = isTikTok ? 'TikTok' : isYouTube ? 'YouTube' : isTwitch ? 'Twitch' : 'Vidéo externe';
                  const displayLabel = p.lien_label || platformLabel;
                  return (
                    <a
                      key={p.id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-muted/50 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{displayLabel}</p>
                        <p className="text-xs text-muted-foreground truncate">{url}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 border border-border rounded-full px-2 py-0.5">
                        {platformLabel}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Votes */}
        <section className="mb-8 pb-8 border-b border-border">
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-5">Avis de la communauté</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleVote('pour')}
              disabled={votingLoading || !user}
              title={!user ? 'Connectez-vous pour voter' : ''}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                !user
                  ? 'border-border text-muted-foreground opacity-50 cursor-not-allowed'
                  : userVote === 'pour'
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'border-border hover:border-green-300 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Soutenir</span>
              <span className="font-bold tabular-nums">{plainte.upvotes ?? 0}</span>
            </button>

            <div className={`text-2xl font-bold tabular-nums ${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {score >= 0 ? '+' : ''}{score}
            </div>

            <button
              onClick={() => handleVote('contre')}
              disabled={votingLoading || !user}
              title={!user ? 'Connectez-vous pour voter' : ''}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                !user
                  ? 'border-border text-muted-foreground opacity-50 cursor-not-allowed'
                  : userVote === 'contre'
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'border-border hover:border-red-300 hover:bg-red-50 hover:text-red-700'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>Contester</span>
              <span className="font-bold tabular-nums">{plainte.downvotes ?? 0}</span>
            </button>
          </div>
          {!user && (
            <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 text-center">
              <p className="text-sm text-foreground font-medium mb-3">
                Votre voix a du poids. Les votes des joueurs font plier les serveurs.
              </p>
              <Button asChild size="sm" className="rounded-full shadow-sm">
                <Link to="/inscription">Créer un compte pour voter (30s)</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Commentaires */}
        <section className="mb-8 pb-8 border-b border-border">
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Commentaires ({commentaires.length})
          </h2>

          {commentaires.length === 0 ? (
            <p className="text-sm text-muted-foreground mb-6">Aucun commentaire. Soyez le premier à réagir.</p>
          ) : (
            <div className="flex flex-col gap-5 mb-6">
              {commentaires.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground uppercase overflow-hidden border border-border">
                    {c.profiles?.avatar_url ? (
                      <img src={c.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (c.profiles?.username ?? '?').charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {c.profiles?.username ?? 'Anonyme'}
                        {c.profiles?.pseudo_rp && <span className="text-muted-foreground/60 hidden sm:inline ml-1 font-normal">({c.profiles.pseudo_rp})</span>}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {user ? (
            <form onSubmit={handleComment} className="flex flex-col gap-3">
              <Textarea
                placeholder="Votre commentaire…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="resize-none px-3 rounded-xl"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={commentLoading || !newComment.trim()} className="rounded-full px-5">
                  {commentLoading ? 'Envoi…' : 'Commenter'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
              <p className="text-sm text-muted-foreground">
                <Link to="/connexion" className="underline underline-offset-4 hover:text-foreground font-medium">Connectez-vous</Link>{' '}
                pour laisser un commentaire.
              </p>
              <div className="flex gap-2 shrink-0">
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link to="/connexion">Se connecter</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <Link to="/inscription">S'inscrire</Link>
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Lien règlement */}
        <section className="py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Ce dossier est traité conformément au{' '}
              <Link
                to="/reglement"
                className="font-medium text-foreground underline underline-offset-2 hover:text-primary transition-colors"
              >
                Règlement RPGuard (15 articles)
              </Link>
              . La modération peut citer un article lors de sa décision.
            </p>
          </div>
        </section>

        {/* Signaler */}
        {user && (
          <section className="flex items-center justify-between py-4">
            <p className="text-xs text-muted-foreground">
              Cette plainte vous semble abusive ou incorrecte ?
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive gap-1.5">
                  <Flag className="w-3.5 h-3.5" />
                  Signaler
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Signaler cette plainte</AlertDialogTitle>
                  <AlertDialogDescription>
                    Vous êtes sur le point de signaler cette plainte comme fausse ou abusive. Notre modération va l'examiner.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignal}>Confirmer le signalement</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        )}
      </div>

      {/* Dialog — Rejoindre le dossier collectif */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Rejoindre ce dossier collectif
            </DialogTitle>
            <DialogDescription>
              Ajoutez votre témoignage pour renforcer le dossier contre cet admin.
              Votre pseudo RP sera visible publiquement.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJoin} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Votre pseudo RP in-game <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="ex: Jean_Dupont"
                value={joinPseudo}
                onChange={(e) => setJoinPseudo(e.target.value)}
                maxLength={60}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Votre témoignage{' '}
                <span className="text-xs font-normal text-muted-foreground">(optionnel)</span>
              </label>
              <Textarea
                placeholder="Décrivez brièvement ce que vous avez vécu avec cet admin…"
                value={joinTemoignage}
                onChange={(e) => setJoinTemoignage(e.target.value)}
                maxLength={500}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{joinTemoignage.length}/500</p>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                En rejoignant ce dossier, vous certifiez avoir été victime de cet admin et que vos informations sont exactes.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setJoinDialogOpen(false)}
                disabled={joinLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={joinLoading || !joinPseudo.trim()}>
                {joinLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Envoi…</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" />Rejoindre le dossier</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TimelineEntry({ label, date, dateOnly }: { label: string; date: string; dateOnly?: boolean }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
      <span className="text-muted-foreground">
        <span className="font-medium text-foreground">{label}</span>
        {' — '}
        {dateOnly
          ? format(new Date(date), 'dd MMM yyyy', { locale: fr })
          : format(new Date(date), 'dd MMM yyyy à HH:mm', { locale: fr })}
      </span>
    </div>
  );
}

// ── Badge rôle ──────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  Fondateur:      'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  Gérant:         'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800',
  Administrateur: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
  Modérateur:     'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
  Helper:         'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  Staff:          'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400 border border-pink-200 dark:border-pink-800',
  Inconnu:        'bg-muted text-muted-foreground border border-border',
};

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_COLORS[role] ?? ROLE_COLORS['Inconnu'];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${cls}`}>
      {role}
    </span>
  );
}

// ── Pill info ───────────────────────────────────────────────────────────────

function InfoPill({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border bg-muted/20">
      {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

// Les types DossierScoreInput / DossierScoreResult, computeDossierScore,
// DossierScoreWidget et DossierScoreBanner sont maintenant dans @/lib/dossierScore

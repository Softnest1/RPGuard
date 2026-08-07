// Page dédiée par serveur — SEO-first, Google-proof, résistante aux bans Discord
// URL : /serveurs/[slug] — ex: /serveurs/nova-city-rp
import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, ExternalLink, Copy, Check,
  AlertTriangle, TrendingDown, Clock, UserX,
  Share2, Gamepad2, BarChart3, FileText, ChevronRight,
  Globe, MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageMeta from '@/components/common/PageMeta';
import PageContainer from '@/components/layouts/PageContainer';
import PlainteCard from '@/components/common/PlainteCard';
import GameBadge from '@/components/common/GameBadge';
import StatusBadge from '@/components/common/StatusBadge';
import { fetchServerScores } from '@/lib/api';
import { fetchPlaintes } from '@/lib/api/plaintes';
import { slugify } from '@/lib/slugify';
import type { ServerScore, Plainte } from '@/types/types';
import { toast } from 'sonner';

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreInfo(score: number) {
  if (score >= 80) return {
    label: 'Sain', emoji: '✅',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800/40',
    bar: 'bg-green-500',
    desc: 'Ce serveur présente peu de signalements. La communauté le considère comme sain.',
  };
  if (score >= 60) return {
    label: 'Correct', emoji: '🟡',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/40',
    bar: 'bg-amber-400',
    desc: 'Quelques signalements notables. Renseignez-vous avant de rejoindre.',
  };
  if (score >= 40) return {
    label: 'Risqué', emoji: '🔴',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-200 dark:border-orange-800/40',
    bar: 'bg-orange-400',
    desc: 'Nombre important de signalements validés. Prudence fortement recommandée.',
  };
  return {
    label: 'Dangereux', emoji: '💀',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800/40',
    bar: 'bg-red-500',
    desc: 'Ce serveur cumule de nombreux abus documentés. Évitez de le rejoindre.',
  };
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function ServeurDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [server, setServer] = useState<ServerScore | null>(null);
  const [plaintes, setPlaintes] = useState<Plainte[]>([]);
  const [loadingServer, setLoadingServer] = useState(true);
  const [loadingPlaintes, setLoadingPlaintes] = useState(true);
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Trouver le serveur correspondant au slug
  useEffect(() => {
    let active = true;
    setLoadingServer(true);
    fetchServerScores()
      .then((scores) => {
        if (!active) return;
        const match = scores.find((s) => slugify(s.server_name) === slug);
        if (!match) { setNotFound(true); setLoadingServer(false); return; }
        setServer(match);
        setLoadingServer(false);
      })
      .catch(() => { setNotFound(true); setLoadingServer(false); });
    return () => { active = false; };
  }, [slug]);

  // Charger les plaintes du serveur
  useEffect(() => {
    if (!server) return;
    let active = true;
    setLoadingPlaintes(true);
    fetchPlaintes({ exactServer: server.server_name, sortBy: 'date', limit: 100 })
      .then((data) => {
        if (!active) return;
        // Double-vérification slug côté client — 0 faux positif garanti
        const filtered = data.filter(
          (p) => slugify(p.game_server_name) === slug
        );
        setPlaintes(filtered);
        setLoadingPlaintes(false);
      })
      .catch(() => setLoadingPlaintes(false));
    return () => { active = false; };
  }, [server, slug]);

  const pageUrl = typeof window !== 'undefined' ? window.location.href : `https://rpguard.fr/serveurs/${slug}`;

  const info = useMemo(() => server ? scoreInfo(server.score) : null, [server]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pageUrl).then(() => {
      setCopied(true);
      toast.success('Lien copié dans le presse-papier !');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    const shareText = server
      ? `⚠️ Dossier RPGuard — ${server.server_name}\nTrust Score : ${server.score}/100 (${info?.label})\n${server.total_plaintes} signalement(s) documenté(s) par la communauté.\n🔗 ${pageUrl}`
      : pageUrl;

    if (navigator.share) {
      try {
        await navigator.share({ title: `RPGuard — ${server?.server_name}`, text: shareText, url: pageUrl });
      } catch { /* annulé par l'utilisateur */ }
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        toast.success('Texte de partage copié ! Collez-le où vous voulez.');
      });
    }
  };

  const handleShareX = () => {
    if (!server) return;
    const text = encodeURIComponent(
      `⚠️ ${server.server_name} — Trust Score ${server.score}/100 sur @RPGuard_fr\n${server.total_plaintes} signalement(s) communautaire(s). Vérifiez avant de rejoindre.`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(pageUrl)}`, '_blank');
  };

  // ── Page 404 ──────────────────────────────────────────────────────────────
  if (notFound && !loadingServer) {
    return (
      <PageContainer width="xl" className="py-20 text-center">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Serveur introuvable</h1>
        <p className="text-muted-foreground mb-6">Ce serveur n'existe pas encore dans notre base ou a été supprimé.</p>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/serveurs">← Voir le classement</Link>
        </Button>
      </PageContainer>
    );
  }

  const metaTitle = server
    ? `${server.server_name} — Abus signalés, Trust Score ${server.score}/100 | RPGuard`
    : 'Fiche serveur | RPGuard';
  const metaDesc = server
    ? `${server.total_plaintes} signalement(s) documenté(s) contre ${server.server_name} sur RPGuard. Trust Score : ${server.score}/100 — ${info?.label}. Consultez les preuves avant de rejoindre ce serveur.`
    : 'Fiche de signalements communautaires sur RPGuard.';

  return (
    <div className="w-full bg-background min-h-screen">
      {server && (
        <PageMeta
          title={metaTitle}
          description={metaDesc}
          keywords={`${server.server_name}, abus serveur RP, signalement, RPGuard, Trust Score, ${server.game_type ?? 'GTA RP'}`}
        />
      )}

      {/* ── EN-TÊTE ────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-muted/10 py-6 md:py-10">
        <PageContainer width="xl">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 text-muted-foreground -ml-2"
            onClick={() => navigate('/serveurs')}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Classement serveurs
          </Button>

          {loadingServer ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-64 rounded-lg" />
              <Skeleton className="h-5 w-40 rounded-lg" />
            </div>
          ) : server && info ? (
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              {/* Titre + badges */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <GameBadge gameType={server.game_type} size="sm" />
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded border ${info.bg} ${info.color} ${info.border}`}>
                    {info.emoji} {info.label}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 text-balance">
                  {server.server_name}
                </h1>
                <p className="text-sm text-muted-foreground">{info.desc}</p>
              </div>

              {/* Trust Score */}
              <div className={`shrink-0 rounded-2xl border p-5 text-center w-full md:w-44 ${info.bg} ${info.border}`}>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Trust Score</p>
                <p className={`text-5xl font-black tabular-nums leading-none ${info.color}`}>{server.score}</p>
                <p className={`text-sm font-semibold mt-1 ${info.color}`}>/100</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full ${info.bar}`} style={{ width: `${Math.min(server.score, 100)}%` }} />
                </div>
              </div>
            </div>
          ) : null}
        </PageContainer>
      </div>

      <PageContainer width="xl" className="py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── COLONNE PRINCIPALE : Plaintes ─────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {loadingPlaintes ? 'Chargement…' : `${plaintes.length} signalement${plaintes.length !== 1 ? 's' : ''} documenté${plaintes.length !== 1 ? 's' : ''}`}
              </h2>
              <Button asChild size="sm" className="rounded-full shrink-0">
                <Link to="/soumettre">
                  <FileText className="w-4 h-4 mr-1.5" />
                  Signaler
                </Link>
              </Button>
            </div>

            {loadingPlaintes ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-56 rounded-xl" />
                ))}
              </div>
            ) : plaintes.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-border rounded-xl bg-muted/10">
                <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-foreground font-medium mb-1">Aucun signalement pour ce serveur</p>
                <p className="text-sm text-muted-foreground mb-4">Ce serveur est clean, ou le premier à signaler n'est pas encore arrivé.</p>
                <Button asChild size="sm" className="rounded-full">
                  <Link to="/soumettre">Être le premier à signaler</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plaintes.map((p) => (
                  <PlainteCard key={p.id} plainte={p} />
                ))}
              </div>
            )}
          </div>

          {/* ── COLONNE LATÉRALE : Stats + Partage ──────────────────── */}
          <div className="space-y-5">

            {/* Stats du serveur */}
            {server && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  Statistiques
                </h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Total signalements', value: server.total_plaintes, icon: FileText },
                    { label: 'Validées', value: server.plaintes_valides, icon: AlertTriangle },
                    { label: 'En attente', value: server.plaintes_en_attente ?? 0, icon: Clock },
                    { label: 'Rejetées', value: server.plaintes_rejetees ?? 0, icon: Check },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </span>
                      <span className="font-semibold text-foreground tabular-nums">{value}</span>
                    </div>
                  ))}
                  {server.top_admin_name && (
                    <div className="pt-3 mt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                        <UserX className="w-3.5 h-3.5" /> Admin le plus signalé
                      </p>
                      <p className="font-semibold text-foreground text-sm truncate">{server.top_admin_name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── BLOC RÉSISTANCE — Partager malgré les bans ── */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                  <Share2 className="w-4 h-4 text-primary" />
                  Diffuser ce dossier
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Même si ce serveur a banni RPGuard de son Discord, ce lien reste accessible à tous.
                  Partagez-le partout — <strong className="text-foreground">Google n'est pas bancable.</strong>
                </p>
              </div>

              <div className="space-y-2">
                {/* Copier le lien */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-lg text-xs"
                  onClick={handleCopyLink}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Lien copié !' : 'Copier le lien direct'}
                </Button>

                {/* Partager (natif ou texte) */}
                <Button
                  size="sm"
                  className="w-full justify-start gap-2 rounded-lg text-xs"
                  onClick={handleShare}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Partager ce dossier
                </Button>

                {/* Twitter/X */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleShareX}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Publier sur X (Twitter)
                </Button>
              </div>

              <div className="pt-2 border-t border-border/50">
                <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                  Ce dossier est public, permanent et indexé par Google. Il ne peut pas être supprimé par le serveur concerné.
                </p>
              </div>
            </div>

            {/* Lien vers guide résistance */}
            <Link
              to="/resistance"
              className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  Guide de résistance
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Diffuser un dossier même si vous êtes banni
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            {/* Signaler ce serveur */}
            <div className="rounded-xl border border-border bg-muted/10 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-3">Vous avez subi un abus sur ce serveur ?</p>
              <Button asChild size="sm" className="w-full rounded-full">
                <Link to={`/soumettre`}>
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Déposer mon dossier
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

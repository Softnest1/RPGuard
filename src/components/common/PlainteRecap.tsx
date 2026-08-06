// Récapitulatif détaillé d'une plainte — tableau de bord utilisateur
// Affiche toutes les informations sauvegardées : identité, accusés, faits, preuves (images + vidéos)
import { memo, useEffect, useState } from 'react';
import {
  ChevronDown, ChevronUp, ShieldCheck, Clock,
  Image as ImageIcon, MessageCircle, ThumbsUp, ThumbsDown,
  FileX, ExternalLink, Globe, Users, Play, CalendarDays,
  FileText, User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Plainte, Preuve } from '@/types/types';
import { fetchPreuves, fetchAccuses } from '@/lib/api';
import CategoryBadge from './CategoryBadge';
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PlainteRecapProps {
  plainte: Plainte;
}

type AccuseItem = { id: string; pseudo_rp: string; role: string };

// Couleur du badge rôle
const ROLE_COLORS: Record<string, string> = {
  Administrateur: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40',
  Modérateur:     'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/40',
  Helper:         'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40',
  Staff:          'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/40',
  Inconnu:        'bg-muted text-muted-foreground border-border',
};

function PlainteRecapInner({ plainte }: PlainteRecapProps) {
  const [open, setOpen]                   = useState(false);
  const [preuves, setPreuves]             = useState<Preuve[]>([]);
  const [accuses, setAccuses]             = useState<AccuseItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loaded, setLoaded]               = useState(false);
  const [lightboxSrc, setLightboxSrc]           = useState<string | null>(null);
  // lightboxVideoSrc distinct : null = image, string = vidéo
  const [lightboxVideoSrc, setLightboxVideoSrc] = useState<string | null>(null);

  // Chargement paresseux — preuves + accusés en parallèle à la 1ʳᵉ ouverture
  useEffect(() => {
    if (!open || loaded || loadingDetail) return;
    setLoadingDetail(true);
    Promise.all([
      fetchPreuves(plainte.id),
      fetchAccuses(plainte.id),
    ])
      .then(([pr, ac]) => { setPreuves(pr); setAccuses(ac); setLoaded(true); })
      .catch(console.error)
      .finally(() => setLoadingDetail(false));
  }, [open, plainte.id, loaded, loadingDetail]);

  // Fermer le lightbox avec la touche Escape
  useEffect(() => {
    if (!lightboxSrc && !lightboxVideoSrc) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setLightboxSrc(null); setLightboxVideoSrc(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxSrc, lightboxVideoSrc]);

  const score       = (plainte.upvotes ?? 0) - (plainte.downvotes ?? 0);
  const imgPreuves  = preuves.filter((p) => p.file_type !== 'video');
  const vidPreuves  = preuves.filter((p) => p.file_type === 'video');

  return (
    <>
      {/* Lightbox images */}
      {lightboxSrc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Preuve agrandie — appuyez sur Échap pour fermer"
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          {/* Vidéo en lightbox — stopPropagation pour ne pas fermer en cliquant sur les contrôles */}
          {lightboxVideoSrc ? (
            <video
              src={lightboxVideoSrc}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightboxSrc}
              alt="Preuve agrandie"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          )}
          <button
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => { setLightboxSrc(null); setLightboxVideoSrc(null); }}
            aria-label="Fermer"
          >✕</button>
        </div>
      )}

      {/* Card principale */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">

        {/* ── En-tête cliquable ─────────────────────────────── */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left px-4 py-4 flex items-start gap-3 hover:bg-muted/30 transition-colors"
        >
          <div className="shrink-0 mt-0.5">
            <StatusBadge status={plainte.status} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {plainte.categories && <CategoryBadge category={plainte.categories} />}
              {plainte.has_strong_evidence && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                  <ShieldCheck className="w-3 h-3" />
                  Preuves
                </span>
              )}
              {/* Badge visibilité publique */}
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/40">
                <Globe className="w-3 h-3" />
                Visible publiquement
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground truncate">{plainte.game_server_name}</p>
            <p className="text-xs text-muted-foreground">
              {accuses.length > 0
                ? <>{accuses.length} mis en cause · </>
                : null}
              déposé {format(new Date(plainte.created_at), 'dd MMM yyyy', { locale: fr })}
            </p>
          </div>

          <div className="shrink-0 text-muted-foreground mt-0.5">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* ── Panneau détail ────────────────────────────────── */}
        {open && (
          <div className="border-t border-border divide-y divide-border">

            {/* 1. Votre identité & raison */}
            <Section icon={<User className="w-3.5 h-3.5" />} title="Votre identité">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Pseudo RP (in-game)" value={plainte.pseudo_rp ?? '—'} />
                {plainte.date_incident && (
                  <InfoRow
                    label="Date de l'incident"
                    value={format(new Date(plainte.date_incident), 'dd MMMM yyyy', { locale: fr })}
                    icon={<CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  />
                )}
              </div>
              {plainte.raison && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Motif du signalement</p>
                  <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-xl px-4 py-3">
                    {plainte.raison}
                  </p>
                </div>
              )}
            </Section>

            {/* 2. Informations du signalement */}
            <Section icon={<FileText className="w-3.5 h-3.5" />} title="Informations du signalement">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Serveur / Jeu RP" value={plainte.game_server_name} />
                <InfoRow label="Catégorie d'abus" value={plainte.categories?.name ?? '—'} />
                <InfoRow
                  label="Date de dépôt"
                  value={format(new Date(plainte.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  icon={<Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                />
                <InfoRow label="Statut actuel" value={plainte.status} />
                {plainte.updated_at !== plainte.created_at && (
                  <InfoRow
                    label="Dernière mise à jour"
                    value={format(new Date(plainte.updated_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  />
                )}
              </div>
            </Section>

            {/* 3. Personnes mises en cause */}
            <Section icon={<Users className="w-3.5 h-3.5" />} title="Personnes mises en cause">
              {loadingDetail ? (
                <div className="flex flex-col gap-2">
                  {[...Array(2)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}
                </div>
              ) : accuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune personne enregistrée.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {accuses.map((a, i) => (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{a.pseudo_rp}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ROLE_COLORS[a.role] ?? ROLE_COLORS['Inconnu']}`}>
                        {a.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* 4. Description des faits */}
            <Section icon={<FileText className="w-3.5 h-3.5" />} title="Description des faits">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/40 rounded-xl px-4 py-3">
                {plainte.description}
              </p>
              {plainte.contexte && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Contexte supplémentaire</p>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/40 rounded-xl px-4 py-3">
                    {plainte.contexte}
                  </p>
                </div>
              )}
            </Section>

            {/* 5. Preuves — images */}
            <Section icon={<ImageIcon className="w-3.5 h-3.5" />} title={`Captures d'écran (${imgPreuves.length})`}>
              {loadingDetail ? (
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(3)].map((_, i) => <div key={i} className="aspect-video rounded-lg bg-muted animate-pulse" />)}
                </div>
              ) : imgPreuves.length === 0 ? (
                <EmptyMedia label="Aucune capture d'écran jointe." />
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-1.5">
                    {imgPreuves.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setLightboxSrc(p.publicUrl ?? ''); setLightboxVideoSrc(null); }}
                        className="aspect-video rounded-xl overflow-hidden border border-border hover:border-primary/40 transition-colors bg-muted group"
                        title={p.file_name ?? 'Image'}
                      >
                        <img
                          src={p.publicUrl}
                          alt={p.file_name ?? 'Preuve'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = ''; }}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Cliquez sur une image pour l'agrandir.</p>
                </>
              )}
            </Section>

            {/* 6. Preuves — vidéos */}
            <Section icon={<Play className="w-3.5 h-3.5" />} title={`Vidéos de preuve (${vidPreuves.length})`}>
              {loadingDetail ? (
                <div className="flex flex-col gap-2">
                  {[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
                </div>
              ) : vidPreuves.length === 0 ? (
                <EmptyMedia label="Aucune vidéo jointe." />
              ) : (
                <div className="flex flex-col gap-3">
                  {vidPreuves.map((p) => (
                    <div key={p.id} className="rounded-xl border border-border overflow-hidden bg-muted/20">
                      {/* Miniature cliquable qui ouvre le lightbox vidéo */}
                      <button
                        className="relative w-full aspect-video bg-black flex items-center justify-center group"
                        onClick={() => { setLightboxVideoSrc(p.publicUrl ?? ''); setLightboxSrc(p.publicUrl ?? ''); }}
                        title={p.file_name ?? 'Vidéo de preuve'}
                        aria-label={`Lire la vidéo : ${p.file_name ?? 'preuve'}`}
                      >
                        <video
                          src={p.publicUrl}
                          className="w-full h-full object-cover"
                          preload="metadata"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                            <span className="text-black text-xl leading-none ml-1">▶</span>
                          </div>
                        </div>
                      </button>
                      {p.file_name && (
                        <p className="px-3 py-1.5 text-xs text-muted-foreground truncate border-t border-border">
                          {p.file_name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* 7. Réactions communauté */}
            <Section icon={<MessageCircle className="w-3.5 h-3.5" />} title="Réactions de la communauté">
              <div className="flex flex-wrap gap-4">
                <Stat icon={<ThumbsUp className="w-3.5 h-3.5" />} label="Soutiens" value={plainte.upvotes ?? 0} color="text-green-600" />
                <Stat icon={<ThumbsDown className="w-3.5 h-3.5" />} label="Contestations" value={plainte.downvotes ?? 0} color="text-red-500" />
                <Stat icon={<MessageCircle className="w-3.5 h-3.5" />} label="Commentaires" value={plainte.comment_count ?? 0} />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Score net :</span>
                  <span className={`text-sm font-bold tabular-nums ${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {score >= 0 ? '+' : ''}{score}
                  </span>
                </div>
              </div>
            </Section>

            {/* 8. Accès public */}
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>Ce signalement est <span className="font-medium text-green-700 dark:text-green-400">visible par toute la communauté</span>.</span>
              </div>
              <Link
                to={`/plaintes/${plainte.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-4 shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Page publique
              </Link>
            </div>

          </div>
        )}
      </div>
    </>
  );
}

// Memoized — prevents re-render when parent re-renders with stable plainte reference
const PlainteRecap = memo(PlainteRecapInner);
export default PlainteRecap;

// ── Sous-composants ────────────────────────────────────────────────────────────

function Section({
  icon, title, children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-5 flex flex-col gap-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1 text-sm font-medium text-foreground">
        {icon}{value}
      </span>
    </div>
  );
}

function EmptyMedia({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2.5 px-4 rounded-xl border border-dashed border-border bg-muted/20">
      <FileX className="w-4 h-4 shrink-0" />
      {label}
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={color ?? 'text-muted-foreground'}>{icon}</span>
      <span className={`font-semibold tabular-nums ${color ?? 'text-foreground'}`}>{value}</span>
      <span>{label}</span>
    </div>
  );
}

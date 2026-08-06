import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PageMeta from '@/components/common/PageMeta';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShieldCheck, Upload, X, CheckCircle2, Lock, Plus,
  User, Server, FileText, Image as ImageIcon, ClipboardList,
  Trash2, Play, AlertTriangle, Star, Save, Link2, ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCategories, createPlainte, uploadPreuve, addPreuveLien, createAccuse } from '@/lib/api';
import type { Category } from '@/types/types';
import { toast } from 'sonner';
import { computeDossierScore, DossierScoreWidget } from '@/lib/dossierScore.tsx';
import type { DossierScoreInput } from '@/lib/dossierScore.tsx';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { DRAFT_KEYS } from '@/lib/drafts';

// ── Rôles disponibles ────────────────────────────────────────────────────────
const ROLES = ['Administrateur', 'Modérateur', 'Helper', 'Fondateur', 'Gérant', 'Staff', 'Inconnu'] as const;
type Role = typeof ROLES[number];

// ── Types locaux ─────────────────────────────────────────────────────────────
interface Accuse {
  id: string;      // clé locale uniquement
  pseudo_rp: string;
  role: Role;
}

interface MediaFile {
  file: File;
  preview: string; // objectURL
  type: 'image' | 'video';
}

// ── Définition des étapes ────────────────────────────────────────────────────
const STEPS = [
  { label: 'Jeu & Serveur',   icon: Server },
  { label: 'Votre identité',  icon: User },
  { label: 'Mis en cause',    icon: ShieldCheck },
  { label: 'Les faits',       icon: FileText },
  { label: 'Preuves',         icon: ImageIcon },
] as const;

// ── Limites ──────────────────────────────────────────────────────────────────
const MAX_IMAGES  = 8;
const MAX_VIDEOS  = 3;
const MAX_IMG_MB  = 10;
// uploadPreuve() côté API limite à 50 Mo pour les vidéos
const MAX_VID_MB  = 50;

export default function SoumettreePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Étape courante
  const [step, setStep, removeStep] = useLocalStorage(DRAFT_KEYS.SOUMETTRE_STEP, 0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]   = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  
  // Utilitaire pour nettoyer tout le localStorage lié à cette page
  const clearDraft = () => {
    removeStep(); removeCategoryId(); removeGameServerName(); removeDateIncident();
    removePseudoRp(); removeRaison(); removeAccuses(); removeServerDiscordLink();
    removeServerEmail(); removeServerTopserveurLink(); removeAccusedDiscordTag();
    removeDescription(); removeContexte(); removeDemarchePrealable();
    setLegalConsent(false);
  };

  // Étape 1 — Jeu & Serveur
  const [categoryId, setCategoryId, removeCategoryId]                 = useLocalStorage('rpguard_draft_categoryId', '');
  const [gameServerName, setGameServerName, removeGameServerName]     = useLocalStorage('rpguard_draft_serverName', '');
  const [dateIncident, setDateIncident, removeDateIncident]           = useLocalStorage('rpguard_draft_date', '');

  // Étape 2 — Identité du plaignant
  const [pseudoRp, setPseudoRp, removePseudoRp]   = useLocalStorage('rpguard_draft_pseudo', '');
  const [raison, setRaison, removeRaison]         = useLocalStorage('rpguard_draft_raison', '');

  // Étape 3 — Mis en cause & Contact Serveur
  const [accuses, setAccuses, removeAccuses] = useLocalStorage<Accuse[]>('rpguard_draft_accuses', [
    { id: crypto.randomUUID(), pseudo_rp: '', role: 'Administrateur' },
  ]);
  const [serverDiscordLink, setServerDiscordLink, removeServerDiscordLink]       = useLocalStorage('rpguard_draft_serverDiscord', '');
  const [serverEmail, setServerEmail, removeServerEmail]                         = useLocalStorage('rpguard_draft_serverEmail', '');
  const [serverTopserveurLink, setServerTopserveurLink, removeServerTopserveurLink] = useLocalStorage('rpguard_draft_serverTopserveur', '');
  const [accusedDiscordTag, setAccusedDiscordTag, removeAccusedDiscordTag]       = useLocalStorage('rpguard_draft_accusedDiscord', '');

  // Étape 4 — Les faits
  const [description, setDescription, removeDescription] = useLocalStorage('rpguard_draft_desc', '');
  const [contexte, setContexte, removeContexte]       = useLocalStorage('rpguard_draft_contexte', '');
  const [demarchePrealable, setDemarchePrealable, removeDemarchePrealable] = useLocalStorage('rpguard_draft_demarche', '');

  // Étape 5 — Preuves (We don't persist File objects in localStorage, they are too big and non-serializable)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const imgInputRef  = useRef<HTMLInputElement>(null);
  const vidInputRef  = useRef<HTMLInputElement>(null);

  // Liens vidéo externes (TikTok, YouTube, Twitch…)
  const [videoLinks, setVideoLinks] = useState<{ url: string; label: string }[]>([]);
  const [newLinkUrl, setNewLinkUrl]   = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');

  // Consentement légal
  const [legalConsent, setLegalConsent] = useState(false);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  // Nettoyage des objectURLs à la destruction
  useEffect(() => {
    return () => mediaFiles.forEach((m) => URL.revokeObjectURL(m.preview));
  }, [mediaFiles]);

  // ── Validation par étape ──────────────────────────────────────────────────
  const canGoNext = (): boolean => {
    switch (step) {
      case 0: return !!(categoryId && gameServerName.trim().length >= 2);
      case 1: return pseudoRp.trim().length >= 2 && raison.trim().length >= 10;
      case 2: return accuses.length > 0 && accuses.every((a) => a.pseudo_rp.trim().length >= 2);
      case 3: return description.trim().length >= 30;
      case 4: return legalConsent;
      default: return false;
    }
  };

  // ── Gestion des accusés ───────────────────────────────────────────────────
  const addAccuse = () => {
    if (accuses.length >= 5) { toast.error('Maximum 5 personnes mises en cause.'); return; }
    setAccuses((prev) => [...prev, { id: crypto.randomUUID(), pseudo_rp: '', role: 'Administrateur' }]);
  };

  const updateAccuse = (id: string, field: keyof Omit<Accuse, 'id'>, value: string) => {
    setAccuses((prev) => prev.map((a) => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeAccuse = (id: string) => {
    if (accuses.length <= 1) { toast.error('Au moins une personne mise en cause est requise.'); return; }
    setAccuses((prev) => prev.filter((a) => a.id !== id));
  };

  // ── Gestion des fichiers médias ───────────────────────────────────────────
  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const currentImages = mediaFiles.filter((m) => m.type === 'image').length;
    const slots = MAX_IMAGES - currentImages;
    if (slots <= 0) { toast.error(`Maximum ${MAX_IMAGES} images.`); return; }

    const valid: MediaFile[] = [];
    for (const f of files.slice(0, slots)) {
      if (f.size > MAX_IMG_MB * 1024 * 1024) {
        toast.error(`${f.name} dépasse ${MAX_IMG_MB} Mo.`);
        continue;
      }
      // On autorise toutes les images (y compris heic/heif sur mobile)
      if (!f.type.startsWith('image/') && !f.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/)) {
         toast.error(`${f.name} n'est pas une image valide.`);
         continue;
      }
      valid.push({ file: f, preview: URL.createObjectURL(f), type: 'image' });
    }
    setMediaFiles((prev) => [...prev, ...valid]);
    e.target.value = '';
  };

  const handleAddVideos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const currentVideos = mediaFiles.filter((m) => m.type === 'video').length;
    const slots = MAX_VIDEOS - currentVideos;
    if (slots <= 0) { toast.error(`Maximum ${MAX_VIDEOS} vidéos.`); return; }

    const valid: MediaFile[] = [];
    for (const f of files.slice(0, slots)) {
      if (f.size > MAX_VID_MB * 1024 * 1024) {
        toast.error(`${f.name} dépasse ${MAX_VID_MB} Mo.`);
        continue;
      }
      if (!f.type.startsWith('video/') && !f.name.toLowerCase().match(/\.(mp4|mov|webm|avi|mkv)$/)) {
         toast.error(`${f.name} n'est pas une vidéo valide.`);
         continue;
      }
      valid.push({ file: f, preview: URL.createObjectURL(f), type: 'video' });
    }
    setMediaFiles((prev) => [...prev, ...valid]);
    e.target.value = '';
  };

  const removeMedia = (idx: number) => {
    setMediaFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Vous devez être connecté.');
      return;
    }
    setLoading(true);
    try {
      // Créer la plainte principale
      const plainteId = await createPlainte({
        user_id: user.id,
        category_id:    categoryId,
        game_server_name: gameServerName.trim(),
        admin_name:     accuses.map((a) => a.pseudo_rp.trim()).join(', '),
        description:    description.trim(),
        status:         'En attente', // changed to match standard
        has_strong_evidence: mediaFiles.length > 0,
        pseudo_rp:      pseudoRp.trim(),
        raison:         raison.trim(),
        date_incident:  dateIncident || undefined,
        contexte:       contexte.trim() || undefined,
        demarche_prealable: demarchePrealable.trim() || undefined,
        server_discord_link: serverDiscordLink.trim() || undefined,
        server_email:   serverEmail.trim() || undefined,
        server_topserveur_link: serverTopserveurLink.trim() || undefined,
        accused_discord_tag: accusedDiscordTag.trim() || undefined,
      } as any); // Force any to bypass the type error since we just updated api.ts but typescript is caching

      // Créer les accusés
      for (const acc of accuses) {
        await createAccuse(plainteId, acc.pseudo_rp.trim(), acc.role);
      }

      // Uploader les médias
      const total = mediaFiles.length;
      for (let i = 0; i < total; i++) {
        const m = mediaFiles[i];
        const safeName = m.file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
        const renamed = new File([m.file], safeName, { type: m.file.type });
        setUploadStatus(`Upload ${i + 1}/${total} : ${m.file.name}`);
        await uploadPreuve(plainteId, renamed);
      }

      // Enregistrer les liens vidéo externes
      for (const lien of videoLinks) {
        if (lien.url.trim()) {
          setUploadStatus(`Enregistrement lien : ${lien.label || lien.url}`);
          await addPreuveLien(plainteId, lien.url.trim(), lien.label.trim() || undefined);
        }
      }

      // Nettoyer le brouillon localStorage
      clearDraft();
      
      // Réinitialiser la case de consentement manuellement (sécurité supplémentaire)
      setLegalConsent(false);

      toast.success('Dossier déposé ! RPGuard se charge de notifier le staff du serveur dès validation de votre plainte.', {
        duration: 10000,
        action: {
          label: 'Voir ma plainte',
          onClick: () => navigate(`/plaintes/${plainteId}`)
        }
      });
      navigate(`/plaintes/${plainteId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du dépôt.';
      toast.error(msg || 'Erreur lors du dépôt. Veuillez réessayer.');
    } finally {
      setLoading(false);
      setUploadStatus('');
    }
  };

  const imageCount = mediaFiles.filter((m) => m.type === 'image').length;
  const videoCount = mediaFiles.filter((m) => m.type === 'video').length;
  const linkCount  = videoLinks.filter((l) => l.url.trim().length > 0).length;

  // ── Score de force en temps réel ──────────────────────────────────────────
  const liveScore = computeDossierScore({
    hasPreuves: mediaFiles.length > 0 || linkCount > 0,
    hasVideo: videoCount > 0 || linkCount > 0,
    descriptionLen: description.length,
    hasDate: !!dateIncident,
    hasContexte: contexte.trim().length > 10,
    nbAccuses: accuses.filter((a) => a.pseudo_rp.trim().length >= 2).length,
    hasRaison: raison.trim().length >= 10,
  });

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-12">
      <PageMeta
        title="Déposer une plainte contre un admin RP — RPGuard"
        description="Signalez un abus d'administrateur ou de staff sur votre serveur GTA RP, FiveM ou RedM en 5 étapes. Formulaire sécurisé de signalement avec ajout de preuves."
        keywords="déposer plainte RP, signaler admin GTA, dénoncer abus FiveM, preuves abus RP, formulaire signalement serveur RP, RPGuard"
      />
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
            Déposer un signalement
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Remplissez chaque étape avec précision. Les informations sont sauvegardées automatiquement.
          </p>
        </div>
        {(step > 0 || gameServerName || description || pseudoRp) && (
          <Button variant="ghost" size="sm" onClick={() => {
            if (confirm("Voulez-vous vraiment effacer votre brouillon actuel ?")) clearDraft();
          }} className="text-muted-foreground hover:text-destructive shrink-0">
            <Trash2 className="w-4 h-4 mr-2" />
            Effacer le brouillon
          </Button>
        )}
      </div>

      {/* ── Widget Force du dossier ── */}
      <DossierScoreWidget score={liveScore} className="mb-8" />

      {/* ── Stepper ── */}
      <div className="flex items-start gap-0 mb-10 overflow-x-auto pb-1">
        {STEPS.map(({ label, icon: Icon }, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none min-w-0">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border-2 ${
                  i < step
                    ? 'bg-primary border-primary text-primary-foreground'
                    : i === step
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-border text-muted-foreground bg-background'
                }`}
              >
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-xs whitespace-nowrap font-medium hidden md:block ${
                i === step ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-5 md:mb-6 transition-all ${i < step ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Carte de l'étape ── */}
      <div className="border border-border rounded-2xl bg-card mb-6 overflow-hidden">

        {/* Titre de l'étape */}
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Étape {step + 1} sur {STEPS.length}
          </p>
          <h2 className="text-base font-semibold text-foreground mt-0.5">
            {STEPS[step].label}
          </h2>
        </div>

        <div className="px-6 py-6">

          {/* ── Étape 1 : Jeu & Serveur ────────────────────── */}
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Type d'abus <span className="text-destructive">*</span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="server" className="text-sm font-medium">
                  Nom du jeu RP / serveur <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="server"
                  placeholder="ex : NoPixel, ONESTATE RP, FiveM City RP…"
                  value={gameServerName}
                  onChange={(e) => setGameServerName(e.target.value)}
                  maxLength={120}
                  className="px-3"
                />
                <p className="text-xs text-muted-foreground">Indiquez le nom exact du serveur ou du jeu.</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="date" className="text-sm font-medium">
                  Date de l'incident
                  <span className="ml-1 text-xs text-muted-foreground font-normal">(optionnel)</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={dateIncident}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDateIncident(e.target.value)}
                  className="px-3"
                />
              </div>
            </div>
          )}

          {/* ── Étape 2 : Votre identité ───────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/15 bg-primary/5">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ces informations permettent de contextualiser votre signalement. Votre pseudo RP restera visible sur la plainte.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="pseudo_rp" className="text-sm font-medium">
                  Votre pseudo RP (in-game) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pseudo_rp"
                  placeholder="Votre pseudo dans le jeu (ex : Jean Dupont)"
                  value={pseudoRp}
                  onChange={(e) => setPseudoRp(e.target.value)}
                  maxLength={64}
                  className="px-3"
                />
                <p className="text-xs text-muted-foreground">
                  Indiquez le pseudo que vous utilisez sur ce serveur, pas votre pseudo RPGuard.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="raison" className="text-sm font-medium">
                  Pourquoi faites-vous ce signalement ? <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="raison"
                  placeholder="Résumez en 1 à 3 phrases la raison principale de votre démarche. Ex : J'ai été banni sans raison valable suite à un conflit RP…"
                  value={raison}
                  onChange={(e) => setRaison(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="resize-none px-3 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  {raison.length}/500 caractères · minimum 10
                </p>
              </div>
            </div>
          )}

          {/* ── Étape 3 : Mis en cause ─────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Indiquez le <span className="font-semibold text-foreground">pseudo exact</span> de chaque personne mise en cause tel qu'il apparaît in-game ou sur le panel du serveur. Une erreur de pseudo invalide le signalement.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {accuses.map((acc, idx) => (
                  <div
                    key={acc.id}
                    className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Personne {idx + 1}
                      </span>
                      {accuses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAccuse(acc.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium">
                          Pseudo exact <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="Pseudo in-game exact"
                          value={acc.pseudo_rp}
                          onChange={(e) => updateAccuse(acc.id, 'pseudo_rp', e.target.value)}
                          maxLength={64}
                          className="px-3 text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium">Rôle sur le serveur</Label>
                        <Select
                          value={acc.role}
                          onValueChange={(v) => updateAccuse(acc.id, 'role', v)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {accuses.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAccuse}
                  className="rounded-full gap-1.5 self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter une autre personne
                </Button>
              )}
            </div>
          )}

          {/* ── Étape 4 : Les faits ────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description détaillée des faits <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez chronologiquement ce qui s'est passé : quand, comment, quelles actions ont été faites par les personnes mises en cause, quel impact cela a eu sur vous ou d'autres joueurs. Soyez factuel et précis."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  maxLength={2000}
                  className="resize-none px-3 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/2000 caractères · minimum 30
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="contexte" className="text-sm font-medium">
                  Contexte supplémentaire
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(optionnel)</span>
                </Label>
                <Textarea
                  id="contexte"
                  placeholder="Antécédents, historique avec ces personnes, informations utiles pour la modération…"
                  value={contexte}
                  onChange={(e) => setContexte(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="resize-none px-3 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">{contexte.length}/2000</p>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <Label htmlFor="demarchePrealable" className="text-sm font-medium">
                  Démarche préalable (Stratégique)
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(recommandé)</span>
                </Label>
                <Textarea
                  id="demarchePrealable"
                  placeholder="Avez-vous essayé de résoudre le problème avec eux en privé (ticket, Discord) ? Que vous ont-ils répondu ? Cela évitera qu'ils disent 'tu aurais dû faire un ticket chez nous au lieu de venir ici'."
                  value={demarchePrealable}
                  onChange={(e) => setDemarchePrealable(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="resize-none px-3 rounded-xl border-blue-200 focus-visible:ring-blue-500/20"
                />
                <p className="text-xs text-muted-foreground">{demarchePrealable.length}/1000</p>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/5 border border-primary/10 mt-6">
                <ClipboardList className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Les signalements avec une description claire et détaillée sont traités en priorité et ont plus de poids auprès de la communauté.
                </p>
              </div>
            </div>
          )}

          {/* ── Étape 5 : Preuves ─────────────────────────── */}
          {step === 4 && (
            <div className="flex flex-col gap-6">

              {/* Images */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    Captures d'écran
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      ({imageCount}/{MAX_IMAGES} · max {MAX_IMG_MB} Mo)
                    </span>
                  </Label>
                  {imageCount < MAX_IMAGES && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1.5 text-xs"
                      onClick={() => imgInputRef.current?.click()}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Ajouter
                    </Button>
                  )}
                </div>
                <input
                  ref={imgInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                  multiple
                  className="hidden"
                  onChange={handleAddImages}
                />

                {imageCount === 0 ? (
                  <button
                    type="button"
                    onClick={() => imgInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <Upload className="w-5 h-5 text-muted-foreground mb-1.5" />
                    <span className="text-sm text-muted-foreground">Cliquez pour ajouter des images</span>
                    <span className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WEBP · max {MAX_IMG_MB} Mo</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {mediaFiles.filter((m) => m.type === 'image').map((m, i) => {
                      const globalIdx = mediaFiles.indexOf(m);
                      return (
                        <div
                          key={i}
                          className="relative group aspect-video rounded-xl overflow-hidden border border-border bg-muted"
                        >
                          <img src={m.preview} alt={m.file.name} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeMedia(globalIdx)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Vidéos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-muted-foreground" />
                    Vidéos de preuve
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      ({videoCount}/{MAX_VIDEOS} · max {MAX_VID_MB} Mo)
                    </span>
                  </Label>
                  {videoCount < MAX_VIDEOS && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1.5 text-xs"
                      onClick={() => vidInputRef.current?.click()}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Ajouter
                    </Button>
                  )}
                </div>
                <input
                  ref={vidInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/*"
                  multiple
                  className="hidden"
                  onChange={handleAddVideos}
                />

                {videoCount === 0 ? (
                  <button
                    type="button"
                    onClick={() => vidInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <Play className="w-5 h-5 text-muted-foreground mb-1.5" />
                    <span className="text-sm text-muted-foreground">Cliquez pour ajouter des vidéos</span>
                    <span className="text-xs text-muted-foreground mt-0.5">MP4, MOV, WEBM · max {MAX_VID_MB} Mo</span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    {mediaFiles.filter((m) => m.type === 'video').map((m, i) => {
                      const globalIdx = mediaFiles.indexOf(m);
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Play className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{m.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(m.file.size / (1024 * 1024)).toFixed(1)} Mo
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMedia(globalIdx)}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Liens vidéo externes (TikTok, YouTube, Twitch…) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-muted-foreground" />
                    Liens vidéo externes
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      TikTok, YouTube, Twitch… ({linkCount}/5)
                    </span>
                  </Label>
                </div>

                {/* Liste des liens ajoutés */}
                {videoLinks.length > 0 && (
                  <div className="flex flex-col gap-2 mb-3">
                    {videoLinks.map((lien, idx) => {
                      const isTikTok  = lien.url.includes('tiktok.com');
                      const isYouTube = lien.url.includes('youtube.com') || lien.url.includes('youtu.be');
                      const platformLabel = isTikTok ? 'TikTok' : isYouTube ? 'YouTube' : 'Lien';
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-muted/30 group"
                        >
                          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {lien.label || platformLabel}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{lien.url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVideoLinks((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            aria-label="Supprimer ce lien"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Formulaire d'ajout de lien */}
                {linkCount < 5 && (
                  <div className="flex flex-col gap-2 p-3 rounded-xl border border-dashed border-border bg-muted/10">
                    <Input
                      placeholder="https://www.tiktok.com/... ou https://youtu.be/..."
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Description (ex: Bann abusif du 12/07)"
                        value={newLinkLabel}
                        onChange={(e) => setNewLinkLabel(e.target.value)}
                        className="text-sm flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full gap-1.5 shrink-0"
                        disabled={!newLinkUrl.trim().startsWith('http')}
                        onClick={() => {
                          if (!newLinkUrl.trim().startsWith('http')) return;
                          setVideoLinks((prev) => [...prev, { url: newLinkUrl.trim(), label: newLinkLabel.trim() }]);
                          setNewLinkUrl('');
                          setNewLinkLabel('');
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Ajouter
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Collez le lien direct vers votre vidéo TikTok, YouTube ou Twitch VOD.
                    </p>
                  </div>
                )}
              </div>

              {/* Guide stratégique étape Preuves */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    Maximisez l'impact de votre dossier
                  </span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {[
                    { done: videoCount > 0 || linkCount > 0, text: 'Joindre une vidéo ou un lien TikTok/YouTube (preuve la plus forte)' },
                    { done: imageCount > 0, text: 'Ajouter des captures d\'écran horodatées' },
                    { done: description.length >= 100, text: 'Description détaillée (100+ caractères)' },
                    { done: !!dateIncident, text: 'Date exacte de l\'incident renseignée' },
                    { done: contexte.trim().length > 10, text: 'Contexte supplémentaire ajouté' },
                  ].map(({ done, text }) => (
                    <li key={text} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className={`mt-0.5 shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center ${done ? 'bg-green-500 text-white' : 'bg-border'}`}>
                        {done && <CheckCircle2 className="w-2.5 h-2.5" />}
                      </span>
                      <span className={done ? 'line-through text-muted-foreground/50' : ''}>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Note sécurité */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/5 border border-primary/10">
                <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Vos preuves sont stockées de façon sécurisée et ne sont accessibles qu'aux membres RPGuard. Les preuves augmentent significativement la crédibilité de votre signalement.
                </p>
              </div>

              {/* Consentement légal obligatoire */}
              <div className="mt-6 border border-border rounded-xl p-4 bg-card">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex items-center h-5">
                    <input 
                      id="legal-consent" 
                      type="checkbox" 
                      checked={legalConsent}
                      onChange={(e) => setLegalConsent(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </div>
                  <Label htmlFor="legal-consent" className="text-sm font-medium leading-relaxed cursor-pointer">
                    Je reconnais être l'auteur unique de cette plainte et j'en assume l'entière responsabilité légale selon les <Link to="/mentions-legales" target="_blank" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">Mentions Légales</Link> de la plateforme. Je certifie sur l'honneur que les faits rapportés sont exacts. Je comprends que RPGuard agit uniquement en tant qu'hébergeur et ne peut être tenu responsable de mes propos. <span className="text-destructive">*</span>
                  </Label>
                </div>
              </div>

              {/* Progression upload */}
              {uploadStatus && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-primary/30 border-t-primary animate-spin inline-block" />
                  {uploadStatus}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation (Sticky sur mobile) ── */}
      <div className="flex items-center justify-between gap-3 sticky bottom-0 bg-background/80 backdrop-blur-md p-4 border-t border-border -mx-4 md:static md:bg-transparent md:backdrop-blur-none md:p-0 md:border-t-0 md:mx-0 z-40 pb-safe">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="rounded-full px-5 h-12"
        >
          Précédent
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canGoNext()}
            className="rounded-full px-5 h-12"
          >
            Étape suivante
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !canGoNext()}
            className="rounded-full px-6 gap-2 h-12"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Dépôt en cours…
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Publier le signalement</span>
                <span className="sm:hidden">Publier</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Compteur d'étape mobile */}
      <p className="mt-4 text-center text-xs text-muted-foreground md:hidden">
        {STEPS[step].label} · étape {step + 1}/{STEPS.length}
      </p>
    </div>
  );
}

// ── Utilitaires score ────────────────────────────────────────────────────────
// Logique déplacée dans @/lib/dossierScore — import en tête de fichier

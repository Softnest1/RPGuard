import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield, Eye, EyeOff, Check, X, ChevronRight,
  User, Lock, KeyRound, FileCheck, ArrowLeft,
  Gamepad2, Swords, Users, Zap, UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';
import PageMeta from '@/components/common/PageMeta';
import { getPasswordStrength, compressImage } from '@/lib/utils';
import { supabase } from '@/db/supabase';

// ── Helpers ────────────────────────────────────────────────────────────────

function getUsernameStatus(u: string): { ok: boolean; msg: string } | null {
  if (!u) return null;
  if (u.trim().length < 2)                      return { ok: false, msg: 'Trop court (min. 2 caractères)' };
  if (u.trim().length > 30)                     return { ok: false, msg: 'Trop long (max. 30 caractères)' };
  if (!/^[a-zA-Z0-9_ -]+$/.test(u))             return { ok: false, msg: 'Lettres, chiffres, espaces, tirets et _ uniquement' };
  if (/^\s|\s$/.test(u))                        return { ok: false, msg: 'Pas d\'espace en début ou fin' };
  if (/\s{2,}/.test(u))                         return { ok: false, msg: 'Pas de double espace' };
  return { ok: true, msg: 'Pseudo valide ✓' };
}

// ── Données statiques ──────────────────────────────────────────────────────

export const SECRET_QUESTIONS = [
  'Quel est le nom de votre premier personnage RP ?',
  'Quel est le premier serveur RP sur lequel vous avez joué ?',
  'Quel est le pseudo de votre meilleur ami en jeu ?',
  'Quelle est votre voiture préférée dans GTA RP ?',
  'Quel est le nom de votre gang ou organisation RP favoris ?',
];

const STEPS = [
  { id: 1, icon: User,      title: 'Pseudo & Sécurité',   subtitle: 'Vos identifiants de connexion anonymes' },
  { id: 2, icon: KeyRound,  title: 'Récupération',        subtitle: 'Sécurisez l\'accès à votre compte' },
  { id: 3, icon: FileCheck, title: 'Votre Profil',        subtitle: 'Personnalisez votre apparence publique' },
];

// Statistiques affichées dans le panneau latéral
const SIDE_STATS = [
  { icon: Users,   val: '2 800+', lbl: 'Membres inscrits'      },
  { icon: Swords,  val: '1 400+', lbl: 'Plaintes déposées'     },
  { icon: Zap,     val: '98 %',   lbl: 'Taux de satisfaction'  },
];

// Règles de validation mot de passe affichées en temps réel
const PWD_RULES = [
  { test: (p: string) => p.length >= 8,            label: '8 caractères minimum' },
  { test: (p: string) => /[A-Z]/.test(p),          label: 'Une lettre majuscule' },
  { test: (p: string) => /[0-9]/.test(p),          label: 'Un chiffre' },
  { test: (p: string) => /[^a-zA-Z0-9]/.test(p),  label: 'Un symbole spécial' },
];

// ── Composant principal ────────────────────────────────────────────────────

export default function InscriptionPage() {
  const { signUpWithUsername } = useAuth();
  const navigate = useNavigate();

  // ── État formulaire ───────────────────────────────────────────────────────
  const [step,           setStep]           = useState(0);
  const [username,       setUsername]       = useState('');
  const [password,       setPassword]       = useState('');
  const [confirm,        setConfirm]        = useState('');
  const [showPassword,   setShowPassword]   = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [secretQuestion, setSecretQuestion] = useState('');
  const [secretAnswer,   setSecretAnswer]   = useState('');
  const [acceptTerms,    setAcceptTerms]    = useState(false);
  const [acceptAge,      setAcceptAge]      = useState(false);
  const [loading,        setLoading]        = useState(false);
  
  // Étape 3: Profil
  const [pseudoRP,       setPseudoRP]       = useState('');
  const [bio,            setBio]            = useState('');
  const [avatarFile,     setAvatarFile]     = useState<File | null>(null);
  const [avatarPreview,  setAvatarPreview]  = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [animDir,        setAnimDir]        = useState<'fwd' | 'bck'>('fwd');
  const [animating,      setAnimating]      = useState(false);

  // Refs pour auto-focus
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const answerRef   = useRef<HTMLInputElement>(null);
  const pseudoRPRef = useRef<HTMLInputElement>(null);

  // ── Dérivés ───────────────────────────────────────────────────────────────
  const usernameStatus = getUsernameStatus(username);
  const pwdStrength    = getPasswordStrength(password);
  const pwdMatch       = confirm.length > 0 && password === confirm;
  const pwdMismatch    = confirm.length > 0 && password !== confirm;

  // ── Auto-focus par étape ──────────────────────────────────────────────────
  useEffect(() => {
    const refs = [usernameRef, answerRef, pseudoRPRef, null];
    const timer = setTimeout(() => refs[step]?.current?.focus(), 280);
    return () => clearTimeout(timer);
  }, [step]);

  // ── Gestion Avatar (Compression basique côté client & Preview) ────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      if (!originalFile.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner une image valide.");
        return;
      }
      
      const toastId = toast.loading("Traitement de l'image...");
      
      // Compression automatique si > 1MB
      const { file, compressed } = await compressImage(originalFile, 1);
      
      toast.dismiss(toastId);
      
      if (compressed) {
        const sizeKB = (file.size / 1024).toFixed(0);
        toast.success(`Image optimisée automatiquement (${sizeKB} KB).`);
      }
      
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // ── Validation par étape ──────────────────────────────────────────────────
  const canNext = (): boolean => {
    if (step === 0) return usernameStatus?.ok === true && pwdStrength.score >= 2 && pwdMatch;
    if (step === 1) return secretQuestion !== '' && secretAnswer.trim().length >= 2 && acceptTerms && acceptAge;
    if (step === 2) return true; // L'étape 3 est facultative, on peut toujours cliquer sur "Terminer"
    return false;
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigate_step = (dir: 'fwd' | 'bck') => {
    setAnimDir(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => (dir === 'fwd' ? s + 1 : s - 1));
      setAnimating(false);
    }, 180);
  };

  // ── Soumission Supabase Auth ───────────────────────────────────────────────
  const handleSubmitAuth = async () => {
    if (!canNext() || loading) return;
    setLoading(true);
    
    const toastId = toast.loading('Création et sécurisation de votre compte en cours...');

    const { error } = await signUpWithUsername(username.trim(), password, {
      security_question: secretQuestion,
      security_answer:   secretAnswer.trim().toLowerCase(),
    });

    if (error) {
      setLoading(false);
      toast.dismiss(toastId);
      const msg = error.message ?? '';
      if (msg.includes('already registered') || msg.includes('already-in-use')) {
        setStep(0);
        toast.error('Ce pseudo est déjà pris. Choisissez-en un autre.');
      } else if (msg.includes('weak-password') || msg.includes('Password should')) {
        setStep(0);
        toast.error('Mot de passe trop faible. Utilisez au moins 8 caractères.');
      } else {
        toast.error(`Erreur d'inscription : ${msg}`);
      }
    } else {
      toast.success(`Compte sécurisé ! Plus qu'une étape.`, { id: toastId });
      setLoading(false);
      navigate_step('fwd'); // Passe à l'étape 3 (Profil)
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    const toastId = toast.loading('Configuration de votre profil...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non trouvé");

      let finalAvatarUrl = null;

      // 1. Upload Avatar si présent
      if (avatarFile) {
        setUploadProgress(10);
        const fileExt = avatarFile.name.split('.').pop() || 'webp';
        // fileName: only letters and numbers (and dot) for safety
        const safeUserId = user.id.replace(/-/g, '');
        const fileName = `${safeUserId}${Date.now()}.${fileExt}`;
        
        // Supabase Storage upload
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error("Erreur upload:", uploadError);
          toast.error("L'image n'a pas pu être sauvegardée, mais on continue.");
        } else {
          setUploadProgress(60);
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          finalAvatarUrl = publicUrlData.publicUrl;
        }
      }

      setUploadProgress(80);

      // 2. Update Profile Table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          pseudo_rp: pseudoRP.trim() || null,
          bio: bio.trim() || null,
          ...(finalAvatarUrl && { avatar_url: finalAvatarUrl })
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setUploadProgress(100);
      toast.success(`Bienvenue sur RPGuard, ${username.trim()} ! 🎮`, { id: toastId });
      navigate('/', { replace: true });

    } catch (error: any) {
      console.error(error);
      toast.error(`Erreur lors de la sauvegarde du profil : ${error.message}`, { id: toastId });
      // Même s'il y a une erreur sur le profil, le compte est créé, on redirige quand même
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canNext()) {
      if (step === 0) navigate_step('fwd');
      else if (step === 1) handleSubmitAuth();
      else if (step === 2) handleFinalSubmit();
    }
  };

  // ── Classes d'animation ───────────────────────────────────────────────────
  const animCls = animating
    ? animDir === 'fwd' ? 'opacity-0 translate-x-3' : 'opacity-0 -translate-x-3'
    : 'opacity-100 translate-x-0';

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden bg-background">
      <PageMeta
        title="Créer un compte — RPGuard"
        description="Rejoignez RPGuard gratuitement en moins d'une minute. Signalez les abus dans les serveurs RP, votez et protégez la communauté."
      />

      {/* ══ PANNEAU GAUCHE — identité & progression ═══════════════════════ */}
      <aside className="hidden md:flex flex-col w-[40%] lg:w-[42%] bg-foreground text-background relative overflow-hidden shrink-0">
        {/* Grille déco subtile */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(hsl(0 0% 100%/.03) 1px,transparent 1px),linear-gradient(90deg,hsl(0 0% 100%/.03) 1px,transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        {/* Cercles déco */}
        <div aria-hidden="true" className="absolute -bottom-28 -right-28 w-80 h-80 rounded-full bg-white/[0.022] border border-white/[0.07]" />
        <div aria-hidden="true" className="absolute -top-14 -left-14 w-60 h-60 rounded-full bg-white/[0.015] border border-white/[0.05]" />

        <div className="relative z-10 flex flex-col h-full p-10 lg:p-14">

          {/* Logo */}
          <Link to="/" className="flex items-center group w-fit mb-auto">
            <span className="font-extrabold text-[24px] tracking-tighter text-white leading-none">
              RP<span className="opacity-50 font-medium">Guard</span>
            </span>
          </Link>

          {/* Progression verticale */}
          <nav className="flex flex-col flex-1 justify-center gap-0 mt-12 mb-12" aria-label="Étapes d'inscription">
            <p className="text-[11px] uppercase tracking-widest text-white/30 font-semibold mb-8">
              Étape {step + 1} / {STEPS.length}
            </p>
            {STEPS.map((s, i) => {
              const Icon   = s.icon;
              const isDone = i < step;
              const isAct  = i === step;
              return (
                <div key={s.id} className="flex gap-4 relative">
                  {/* Connecteur vertical */}
                  {i < STEPS.length - 1 && (
                    <div className="absolute left-[15px] top-8 w-px h-[calc(100%-8px)]">
                      <div className={`h-full transition-colors duration-500 ${isDone ? 'bg-white/35' : 'bg-white/10'}`} />
                    </div>
                  )}
                  {/* Icône */}
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isDone  ? 'bg-white border-white'
                    : isAct ? 'border-white/70 bg-white/10'
                            : 'border-white/18 bg-transparent'
                  }`}>
                    {isDone
                      ? <Check className="w-4 h-4 text-foreground" strokeWidth={2.5} />
                      : <Icon className={`w-3.5 h-3.5 ${isAct ? 'text-white' : 'text-white/25'}`} />
                    }
                  </div>
                  {/* Texte */}
                  <div className={`pb-9 transition-opacity duration-300 ${isAct ? 'opacity-100' : isDone ? 'opacity-45' : 'opacity-20'}`}>
                    <p className="text-sm font-semibold leading-none mb-1">{s.title}</p>
                    {isAct && <p className="text-xs text-white/55 leading-snug mt-1">{s.subtitle}</p>}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Stats communauté */}
          <div className="border-t border-white/8 pt-8">
            <div className="flex items-center gap-2 mb-5">
              <Gamepad2 className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[11px] uppercase tracking-widest text-white/30 font-semibold">Communauté</span>
            </div>
            <div className="flex flex-col gap-4">
              {SIDE_STATS.map(({ icon: Icon, val, lbl }) => (
                <div key={lbl} className="flex items-center gap-3">
                  <Icon className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <span className="text-sm font-semibold text-white/75 tabular-nums w-14 shrink-0">{val}</span>
                  <span className="text-xs text-white/35">{lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ══ PANNEAU DROIT — formulaire ════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-h-screen md:min-h-0 overflow-y-auto">

        {/* Header mobile */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border md:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-background" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm">RPGuard</span>
          </Link>
          {/* Progression dots mobile */}
          <div className="flex items-center gap-1.5" aria-label={`Étape ${step + 1} sur ${STEPS.length}`}>
            {STEPS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${
                i <= step ? 'w-5 h-1.5 bg-foreground' : 'w-1.5 h-1.5 bg-border'
              }`} />
            ))}
          </div>
        </div>

        {/* Contenu centré */}
        <div className="flex-1 flex flex-col justify-center px-5 md:px-14 lg:px-20 py-10 md:py-0 max-w-[500px] mx-auto w-full">

          {/* ── En-tête étape ─────────────────────────────────────────── */}
          <div className={`mb-8 transition-all duration-200 ${animCls}`}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-2">
              {step + 1} / {STEPS.length}
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-1.5 text-balance">
              {STEPS[step].title}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {STEPS[step].subtitle}
            </p>
          </div>

          {/* ── Corps de l'étape ──────────────────────────────────────── */}
          <div className={`transition-all duration-200 ${animCls}`}>

            {/* ══ ÉTAPE 1 : Pseudo & Mot de Passe ══════════════════════════════════════ */}
            {step === 0 && (
              <div className="flex flex-col gap-6">
                
                {/* 1. Pseudo */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="inp-username" className="text-sm font-medium text-foreground">
                    Pseudo RP
                  </label>
                  <div className="relative">
                    <Input
                      id="inp-username"
                      ref={usernameRef}
                      type="text"
                      placeholder="ex : Savyon Fletch"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="words"
                      spellCheck={false}
                      className={`pr-9 text-base transition-colors ${
                        usernameStatus?.ok === true  ? 'border-green-400 focus-visible:ring-green-200 dark:focus-visible:ring-green-900' :
                        usernameStatus?.ok === false ? 'border-red-400 focus-visible:ring-red-200 dark:focus-visible:ring-red-900' : ''
                      }`}
                    />
                    {usernameStatus && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
                        {usernameStatus.ok
                          ? <Check className="w-4 h-4 text-green-500" />
                          : <X    className="w-4 h-4 text-red-400" />}
                      </span>
                    )}
                  </div>
                  {usernameStatus ? (
                    <p className={`text-xs flex items-center gap-1.5 ${usernameStatus.ok ? 'text-green-600' : 'text-red-500'}`}>
                      {usernameStatus.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {usernameStatus.msg}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Votre pseudo exact · espaces autorisés</p>
                  )}
                </div>

                <div className="h-px bg-border/50 w-full" />

                {/* 2. Mot de passe */}
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="inp-password" className="text-sm font-medium text-foreground">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Input
                        id="inp-password"
                        ref={passwordRef}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimum 8 caractères"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="new-password"
                        className="pr-10 text-base"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {password.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
                          {[1,2,3,4,5].map((i) => (
                            <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${
                              i <= pwdStrength.score ? pwdStrength.color : 'bg-border'
                            }`} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="inp-confirm" className="text-sm font-medium text-foreground">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <Input
                        id="inp-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="new-password"
                        className={`pr-10 text-base transition-colors ${
                          pwdMatch    ? 'border-green-400' :
                          pwdMismatch ? 'border-red-400' : ''
                        }`}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {pwdMatch    && <p className="text-xs text-green-600 flex items-center gap-1.5"><Check className="w-3 h-3" />Les mots de passe correspondent</p>}
                    {pwdMismatch && <p className="text-xs text-red-500  flex items-center gap-1.5"><X     className="w-3 h-3" />Les mots de passe ne correspondent pas</p>}
                  </div>
                </div>

              </div>
            )}

            {/* ══ ÉTAPE 2 : Question secrète & Finalisation ════════════════════════════ */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/10">
                  <KeyRound className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Cette question vous permet de récupérer votre compte en cas d'oubli du mot de passe.
                    Choisissez une réponse que seul vous connaissez.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">
                    Question secrète
                  </label>
                  <div className="flex flex-col gap-2" role="radiogroup" aria-label="Choisissez votre question secrète">
                    {SECRET_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        role="radio"
                        aria-checked={secretQuestion === q}
                        onClick={() => setSecretQuestion(q)}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm leading-snug transition-all duration-150 ${
                          secretQuestion === q
                            ? 'border-primary bg-primary/5 text-foreground font-medium'
                            : 'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {secretQuestion && (
                  <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-300">
                    <label htmlFor="inp-answer" className="text-sm font-medium text-foreground">
                      Votre réponse
                    </label>
                    <Input
                      id="inp-answer"
                      ref={answerRef}
                      type="text"
                      placeholder="Réponse mémorable…"
                      value={secretAnswer}
                      onChange={(e) => setSecretAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoComplete="off"
                      spellCheck={false}
                      className={`text-base transition-colors ${
                        secretAnswer.trim().length >= 2 ? 'border-green-400' : ''
                      }`}
                    />
                  </div>
                )}

                {/* Acceptations - Placées directement ici pour finir l'inscription */}
                <div className="flex flex-col gap-4 mt-2 pt-5 border-t border-border/50">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox
                      checked={acceptTerms}
                      onCheckedChange={(v) => setAcceptTerms(!!v)}
                      className="mt-0.5 shrink-0"
                      id="chk-terms"
                    />
                    <span className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                      J'accepte les <Link to="/reglement" target="_blank" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">conditions d'utilisation</Link> et les <Link to="/mentions-legales" target="_blank" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">mentions légales</Link> de la plateforme.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox
                      checked={acceptAge}
                      onCheckedChange={(v) => setAcceptAge(!!v)}
                      className="mt-0.5 shrink-0"
                      id="chk-age"
                    />
                    <span className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                      Je certifie avoir au moins 13 ans.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* ══ ÉTAPE 3 : Profil & Avatar ════════════════════════════ */}
            {step === 2 && (
              <div className="flex flex-col gap-6">
                
                {/* 1. Avatar Upload */}
                <div className="flex flex-col items-center gap-4 py-6 px-4 rounded-xl border border-dashed border-border bg-muted/20">
                  <div className="relative group cursor-pointer">
                    <input 
                      type="file" 
                      id="avatar-upload" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarChange}
                      disabled={loading}
                    />
                    <label htmlFor="avatar-upload" className="cursor-pointer block relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center group-hover:border-primary transition-colors">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Aperçu avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <UploadCloud className="w-6 h-6 text-white" />
                      </div>
                    </label>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Photo de profil</p>
                    <p className="text-xs text-muted-foreground mt-1">Image compressée auto. (max 1 MB)</p>
                  </div>
                </div>

                {/* 2. Nom de personnage RP */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="inp-pseudo-rp" className="text-sm font-medium text-foreground">
                    Personnage Principal (Optionnel)
                  </label>
                  <Input
                    id="inp-pseudo-rp"
                    ref={pseudoRPRef}
                    type="text"
                    placeholder="ex : John Doe"
                    value={pseudoRP}
                    onChange={(e) => setPseudoRP(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    className="text-base"
                  />
                  <p className="text-xs text-muted-foreground">Le nom de votre personnage le plus connu.</p>
                </div>

                {/* 3. Bio */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="inp-bio" className="text-sm font-medium text-foreground">
                    Petite biographie (Optionnelle)
                  </label>
                  <Textarea
                    id="inp-bio"
                    placeholder="Je joue sur des serveurs whitelist depuis 3 ans..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={loading}
                    className="resize-none h-24 text-base"
                  />
                </div>

                {/* Progress bar upload */}
                {loading && uploadProgress > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Sauvegarde en cours...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Boutons de navigation ─────────────────────────────────────── */}
          <div className="flex items-center gap-3 mt-8">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate_step('bck')}
                disabled={loading}
                className="gap-1.5 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
            )}

            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => navigate_step('fwd')}
                disabled={!canNext()}
                className="flex-1 gap-1.5 rounded-xl h-11 font-semibold"
              >
                Continuer
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading || !canNext()}
                className="flex-1 rounded-xl h-11 font-semibold gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" aria-hidden="true" />
                    Sauvegarde…
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Terminer et Rejoindre
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Lien connexion */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà membre ?{' '}
            <Link
              to="/connexion"
              className="text-foreground font-semibold underline underline-offset-4 hover:text-primary transition-colors"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}



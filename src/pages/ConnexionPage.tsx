import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield, Eye, EyeOff, LogIn, ArrowRight,
  Users, Swords, Zap, KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import PageMeta from '@/components/common/PageMeta';
import { fetchStatsQuick } from '@/lib/api';

export default function ConnexionPage() {
  const { signInWithUsername } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  // Récupère l'URL d'origine passée par RequireAuth (state.from), défaut : tableau de bord
  const from = (location.state as { from?: string } | null)?.from ?? '/tableau-de-bord';

  const [username,     setUsername]     = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [attempts,     setAttempts]     = useState(0);

  // Stats réelles depuis Supabase
  const [liveStats, setLiveStats] = useState<{ users: number; total: number } | null>(null);
  useEffect(() => {
    fetchStatsQuick().then((s) => setLiveStats({ users: s.users, total: s.total })).catch(() => {});
  }, []);

  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { usernameRef.current?.focus(); }, []);

  const canSubmit = username.trim().length >= 3 && password.length >= 1;

  // ── Soumission Supabase Auth ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    // Validation basique du pseudo (autorise lettres, chiffres, espaces, tirets et underscores)
    if (!/^[a-zA-Z0-9_ -]+$/.test(username.trim())) {
      setErrorMsg("Pseudo invalide (lettres, chiffres, espaces, tirets et _ uniquement).");
      return;
    }

    setErrorMsg('');
    setLoading(true);

    const toastId = toast.loading('Connexion en cours...');
    const { error } = await signInWithUsername(username.trim(), password);
    setLoading(false);

    if (error) {
      toast.dismiss(toastId);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 4) {
        toast.error('Trop de tentatives échouées. Redirection vers la récupération de mot de passe.');
        setAttempts(0); // Reset the attempts so the user isn't permanently locked out if they come back
        navigate('/mot-de-passe-oublie');
      } else {
        setErrorMsg('Pseudo ou mot de passe incorrect. Vérifiez vos identifiants.');
      }
    } else {
      toast.success(`Bon retour, ${username.trim()} ! 👋`, { id: toastId });
      // Retour à la page demandée (ou tableau de bord par défaut)
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background overflow-x-hidden">
      <PageMeta
        title="Connexion — RPGuard"
        description="Connectez-vous à votre compte RPGuard pour déposer des plaintes, voter et protéger la communauté RP."
      />

      {/* ══ PANNEAU GAUCHE — décor & statistiques ═══════════════════════ */}
      <aside className="hidden md:flex flex-col w-[40%] lg:w-[42%] bg-foreground text-background relative overflow-hidden shrink-0">
        {/* Grille déco */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(hsl(0 0% 100%/.03) 1px,transparent 1px),linear-gradient(90deg,hsl(0 0% 100%/.03) 1px,transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div aria-hidden="true" className="absolute -bottom-28 -right-28 w-80 h-80 rounded-full bg-white/[0.022] border border-white/[0.07]" />
        <div aria-hidden="true" className="absolute -top-14 -left-14 w-60 h-60 rounded-full bg-white/[0.015] border border-white/[0.05]" />

        <div className="relative z-10 flex flex-col h-full p-10 lg:p-14">
          {/* Logo */}
          <Link to="/" className="flex items-center group w-fit mb-auto">
            <span className="font-extrabold text-[24px] tracking-tighter text-white leading-none">
              RP<span className="opacity-50 font-medium">Guard</span>
            </span>
          </Link>

          {/* Accroche */}
          <div className="flex-1 flex flex-col justify-center py-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-5">
              Espace sécurisé
            </p>
            <h2 className="text-2xl lg:text-[1.75rem] font-light leading-[1.35] text-white/88 mb-12 text-balance max-w-[17rem]">
              Bon retour parmi les gardiens de la communauté RP.
            </h2>

            {/* Stats en temps réel */}
            <div className="flex flex-col gap-5">
              {[
                { icon: Users,  val: liveStats ? `${liveStats.users}` : '—', lbl: 'Membres inscrits'  },
                { icon: Swords, val: liveStats ? `${liveStats.total}` : '—', lbl: 'Plaintes déposées' },
                { icon: Zap,    val: '100 %',                                 lbl: 'Gratuit & anonyme' },
              ].map(({ icon: Icon, val, lbl }) => (
                <div key={lbl} className="flex items-center gap-3">
                  <Icon className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <span className="text-sm font-semibold tabular-nums w-14 shrink-0 text-white/75">{val}</span>
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-xs text-white/35 shrink-0">{lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Citation */}
          <p className="text-xs text-white/22 leading-relaxed border-t border-white/8 pt-6 italic">
            "Signaler un abus, c'est protéger les prochains joueurs."
          </p>
        </div>
      </aside>

      {/* ══ PANNEAU DROIT — formulaire ═══════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-h-screen md:min-h-0">

        {/* Header mobile */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border md:hidden">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <Shield className="w-4 h-4 relative z-10" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-[18px] tracking-tighter text-foreground leading-none flex items-center">
              RP<span className="text-primary font-black">Guard</span>
            </span>
          </Link>
          <Link to="/inscription" className="text-xs text-primary font-semibold underline underline-offset-2">
            Créer un compte
          </Link>
        </div>

        {/* Formulaire centré */}
        <div className="flex-1 flex flex-col justify-center px-5 md:px-14 lg:px-20 py-10 md:py-0 max-w-[480px] mx-auto w-full">

          {/* En-tête */}
          <div className="mb-8 md:mb-10">
            <div className="hidden md:flex items-center gap-2 mb-7">
              <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
                <Shield className="w-3 h-3 text-background" strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">RPGuard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
              Connexion
            </h1>
            <p className="text-sm text-muted-foreground">
              Pas encore membre ?{' '}
              <Link
                to="/inscription"
                className="text-foreground font-semibold underline underline-offset-4 hover:text-primary transition-colors"
              >
                Créer un compte gratuit
              </Link>
            </p>
          </div>

          {/* ── Formulaire Supabase Auth ─────────────────────────────────── */}
          <form
            key={attempts}  /* reset l'animation shake à chaque erreur */
            onSubmit={handleSubmit}
            className={`flex flex-col gap-5 ${errorMsg ? 'animate-shake' : ''}`}
            noValidate
          >
            {/* Pseudo */}
            <div className="flex flex-col gap-2">
              <label htmlFor="login-username" className="text-sm font-medium text-foreground">
                Pseudo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono select-none" aria-hidden="true">@</span>
                <Input
                  id="login-username"
                  ref={usernameRef}
                  type="text"
                  placeholder="mon_pseudo_rp"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setErrorMsg(''); }}
                  autoComplete="username"
                  spellCheck={false}
                  className="pl-7 text-base"
                  aria-required="true"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                  Mot de passe
                </label>
                <Link
                  to="/mot-de-passe-oublie"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                  autoComplete="current-password"
                  className="pr-10 text-base"
                  aria-required="true"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Message d'erreur inline */}
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/8 border border-destructive/20" role="alert">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" aria-hidden="true" />
                <p className="text-xs text-destructive leading-relaxed">{errorMsg}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full h-11 rounded-xl font-semibold gap-2 mt-1"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" aria-hidden="true" />
                  Connexion en cours…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Se connecter
                </>
              )}
            </Button>
          </form>

          {/* Séparateur */}
          <div className="flex items-center gap-3 my-6" aria-hidden="true">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* CTA inscription */}
          <Button asChild variant="outline" className="w-full h-11 rounded-xl font-semibold gap-2">
            <Link to="/inscription">
              Créer un compte gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>

          {/* Lien récupération */}
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Compte inaccessible ?{' '}
            <Link
              to="/mot-de-passe-oublie"
              className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              Récupérer via question secrète
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

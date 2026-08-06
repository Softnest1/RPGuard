import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield, Eye, EyeOff, Check, X,
  ArrowLeft, KeyRound, ChevronRight, Lock, MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchSecurityQuestion, verifySecurityAnswer } from '@/lib/api';
import { supabase } from '@/db/supabase';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8)           score++;
  if (pwd.length >= 12)          score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: 'Très faible', color: 'bg-red-400' };
  if (score === 2) return { score, label: 'Faible',      color: 'bg-orange-400' };
  if (score === 3) return { score, label: 'Moyen',       color: 'bg-amber-400' };
  if (score === 4) return { score, label: 'Fort',        color: 'bg-green-400' };
  return                 { score, label: 'Très fort',    color: 'bg-green-500' };
}

// ── Types ─────────────────────────────────────────────────────────────────────

type RecoveryStep = 'username' | 'question' | 'newpassword' | 'support' | 'success';

// ── Composant ─────────────────────────────────────────────────────────────────

export default function MotDePasseOubliePage() {
  const navigate = useNavigate();

  const [step,            setStep]            = useState<RecoveryStep>('username');
  const [username,        setUsername]        = useState('');
  const [userQuestion,    setUserQuestion]    = useState('');
  const [answerInput,     setAnswerInput]     = useState('');
  const [answerError,     setAnswerError]     = useState(false);
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [profileId,       setProfileId]       = useState('');

  const tempPasswordRef = useRef<string>(''); // inutilisé avec Supabase mais conservé pour éviter de refactorer le JSX

  const pwdStrength = getPasswordStrength(newPassword);
  const pwdMatch    = confirmPassword.length > 0 && newPassword === confirmPassword;
  const pwdMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  // ── Étape 1 : retrouver le compte par pseudo ─────────────────────────────

  const handleFindUser = async () => {
    if (!username.trim() || loading) return;
    setLoading(true);
    const toastId = toast.loading('Recherche du compte...');
    const result = await fetchSecurityQuestion(username.trim());
    setLoading(false);
    
    if (!result) {
      toast.error('Aucun compte trouvé avec ce pseudo.', { id: toastId });
      return;
    }
    if (!result.question) {
      toast.error("Ce compte n'a pas de question secrète. Contactez le support.", { id: toastId });
      return;
    }
    toast.dismiss(toastId);
    setProfileId(result.profileId);
    setUserQuestion(result.question);
    setStep('question');
  };

  // ── Étape 2 : vérifier la réponse secrète ────────────────────────────────

  const handleVerifyAnswer = async () => {
    if (!answerInput.trim() || loading) return;
    setLoading(true);
    const toastId = toast.loading('Vérification de la réponse...');
    const valid = await verifySecurityAnswer(profileId, answerInput.trim());
    setLoading(false);
    
    if (!valid) {
      setAnswerError(true);
      toast.error('Réponse incorrecte. Vérifiez votre saisie.', { id: toastId });
      return;
    }
    setAnswerError(false);
    toast.dismiss(toastId);
    tempPasswordRef.current = '';
    setStep('newpassword');
  };

  // ── Étape 3 : mettre à jour le mot de passe via Supabase Edge Function ───
  
  const handleUpdatePassword = async () => {
    if (!pwdMatch || pwdStrength.score < 2 || loading) return;
    setLoading(true);
    const toastId = toast.loading('Mise à jour de votre mot de passe...');

    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: {
          profile_id: profileId,
          username: username.trim(),
          new_password: newPassword,
        },
      });

      if (error) {
        console.error("Erreur edge function HTTP:", error);
        toast.error('Impossible de mettre à jour le mot de passe.', { id: toastId });
        setStep('support');
      } else if (data && data.error) {
        console.error("Erreur logique reset-password:", data.error);
        toast.error(data.error, { id: toastId });
      } else {
        toast.success('Mot de passe mis à jour avec succès.', { id: toastId });
        setStep('success');
      }
    } catch (err) {
      console.error(err);
      toast.error('Une erreur est survenue.', { id: toastId });
      setStep('support');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden bg-background">

      {/* ── PANNEAU GAUCHE ─────────────────────────────────── */}
      <div className="hidden md:flex flex-col w-[42%] bg-foreground text-background relative overflow-hidden shrink-0">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
          aria-hidden="true"
        />
        <div aria-hidden="true" className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/[0.03] border border-white/10" />
        <div aria-hidden="true" className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/[0.02] border border-white/[0.06]" />

        <div className="relative z-10 flex flex-col h-full p-10 lg:p-14">
          <Link to="/" className="flex items-center group w-fit">
            <span className="font-extrabold text-[24px] tracking-tighter text-white leading-none">
              RP<span className="opacity-50 font-medium">Guard</span>
            </span>
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-8">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-light leading-relaxed mb-4 text-balance opacity-90">
              Récupération sécurisée via votre question personnelle.
            </h2>
            <p className="text-sm opacity-40 leading-relaxed">
              Aucune adresse email requise. Votre question secrète suffit à prouver votre identité.
            </p>
          </div>

          {/* Indicateur d'étapes */}
          <div className="flex flex-col gap-3 border-t border-white/10 pt-8">
            {(
              [
                { label: 'Entrez votre pseudo',       active: step === 'username',    done: step !== 'username' },
                { label: 'Répondez à votre question', active: step === 'question',    done: ['newpassword','support','success'].includes(step) },
                { label: 'Nouveau mot de passe',      active: step === 'newpassword', done: ['support','success'].includes(step) },
              ] as const
            ).map(({ label, active, done }) => (
              <div
                key={label}
                className={`flex items-center gap-3 text-sm transition-all ${active ? 'opacity-100' : done ? 'opacity-50' : 'opacity-25'}`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${done ? 'bg-white border-white' : active ? 'border-white/70 bg-white/10' : 'border-white/20'}`}>
                  {done && <Check className="w-3 h-3 text-foreground" strokeWidth={2.5} />}
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PANNEAU DROIT ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen md:min-h-0">

        {/* Header mobile */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 md:hidden border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">RPGuard</span>
          </Link>
          <Link to="/connexion" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Connexion
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 py-10 md:py-0 max-w-lg mx-auto w-full">

          {/* ── Étape 1 : Pseudo ─────────────────────────────── */}
          {step === 'username' && (
            <>
              <div className="mb-8">
                <Link to="/connexion" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-6">
                  <ArrowLeft className="w-3 h-3" /> Retour à la connexion
                </Link>
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-1.5">Mot de passe oublié</h1>
                <p className="text-sm text-muted-foreground">Entrez votre pseudo pour retrouver votre question secrète.</p>
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="recovery-username" className="text-sm font-medium text-foreground">Votre pseudo RPGuard</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono select-none" aria-hidden="true">@</span>
                    <Input
                      id="recovery-username"
                      type="text"
                      placeholder="mon_pseudo_rp"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFindUser()}
                      autoFocus
                      className="pl-7 text-base"
                    />
                  </div>
                </div>
                <Button onClick={handleFindUser} disabled={loading || !username.trim()} className="w-full gap-1.5">
                  {loading
                    ? <><span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />Recherche…</>
                    : <>Trouver mon compte <ChevronRight className="w-4 h-4" /></>}
                </Button>
              </div>
            </>
          )}

          {/* ── Étape 2 : Question secrète ───────────────────── */}
          {step === 'question' && (
            <>
              <div className="mb-8">
                <button onClick={() => setStep('username')} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-6">
                  <ArrowLeft className="w-3 h-3" /> Changer de pseudo
                </button>
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-1.5">Question secrète</h1>
                <p className="text-sm text-muted-foreground">Répondez à la question choisie lors de l'inscription.</p>
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary uppercase shrink-0">
                    {username.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">@{username}</p>
                    <p className="text-xs text-muted-foreground">Compte trouvé</p>
                  </div>
                  <Check className="w-4 h-4 text-green-500 ml-auto shrink-0" />
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-medium">Votre question</p>
                  <p className="text-sm font-medium text-foreground">{userQuestion}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="answer-input" className="text-sm font-medium text-foreground">Votre réponse</label>
                  <div className="relative">
                    <Input
                      id="answer-input"
                      type="text"
                      placeholder="Votre réponse secrète…"
                      value={answerInput}
                      onChange={(e) => { setAnswerInput(e.target.value); setAnswerError(false); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyAnswer()}
                      autoFocus
                      className={`text-base ${answerError ? 'border-red-400' : ''}`}
                    />
                    {answerError && <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />}
                  </div>
                  {answerError && (
                    <p className="text-xs text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> Réponse incorrecte.</p>
                  )}
                  <p className="text-xs text-muted-foreground">La réponse n'est pas sensible à la casse.</p>
                </div>
                <Button onClick={handleVerifyAnswer} disabled={loading || !answerInput.trim()} className="w-full gap-1.5">
                  {loading
                    ? <><span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />Vérification…</>
                    : <>Vérifier ma réponse <ChevronRight className="w-4 h-4" /></>}
                </Button>
              </div>
            </>
          )}

          {/* ── Étape 3 : Nouveau mot de passe ───────────────── */}
          {step === 'newpassword' && (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Identité vérifiée</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-1.5">Nouveau mot de passe</h1>
                <p className="text-sm text-muted-foreground">Choisissez un mot de passe solide pour votre compte.</p>
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="new-password" className="text-sm font-medium text-foreground">Nouveau mot de passe</label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNew ? 'text' : 'password'}
                      placeholder="Minimum 8 caractères"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoFocus
                      className="pr-10 text-base"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showNew ? 'Masquer' : 'Afficher'}>
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex gap-1 h-1">
                        {[1,2,3,4,5].map((i) => (
                          <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= pwdStrength.score ? pwdStrength.color : 'bg-border'}`} />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${pwdStrength.score <= 2 ? 'text-red-500' : pwdStrength.score === 3 ? 'text-amber-600' : 'text-green-600'}`}>
                        {pwdStrength.label}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="confirm-new-password" className="text-sm font-medium text-foreground">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Input
                      id="confirm-new-password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdatePassword()}
                      className={`pr-10 text-base ${pwdMatch ? 'border-green-400' : pwdMismatch ? 'border-red-400' : ''}`}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirm ? 'Masquer' : 'Afficher'}>
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {pwdMatch    && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" />Les mots de passe correspondent</p>}
                  {pwdMismatch && <p className="text-xs text-red-500  flex items-center gap-1"><X     className="w-3 h-3" />Les mots de passe ne correspondent pas</p>}
                </div>
                <Button onClick={handleUpdatePassword} disabled={loading || !pwdMatch || pwdStrength.score < 2} className="w-full gap-1.5">
                  {loading
                    ? <><span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />Mise à jour…</>
                    : <><Lock className="w-4 h-4" /> Enregistrer le nouveau mot de passe</>}
                </Button>
              </div>
            </>
          )}

          {/* ── Écran support (impossible sans Admin SDK) ────── */}
          {step === 'support' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-600 font-medium">Identité vérifiée avec succès</span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground mb-2">Réinitialisation manuelle</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Votre identité a été vérifiée. Pour finaliser la réinitialisation de votre mot de passe,
                  contactez l'administrateur via WhatsApp. Mentionnez votre pseudo <strong>@{username}</strong> et
                  indiquez que vous avez validé votre question secrète.
                </p>
              </div>
              <a
                href="https://wa.me/33667485226?text=Bonjour%2C+je+souhaite+r%C3%A9initialiser+mon+mot+de+passe+RPGuard+%28pseudo+%3A+{username}%29.+J%27ai+valid%C3%A9+ma+question+secr%C3%A8te."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full rounded-md bg-green-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Contacter l'administrateur sur WhatsApp
              </a>
              <Button variant="ghost" onClick={() => navigate('/connexion')} className="w-full">
                Retour à la connexion
              </Button>
            </div>
          )}

          {/* ── Succès ───────────────────────────────────────── */}
          {step === 'success' && (
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                <Check className="w-7 h-7 text-green-500" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground mb-2">Mot de passe mis à jour !</h1>
                <p className="text-sm text-muted-foreground">
                  Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
                </p>
              </div>
              <Button className="w-full max-w-xs" onClick={() => navigate('/connexion')}>
                Se connecter maintenant
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

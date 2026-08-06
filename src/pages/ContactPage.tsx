import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useGoBack } from '@/hooks/use-go-back';
import { DRAFT_KEYS } from '@/lib/drafts';
import {
  Mail, ArrowLeft, Send, CheckCircle, MessageSquare, Trash2,
  ShieldCheck, Loader2, MessageCircle, AlertTriangle, HelpCircle,
  Scale, Clock, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PageMeta from '@/components/common/PageMeta';
import { supabase } from '@/db/supabase';

// ── Variables & Configuration ───────────────────────────────────────────────
const WA_PARTS = ['3', '3', '6', '6', '7', '4', '8', '5', '2', '2', '6'];
const getWaNumber = () => WA_PARTS.join('');

const generateDynamicWaLink = (topic: string, msg: string, contactInfo: string) => {
  const intro = `Bonjour l'équipe RPGuard 👋, j'aurais besoin de votre assistance.\n\n*Sujet* : ${topic}\n*Contact* : ${contactInfo.trim() || 'Non renseigné'}\n\n*Message* :\n${msg.trim()}`;
  return `https://api.whatsapp.com/send?phone=${getWaNumber()}&text=${encodeURIComponent(intro)}`;
};

// Types de demandes
const CONTACT_TOPICS = [
  {
    id:       'Signalement de contenu',
    icon:     ShieldCheck,
    label:    'Signaler un contenu',
    desc:     'Contenu abusif, faux ou illicite à modérer',
    urgent:   false,
    placeholder: 'URL de la plainte concernée, motif du signalement, éléments de preuve disponibles…',
  },
  {
    id:       'Contestation de plainte',
    icon:     AlertTriangle,
    label:    'Contester une plainte',
    desc:     'Vous êtes cité et contestez les faits',
    urgent:   false,
    placeholder: 'URL de la plainte que vous contestez, votre pseudonyme en jeu, éléments prouvant l\'inexactitude…',
  },
  {
    id:       'Suppression de données',
    icon:     Trash2,
    label:    'Suppression de données',
    desc:     'Droit à l\'effacement (RGPD art. 17)',
    urgent:   false,
    placeholder: 'Votre pseudo ou email de compte, données à supprimer, raison de la demande…',
  },
  {
    id:       'Demande légale',
    icon:     Scale,
    label:    'Demande légale',
    desc:     'Mise en demeure, notification LCEN',
    urgent:   true,
    placeholder: 'Nature de la demande légale, référence(s) légale(s) invoquée(s), coordonnées de votre conseil…',
  },
  {
    id:       'Signalement d\'abus RP',
    icon:     MessageSquare,
    label:    'Signaler un abus RP',
    desc:     'Abus subi sur un serveur, besoin d\'aide',
    urgent:   false,
    placeholder: 'Nom du serveur, pseudo de l\'admin concerné, description de l\'abus subi, preuves disponibles…',
  },
  {
    id:       'Question générale',
    icon:     HelpCircle,
    label:    'Question générale',
    desc:     'Tout autre sujet',
    urgent:   false,
    placeholder: 'Votre question ou demande en détail…',
  },
] as const;

type TopicId = typeof CONTACT_TOPICS[number]['id'];

const MAX_MSG_LEN  = 4000;
const MAX_SUBJ_LEN = 200;

export default function ContactPage() {
  const [sent, setSent]         = useState(false);
  const [loading, setLoading]   = useState(false);
  
  // Sauvegarde automatique en mémoire locale (draft auto-save) via notre hook standardisé
  const [email, setEmail, removeEmail]       = useLocalStorage(DRAFT_KEYS.CONTACT_EMAIL, '');
  const [topicId, setTopicId, removeTopicId] = useLocalStorage<TopicId | ''>(DRAFT_KEYS.CONTACT_TOPIC_ID, '');
  const [message, setMessage, removeMessage] = useLocalStorage(DRAFT_KEYS.CONTACT_MESSAGE, '');
  
  const goBack = useGoBack('/');

  const selectedTopic = CONTACT_TOPICS.find(t => t.id === topicId) ?? null;

  const canSubmit = !loading
    && topicId !== ''
    && message.trim().length >= 10
    && message.trim().length <= MAX_MSG_LEN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topicId) {
      toast.error('Veuillez sélectionner un motif de contact.');
      return;
    }
    if (message.trim().length < 10) {
      toast.error('Votre message doit contenir au moins 10 caractères.');
      return;
    }

    if (!canSubmit) return;
    
    setLoading(true);
    try {
      // 1. Enregistrement systématique en base de données
      const { error } = await supabase.from('contact_messages').insert({
        contact_info: email.trim() || null,
        subject: topicId,
        message: message.trim(),
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // 2. Affichage écran de succès et nettoyage du cache local
      setSent(true);
      removeEmail();
      removeTopicId();
      removeMessage();
      toast.success('Votre demande a bien été transmise !');
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSent(false); 
    setEmail(''); 
    setMessage(''); 
    setTopicId('');
    removeEmail();
    removeTopicId();
    removeMessage();
  };

  return (
    <div className="w-full">
      <PageMeta
        title="Nous contacter — RPGuard"
        description="Contactez l'équipe RPGuard pour toute question, signalement d'abus, demande légale ou suppression de données."
      />
      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-14">
          <button
            onClick={() => goBack()}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </button>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Support RPGuard</p>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
                Nous contacter
              </h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Une équipe humaine lit chaque message avec attention. Que ce soit pour un signalement, une question ou une suppression de données, choisissez votre motif et laissez-nous vous aider.
          </p>

          {/* Bandeau délai & sécurité */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/40 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Formulaire : réponse sous 48 h · WhatsApp : souvent le jour même
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/20 bg-green-500/5 text-xs text-green-600 dark:text-green-400">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              100% confidentiel & sécurisé
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenu ───────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-10">

          {/* ── Colonne gauche : sélection du motif ─────────── */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
              Type de demande
            </p>
            {CONTACT_TOPICS.map(({ id, icon: Icon, label, desc, urgent }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setTopicId(id); setMessage(''); }}
                className={[
                  'flex items-start gap-3 px-3 py-3 rounded-xl border text-left transition-all w-full',
                  topicId === id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/40',
                ].join(' ')}
              >
                <div className={[
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                  topicId === id ? 'bg-primary/10' : 'bg-muted',
                ].join(' ')}>
                  <Icon className={`w-3.5 h-3.5 ${topicId === id ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-sm font-medium leading-snug ${topicId === id ? 'text-foreground' : 'text-foreground/80'}`}>
                      {label}
                    </span>
                    {urgent && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shrink-0">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* ── Colonne droite : formulaire + WA ────────────── */}
          <div className="md:col-span-3 flex flex-col gap-5">

            {/* État : envoyé */}
            {sent ? (
              <div className="flex flex-col items-center py-14 text-center gap-5 border border-border rounded-2xl bg-card px-6">
                <div className="w-14 h-14 rounded-full bg-primary/8 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Message envoyé !</h2>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    {email.trim() ? (
                      <>
                        Nous répondrons à <span className="font-medium text-foreground">{email}</span> sous 48 h ouvrées.
                      </>
                    ) : (
                      <>
                        Votre message a bien été transmis. N'ayant pas laissé de moyen de contact, nous ne pourrons pas vous répondre directement.
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                  <Button variant="outline" className="flex-1 min-h-[44px] text-sm" onClick={reset}>
                    Nouvelle demande
                  </Button>
                  {selectedTopic && (
                    <Button asChild className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white border-transparent min-h-[44px] text-sm">
                      <a href={generateDynamicWaLink(topicId, message, email)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-4 h-4 mr-2 shrink-0" />
                        Accélérer via WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* ── Formulaire principal ── */
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-5 border border-border rounded-2xl p-5 md:p-6 bg-card"
                noValidate
              >
                {/* Contact Info */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="contact-info" className="text-sm font-medium">
                      Moyen de contact
                    </Label>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Optionnel</span>
                  </div>
                  <Input
                    id="contact-info"
                    type="text"
                    placeholder="Discord, Pseudo, Email... (Laissez vide pour rester 100% anonyme)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="px-3 h-11"
                    aria-describedby="contact-hint"
                  />
                  <p id="contact-hint" className="text-xs text-muted-foreground">
                    Laissez un moyen de vous recontacter si vous attendez une réponse de notre part.
                  </p>
                </div>

                {/* Sujet affiché en lecture seule si sélectionné */}
                {topicId ? (
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium">Sujet de votre demande</Label>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-muted/30 text-sm text-foreground min-h-[44px]">
                      <span className="flex-1 min-w-0 truncate font-medium">{topicId}</span>
                      <button
                        type="button"
                        onClick={() => setTopicId('')}
                        className="text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0 text-base leading-none"
                        aria-label="Changer le sujet"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-dashed border-border bg-muted/20 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <ArrowLeft className="w-4 h-4 text-primary hidden md:block" />
                      <HelpCircle className="w-4 h-4 text-primary md:hidden" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-0.5">De quoi s'agit-il ?</p>
                      <p className="text-muted-foreground">Sélectionnez le motif de votre demande dans la liste pour afficher le formulaire adapté.</p>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-message" className="text-sm font-medium">
                    Message <span className="text-destructive" aria-hidden>*</span>
                  </Label>
                  <Textarea
                    id="contact-message"
                    placeholder={selectedTopic?.placeholder ?? 'Décrivez votre demande en détail…'}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    required
                    className="resize-none px-3 py-3 text-sm leading-relaxed"
                    aria-describedby="message-count"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {message.trim().length < 10 && message.length > 0
                        ? <span className="text-amber-600 dark:text-amber-400 font-medium">Un peu court... (10 caractères min)</span>
                        : 'Prenez le temps d\'expliquer votre situation.'}
                    </p>
                    <p
                      id="message-count"
                      className={`text-xs tabular-nums ${message.length > MAX_MSG_LEN * 0.9 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}
                    >
                      {message.length} / {MAX_MSG_LEN}
                    </p>
                  </div>
                </div>

                {/* Aide contextuelle */}
                {topicId === 'Signalement d\'abus RP' && (
                  <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/20 text-xs text-muted-foreground">
                    <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>
                      Conseil : consultez le{' '}
                      <Link to="/guide" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
                        Guide de dépôt
                      </Link>{' '}
                      et le{' '}
                      <Link to="/arsenal" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
                        Bouclier joueur
                      </Link>{' '}
                      pour maximiser l'impact de votre signalement.
                    </span>
                  </div>
                )}

                {topicId === 'Demande légale' && (
                  <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>
                      RPGuard agit en qualité d'hébergeur (LCEN art. 6). Toute mise en demeure sera traitée
                      dans le respect du cadre légal. Consultez nos{' '}
                      <Link to="/mentions-legales" className="underline underline-offset-2 hover:opacity-75 transition-opacity">
                        mentions légales
                      </Link>{' '}
                      et notre{' '}
                      <Link to="/moderation" className="underline underline-offset-2 hover:opacity-75 transition-opacity">
                        charte de modération
                      </Link>.
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-muted-foreground order-2 sm:order-1 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500/70" />
                    Brouillon sauvegardé automatiquement
                  </p>
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="gap-2 w-full sm:w-auto order-1 sm:order-2 h-11 px-8 shadow-sm"
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi en cours…</>
                      : <><Send className="w-4 h-4" />Envoyer le message</>
                    }
                  </Button>
                </div>
              </form>
            )}

            {/* Guide de ressources */}
            <div className="flex flex-col gap-3 pt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Ressources utiles
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { to: '/guide',      label: 'Guide de dépôt',        desc: 'Déposer un dossier solide' },
                  { to: '/arsenal',    label: 'Bouclier joueur',        desc: '7 droits du joueur' },
                  { to: '/moderation', label: 'Charte de modération',   desc: 'Droits et procédures' },
                ].map(({ to, label, desc }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex flex-col gap-0.5 p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors"
                  >
                    <span className="text-xs font-medium text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground">{desc}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

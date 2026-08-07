import { Link } from 'react-router-dom';
import { Scale, ArrowLeft, Building2, Globe, ShieldOff, Copyright, AlertTriangle, Phone, MapPin, User, FileText } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';

// ── WhatsApp — obfusqué anti-spam, numéro jamais en clair ─────────────────
const WA_PARTS = ['3', '3', '6', '6', '7', '4', '8', '5', '2', '2', '6'];
const waBase   = () => `https://wa.me/${WA_PARTS.join('')}`;
// Message pré-rempli : demande légale / mise en demeure
const waLegalLink = () =>
  `${waBase()}?text=${encodeURIComponent(
    'Bonjour, je vous contacte au sujet d\'une demande légale concernant RPGuard (mentions légales / LCEN). Merci de me répondre.'
  )}`;

const SECTIONS = [
  {
    num: '01',
    icon: User,
    title: 'Éditeur responsable',
    content: (
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <User className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
          <span><strong className="text-foreground font-medium">Charly Soudan</strong> — Particulier, projet indépendant</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
          <span>36 Avenue du Parc, 93290 Tremblay-en-France, France</span>
        </div>
        <div className="flex items-start gap-2">
          <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
          <span>
            Contact WhatsApp uniquement —{' '}
            <a
              href={waLegalLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
              aria-label="Contacter via WhatsApp pour demande légale"
            >
              Envoyer un message
            </a>
          </span>
        </div>
      </div>
    ),
  },
  {
    num: '02',
    icon: Globe,
    title: 'Objet de la plateforme',
    text: "RPGuard est une plateforme communautaire de transparence. Elle permet aux joueurs de jeux de rôle en ligne (GTA RP, ONESTATE RP, RedM RP…) de témoigner publiquement de comportements observés sur des serveurs. Les contenus publiés relèvent du droit d'alerte, de la liberté d'expression, du droit au témoignage (Article 10 de la CEDH) et de la protection des consommateurs numériques.",
  },
  {
    num: '03',
    icon: FileText,
    title: 'Statut d\'hébergeur — Safe Harbor (LCEN art. 6)',
    text: "RPGuard agit EXCLUSIVEMENT en qualité d'hébergeur technique au sens de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN) et de la directive e-commerce européenne. À ce titre, RPGuard N'EST PAS L'AUTEUR des plaintes publiées par les utilisateurs et n'exerce aucun contrôle a priori sur celles-ci. RPGuard décline formellement toute responsabilité civile ou pénale quant aux propos tenus par les internautes sur sa plateforme.",
  },
  {
    num: '04',
    icon: ShieldOff,
    title: 'Responsabilité de l\'Auteur (Utilisateur)',
    text: "L'utilisateur qui soumet une plainte est juridiquement considéré comme l'AUTEUR UNIQUE de ses propos. En publiant, l'utilisateur s'engage expressément à respecter les lois en vigueur (diffamation, dénonciation calomnieuse, harcèlement) et garantit RPGuard contre tout recours (y compris de la part de fondateurs de serveurs ou modérateurs). Les serveurs de jeux visés ne peuvent poursuivre RPGuard pour les avis laissés par ses utilisateurs, conformément à la jurisprudence constante sur les sites d'avis en ligne.",
  },
  {
    num: '05',
    icon: Scale,
    title: 'Droit de Réponse et Procédure LCEN',
    text: "Pour se prémunir contre toute plainte judiciaire abusive (procédures-bâillons ou SLAPP), RPGuard met à disposition des personnes ou serveurs visés un Droit de réponse gratuit. En cas de contenu manifestement illicite (preuve à l'appui), une demande de retrait conforme à l'article 6-I-5 de la LCEN doit être adressée via le bouton WhatsApp dédié. Toute notification abusive, c'est-à-dire dans le but d'obtenir le retrait d'un témoignage légitime en sachant cette information inexacte, est punie d'un an d'emprisonnement et de 15 000 euros d'amende.",
  },
  {
    num: '06',
    icon: Building2,
    title: 'Hébergement technique',
    text: "La plateforme est hébergée par Supabase Inc. (infrastructure cloud sécurisée européenne AWS/GCP). Les bases de données sont situées dans des centres de données conformes aux normes européennes (Francfort/Irlande) en conformité avec le RGPD.",
  },
  {
    num: '07',
    icon: Copyright,
    title: 'Propriété intellectuelle & Fair Use',
    text: "Le code source et le design de RPGuard sont la propriété de Charly Soudan. Les mentions de jeux vidéo (GTA, FiveM, ONESTATE…) sont faites à titre informatif et descriptif dans le cadre du droit de courte citation et du 'Fair Use'. RPGuard n'est affilié, sponsorisé, ni validé par Rockstar Games, Take-Two Interactive, ou aucun autre éditeur de jeux vidéo.",
  },
];

export default function MentionsLegalesPage() {
  return (
    <div className="w-full">
      <PageMeta
        title="Mentions Légales — RPGuard"
        description="Consultez les mentions légales de RPGuard. Informations sur l'éditeur, l'hébergement, la responsabilité et le cadre juridique du site de signalement RP."
        keywords="mentions légales RPGuard, informations juridiques, éditeur site, contact légal, hébergement RPGuard"
      />
      {/* Hero */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Informations légales</p>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
                Mentions légales
              </h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            Informations légales obligatoires relatives à l'édition et à l'exploitation de la plateforme RPGuard,
            conformément à la loi française (LCEN, RGPD).
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col gap-0">
          {SECTIONS.map(({ num, icon: Icon, title, text, content }, i) => (
            <div
              key={num}
              className={`flex gap-6 py-8 ${i < SECTIONS.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="shrink-0 flex flex-col items-center gap-2 w-10">
                <span className="text-xs font-mono text-muted-foreground/50 tabular-nums">{num}</span>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-sm font-semibold text-foreground mb-3">{title}</h2>
                {content
                  ? content
                  : <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                }
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/40">
          <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dernière mise à jour : Juillet 2026. Ces mentions légales ont été rédigées dans le respect du droit français en vigueur.
            Pour toute contestation de contenu, utilisez la{' '}
            <Link to="/moderation" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
              procédure de modération
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

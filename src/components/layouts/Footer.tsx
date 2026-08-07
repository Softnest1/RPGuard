import { Link } from 'react-router-dom';
import { Shield, MessageCircle, ArrowUpRight, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ── Contact WhatsApp — obfusqué anti-spam ────────────────────────────────
const WA_PARTS = ['3', '3', '6', '6', '7', '4', '8', '5', '2', '2', '6'];
const waFooterLink = () => {
  const intro = `Bonjour l'équipe RPGuard 👋,\n\nJe vous contacte depuis le site pour une demande de renseignement.`;
  return `https://api.whatsapp.com/send?phone=${WA_PARTS.join('')}&text=${encodeURIComponent(intro)}`;
};

const YEAR = new Date().getFullYear();

// ── Composant colonne de navigation réutilisable ─────────────────────────
function FooterNav({ title, links, ariaLabel }: {
  title: string;
  ariaLabel: string;
  links: { to: string; label: string }[];
}) {
  return (
    <nav aria-label={ariaLabel}>
      <p className="text-sm 2xl:text-base 3xl:text-lg font-semibold text-foreground mb-5 3xl:mb-7">{title}</p>
      <ul className="flex flex-col gap-3.5 3xl:gap-5">
        {links.map(({ to, label }) => (
          <li key={to}>
            <Link
              to={to}
              className="text-sm 2xl:text-base 3xl:text-lg text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  const { user, profile } = useAuth();

  // ── Col 1 — Découvrir la plateforme
  const NAV_DECOUVRIR = [
    { to: '/plaintes',         label: 'Toutes les plaintes'  },
    { to: '/serveurs',         label: 'Classement serveurs'  },
    { to: '/statistiques',     label: 'Statistiques RP'      },
    { to: '/actualites',       label: 'Actualités'           },
    { to: '/label-confiance',  label: 'Label de Confiance'   },
  ];

  // ── Col 2 — Agir (actions directes, adapté visiteur/membre)
  const NAV_AGIR = user ? [
    { to: '/soumettre',        label: 'Déposer une plainte'  },
    { to: '/tableau-de-bord',  label: 'Mon tableau de bord'  },
    { to: '/mes-dossiers',     label: 'Mes dossiers PDF'     },
    { to: '/messages',         label: 'Ma messagerie'        },
    { to: '/arsenal',          label: 'Bouclier Joueur'      },
    ...(profile?.role === 'admin' ? [{ to: '/admin', label: 'Administration' }] : []),
  ] : [
    { to: '/inscription',      label: 'Créer un compte'      },
    { to: '/connexion',        label: 'Se connecter'         },
    { to: '/plaintes',         label: 'Voir les plaintes'    },
    { to: '/arsenal',          label: 'Bouclier Joueur'      },
  ];

  // ── Col 3 — Ressources & aide
  const NAV_RESSOURCES = [
    { to: '/guide',            label: 'Guide stratégique'    },
    { to: '/resistance',       label: 'Guide de résistance'  },
    { to: '/contact',          label: 'Contact & Support'    },
    { to: '/reglement',        label: 'Règlement (CGU)'      },
    { to: '/moderation',       label: 'Charte de modération' },
  ];

  // ── Col 4 — Légal (sans doublons avec Ressources)
  const NAV_LEGAL = [
    { to: '/mentions-legales', label: 'Mentions légales (LCEN)' },
    { to: '/confidentialite',  label: 'Confidentialité (RGPD)' },
  ];

  return (
    <footer className="border-t border-border bg-card mt-auto w-full" role="contentinfo">
      {/*
        max-w-[2560px] : plafonne à 4K. Sur TV/projecteur (>2560px), le contenu reste centré.
        padding : 6 → 8 → 12 → 20 → 28 selon la taille d'écran.
        py : 56px mobile → 72px tablette → 88px desktop → 104px 2xl → 120px 3xl (TV 4K).
      */}
      <div className="max-w-[2560px] mx-auto
                      px-6 md:px-8 lg:px-12 2xl:px-20 3xl:px-28
                      py-14 md:py-16 lg:py-20 2xl:py-24 3xl:py-28">

        {/* ── Grille principale : 1 col mobile → 2 col tablette → 6 col desktop ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 2xl:gap-14 3xl:gap-16 mb-12 2xl:mb-16 3xl:mb-20">

          {/* Colonne marque — 2 colonnes sur desktop */}
          <div className="flex flex-col gap-5 md:col-span-2 lg:col-span-2">
            <Link to="/" className="inline-flex items-center w-fit" aria-label="RPGuard — Accueil">
              <span className="font-extrabold text-[24px] 2xl:text-[28px] 3xl:text-[36px] tracking-tighter text-foreground leading-none">
                RP<span className="opacity-50 font-medium">Guard</span>
              </span>
            </Link>

            <p className="text-sm 2xl:text-base 3xl:text-lg text-muted-foreground leading-relaxed max-w-[280px] 2xl:max-w-[320px] 3xl:max-w-[380px]">
              Plateforme communautaire indépendante pour la transparence et la sécurité dans les serveurs de jeu de rôle.
            </p>

            {/* CTA visiteur — visible si non connecté */}
            {!user && (
              <Link
                to="/inscription"
                className="inline-flex items-center gap-2 text-sm 3xl:text-lg font-semibold text-primary hover:opacity-80 transition-opacity w-fit group"
              >
                Créer mon compte gratuitement
                <ArrowUpRight className="w-3.5 h-3.5 3xl:w-5 3xl:h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            )}

            {/* WhatsApp Support */}
            <a
              href={waFooterLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm 2xl:text-base 3xl:text-lg font-medium
                         text-foreground hover:text-primary transition-colors w-fit group
                         bg-muted/50 px-3 py-2.5 3xl:px-4 3xl:py-3 rounded-lg mt-1
                         min-h-[44px]"
              aria-label="Contacter RPGuard via WhatsApp"
            >
              <MessageCircle className="w-4 h-4 3xl:w-5 3xl:h-5 shrink-0 text-primary" />
              <span>Support WhatsApp</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
            </a>
          </div>

          {/* 4 colonnes navigation */}
          <FooterNav title="Découvrir"         ariaLabel="Navigation Plateforme"    links={NAV_DECOUVRIR}  />
          <FooterNav
            title={user ? 'Espace Membre' : 'Commencer'}
            ariaLabel={user ? 'Espace Membre' : 'Accès et inscription'}
            links={NAV_AGIR}
          />
          <FooterNav title="Ressources"        ariaLabel="Ressources et aide"       links={NAV_RESSOURCES} />
          <FooterNav title="Légal"             ariaLabel="Informations légales"     links={NAV_LEGAL}      />
        </div>

        {/* ── Barre de bas ──────────────────────────────────────────────── */}
        <div className="pt-7 2xl:pt-9 3xl:pt-12 border-t border-border
                        flex flex-col md:flex-row items-start md:items-center
                        justify-between gap-4 3xl:gap-6">
          <p className="text-sm 2xl:text-base 3xl:text-lg text-muted-foreground">
            © {YEAR} RPGuard — Édité par Charly Soudan. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm 2xl:text-base 3xl:text-lg text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 3xl:w-5 3xl:h-5 shrink-0" />
              Indépendant des éditeurs
            </span>
            <Link to="/mentions-legales" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">
              Hébergeur (LCEN)
            </Link>
            <Link
              to="/moderation"
              className="flex items-center gap-1.5 text-foreground font-medium hover:text-primary transition-colors min-h-[44px]"
            >
              Signaler un contenu illicite <ExternalLink className="w-3.5 h-3.5 3xl:w-5 3xl:h-5 shrink-0" />
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

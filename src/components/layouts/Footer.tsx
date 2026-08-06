import { Link } from 'react-router-dom';
import { Shield, MessageCircle, ArrowUpRight, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ── Contact WhatsApp — obfusqué anti-spam ────────────────────────────────
const WA_PARTS = ['3', '3', '6', '6', '7', '4', '8', '5', '2', '2', '6'];
const waBase = () => `https://wa.me/${WA_PARTS.join('')}`;
const waFooterLink = () => {
  const intro = `Bonjour l'équipe RPGuard 👋,\n\nJe vous contacte depuis le site pour une demande de renseignement.`;
  return `https://api.whatsapp.com/send?phone=${WA_PARTS.join('')}&text=${encodeURIComponent(intro)}`;
};

const YEAR = new Date().getFullYear();

export default function Footer() {
  const { user, profile } = useAuth();

  // ── Navigation dynamique ──────────────────────────────────────────────────
  const NAV_PLATFORM = [
    { to: '/plaintes',        label: 'Toutes les plaintes' },
    { to: '/serveurs',        label: 'Classement serveurs' },
    { to: '/statistiques',    label: 'Statistiques RP' },
    { to: '/label-confiance', label: 'Label de Confiance' },
  ];

  const NAV_USER = user ? [
    { to: '/tableau-de-bord', label: 'Mon tableau de bord' },
    { to: '/messages',        label: 'Ma messagerie' },
    { to: '/soumettre',       label: 'Déposer une plainte' },
    { to: '/arsenal',         label: 'Bouclier joueur' },
  ] : [
    { to: '/inscription',     label: 'Créer un compte' },
    { to: '/connexion',       label: 'Se connecter' },
    { to: '/soumettre',       label: 'Déposer une plainte' },
  ];

  const NAV_RESOURCES = [
    { to: '/guide',           label: 'Guide stratégique' },
    { to: '/actualites',      label: 'Actualités & Mises à jour' },
    { to: '/contact',         label: 'Contact & Support' },
  ];

  if (profile?.role === 'admin') {
    NAV_USER.push({ to: '/admin', label: 'Espace Administration' });
  }

  const NAV_LEGAL = [
    { to: '/mentions-legales',        label: 'Mentions légales (LCEN)' },
    { to: '/reglement',               label: 'Règlement (CGU)' },
    { to: '/confidentialite',         label: 'Confidentialité (RGPD)' },
    { to: '/confidentialite#cookies', label: 'Gestion des Cookies' },
    { to: '/moderation',              label: 'Charte de modération' },
  ];

  return (
    <footer className="border-t border-border bg-card mt-auto w-full max-w-[2560px] mx-auto" role="contentinfo">
      <div className="px-6 sm:px-8 md:px-12 2xl:px-20 4xl:px-28 py-16 md:py-20 2xl:py-24">

        {/* ── Grille principale ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 2xl:gap-16 mb-16 2xl:mb-24">

          {/* Colonne marque */}
          <div className="flex flex-col gap-6 md:col-span-1 sm:col-span-2">
            <Link
              to="/"
              className="inline-flex items-center group w-fit"
              aria-label="RPGuard — Accueil"
            >
              <span className="font-extrabold text-[24px] 2xl:text-[28px] tracking-tighter text-foreground leading-none">
                RP<span className="opacity-50 font-medium">Guard</span>
              </span>
            </Link>

            <p className="text-sm 2xl:text-base text-muted-foreground leading-relaxed max-w-[280px] 2xl:max-w-[340px]">
              Plateforme communautaire indépendante dédiée à la transparence et à la sécurité dans les serveurs de jeu de rôle.
            </p>

            {/* WhatsApp */}
            <a
              href={waFooterLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm 2xl:text-base font-medium text-foreground hover:text-primary transition-colors w-fit group bg-muted/50 px-3 py-2 2xl:px-4 2xl:py-3 rounded-lg"
              aria-label="Contacter RPGuard via WhatsApp"
            >
              <MessageCircle className="w-4 h-4 2xl:w-5 2xl:h-5 shrink-0 text-primary" />
              <span>Support WhatsApp</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
            </a>
          </div>

          {/* Plateforme */}
          <nav aria-label="Navigation Plateforme">
            <p className="text-sm 2xl:text-base font-bold text-foreground mb-6">Plateforme</p>
            <ul className="flex flex-col gap-4">
              {NAV_PLATFORM.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm 2xl:text-base text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Espace Utilisateur */}
          <nav aria-label={user ? "Espace Membre" : "Accès Compte"}>
            <p className="text-sm 2xl:text-base font-bold text-foreground mb-6">{user ? "Espace Membre" : "Accès Compte"}</p>
            <ul className="flex flex-col gap-4">
              {NAV_USER.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm 2xl:text-base text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Ressources */}
          <nav aria-label="Ressources">
            <p className="text-sm 2xl:text-base font-bold text-foreground mb-6">Ressources</p>
            <ul className="flex flex-col gap-4">
              {NAV_RESOURCES.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm 2xl:text-base text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Légal */}
          <nav aria-label="Navigation Légal">
            <p className="text-sm 2xl:text-base font-bold text-foreground mb-6">Informations Légales</p>
            <ul className="flex flex-col gap-4">
              {NAV_LEGAL.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm 2xl:text-base text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* ── Barre de bas ─────────────────────────────────── */}
        <div className="pt-8 2xl:pt-10 border-t border-border flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <p className="text-sm 2xl:text-base text-muted-foreground">
            © {YEAR} RPGuard — Édité par Charly Soudan. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm 2xl:text-base text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" /> Indépendant des éditeurs</span>
            <span aria-hidden="true" className="hidden sm:inline text-border">|</span>
            <Link
              to="/mentions-legales"
              className="hover:text-foreground transition-colors"
            >
              Hébergeur (LCEN)
            </Link>
            <span aria-hidden="true" className="hidden sm:inline text-border">|</span>
            <Link
              to="/moderation"
              className="flex items-center gap-1.5 text-foreground font-medium hover:text-primary transition-colors"
            >
              Signaler un contenu illicite (Art. 6 LCEN) <ExternalLink className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" />
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

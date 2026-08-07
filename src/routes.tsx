import { lazy, type ReactNode } from 'react';
import HomePage from './pages/HomePage'; // Chargement direct pour ne pas bloquer l'accueil

// ── Chargement différé — chaque page = chunk séparé ──────────────────────
// Les pages critiques (Accueil, Connexion, Inscription) restent dans le bundle
// principal ; toutes les autres sont chargées à la demande.
const ConnexionPage        = lazy(() => import('./pages/ConnexionPage'));
const InscriptionPage      = lazy(() => import('./pages/InscriptionPage'));
const MotDePasseOubliePage = lazy(() => import('./pages/MotDePasseOubliePage'));
const PlaintesPage         = lazy(() => import('./pages/PlaintesPage'));
const PlainteDetailPage    = lazy(() => import('./pages/PlainteDetailPage'));
const SoumettreePage       = lazy(() => import('./pages/SoumettreePage'));
const TableauDeBordPage    = lazy(() => import('./pages/TableauDeBordPage'));
const MentionsLegalesPage  = lazy(() => import('./pages/MentionsLegalesPage'));
const ReglementPage        = lazy(() => import('./pages/ReglementPage'));
const ConfidentialitePage  = lazy(() => import('./pages/ConfidentialitePage'));
const ContactPage          = lazy(() => import('./pages/ContactPage'));
const GuidePage            = lazy(() => import('./pages/GuidePage'));
const ArsenalPage          = lazy(() => import('./pages/ArsenalPage'));
const ServeursPage         = lazy(() => import('./pages/ServeursPage'));
const ModerationPage       = lazy(() => import('./pages/ModerationPage'));
const ActualitesPage       = lazy(() => import('./pages/ActualitesPage'));
// Pages admin — chargées uniquement si l'utilisateur accède à /admin
const MessagesPage         = lazy(() => import('./pages/messages/MessagesPage'));
const AdminDashboardPage   = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminPlaintesPage    = lazy(() => import('./pages/admin/AdminPlaintesPage'));
const AdminMessagesPage    = lazy(() => import('./pages/admin/AdminMessagesPage'));
const AdminMembresPage     = lazy(() => import('./pages/admin/AdminMembresPage'));
const AdminNewsPage        = lazy(() => import('./pages/admin/AdminNewsPage'));
const AdminDiagnosticPage  = lazy(() => import('./pages/admin/AdminDiagnosticPage'));
const MesDossiersPage      = lazy(() => import('./pages/MesDossiersPage'));
const LabelConfiancePage   = lazy(() => import('./pages/LabelConfiancePage'));
const StatistiquesPage     = lazy(() => import('./pages/StatistiquesPage'));
const ServeurDetailPage    = lazy(() => import('./pages/ServeurDetailPage'));
const ResistancePage       = lazy(() => import('./pages/ResistancePage'));

export interface RouteConfig {
  name: string;
  path?: string;
  index?: boolean;
  element: ReactNode;
  public?: boolean;
}

// ── Routes publiques (avec Header/Footer) ──────────────────────────────────
export const routes: RouteConfig[] = [
  { name: 'Accueil',             path: '/',                    element: <HomePage />,             public: true },
  { name: 'Connexion',           path: '/connexion',           element: <ConnexionPage />,        public: true },
  { name: 'Inscription',         path: '/inscription',         element: <InscriptionPage />,      public: true },
  { name: 'Mot de passe oublié', path: '/mot-de-passe-oublie', element: <MotDePasseOubliePage />, public: true },
  { name: 'Plaintes',            path: '/plaintes',            element: <PlaintesPage />,         public: true },
  { name: 'Détail plainte',      path: '/plaintes/:id',        element: <PlainteDetailPage />,    public: true },
  { name: 'Soumettre',           path: '/soumettre',           element: <SoumettreePage />,       public: false },
  { name: 'Messagerie',          path: '/messages',            element: <MessagesPage />,         public: false },
  { name: 'Tableau de bord',     path: '/tableau-de-bord',     element: <TableauDeBordPage />,    public: false },
  { name: 'Mentions légales',    path: '/mentions-legales',    element: <MentionsLegalesPage />,  public: true },
  { name: 'Règlement',           path: '/reglement',           element: <ReglementPage />,        public: true },
  { name: 'Confidentialité',     path: '/confidentialite',     element: <ConfidentialitePage />,  public: true },
  { name: 'Modération',          path: '/moderation',          element: <ModerationPage />,       public: true },
  { name: 'Contact',             path: '/contact',             element: <ContactPage />,          public: true },
  { name: 'Guide stratégique',   path: '/guide',               element: <GuidePage />,            public: true },
  { name: 'Bouclier Joueur',     path: '/arsenal',             element: <ArsenalPage />,          public: true },
  { name: 'Actualités',          path: '/actualites',          element: <ActualitesPage />,       public: true },
  { name: 'Classement serveurs', path: '/serveurs',            element: <ServeursPage />,         public: true },
  { name: 'Fiche serveur',       path: '/serveurs/:slug',       element: <ServeurDetailPage />,    public: true },
  { name: 'Guide résistance',    path: '/resistance',           element: <ResistancePage />,       public: true },
  { name: 'Mes dossiers PDF',    path: '/mes-dossiers',        element: <MesDossiersPage />,      public: false },
  { name: 'Label de Confiance',  path: '/label-confiance',     element: <LabelConfiancePage />,   public: true },
  { name: 'Statistiques RP',     path: '/statistiques',        element: <StatistiquesPage />,     public: true },
];

// ── Routes admin (sous /admin, via AdminLayout/Outlet) ────────────────────
export const adminRoutes: RouteConfig[] = [
  { name: 'Admin — Tableau de bord', index: true,          element: <AdminDashboardPage /> },
  { name: 'Admin — Plaintes',        path: 'plaintes',     element: <AdminPlaintesPage /> },
  { name: 'Admin — Messages',        path: 'messages',     element: <AdminMessagesPage /> },
  { name: 'Admin — Membres',         path: 'membres',      element: <AdminMembresPage /> },
  { name: 'Admin — Actualités',      path: 'actualites',   element: <AdminNewsPage /> },
  { name: 'Admin — Diagnostic',      path: 'diagnostic',   element: <AdminDiagnosticPage /> },
];

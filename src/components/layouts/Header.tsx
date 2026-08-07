import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LogOut, LayoutDashboard, FilePlus, UserCircle2,
  MessageSquare, ShieldAlert, BookOpen, FileText, Server,
  FolderOpen, ChevronRight, ArrowUpRight,
  BarChart3, ShieldOff, Megaphone, Menu, X,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Navigation — 6 liens publics, priorité visiteur ──────────────────────
// Ordre stratégique : action principale → exploration → légal/info
const NAV_LINKS = [
  { href: '/plaintes',     label: 'Plaintes',    icon: FileText,  num: '01' },
  { href: '/serveurs',     label: 'Serveurs',    icon: Server,    num: '02' },
  { href: '/guide',        label: 'Guide',       icon: BookOpen,  num: '03' },
  { href: '/statistiques', label: 'Stats',       icon: BarChart3, num: '04' },
  { href: '/arsenal',      label: 'Bouclier',    icon: ShieldOff, num: '05' },
  { href: '/resistance',   label: 'Résistance',  icon: Megaphone, num: '06' },
];

// ── Liens espace membre ───────────────────────────────────────────────────
const MEMBER_LINKS = [
  { to: '/tableau-de-bord',            icon: LayoutDashboard, label: 'Mon espace'       },
  { to: '/messages',                   icon: MessageSquare,   label: 'Messagerie'       },
  { to: '/mes-dossiers',               icon: FolderOpen,      label: 'Mes dossiers PDF' },
  { to: '/tableau-de-bord?tab=profil', icon: UserCircle2,     label: 'Profil public'    },
];

function getInitials(username?: string | null): string {
  return username ? username.slice(0, 2).toUpperCase() : '??';
}

// ── Logo signature — RP|Guard avec trait vertical animé ──────────────────
function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} aria-label="RPGuard — Accueil"
      className="shrink-0 select-none group">
      <span className="font-extrabold tracking-tighter text-foreground leading-none
                       inline-flex items-baseline gap-0
                       text-[20px] md:text-[21px] lg:text-[22px] xl:text-[23px]
                       2xl:text-[25px] 3xl:text-[28px] 4xl:text-[32px] 5xl:text-[38px]">
        <span className="relative">
          RP
          <span
            aria-hidden
            className="absolute -right-[3px] top-[0.05em] bottom-[0.05em] w-[2px] rounded-full"
            style={{ background: 'hsl(var(--sig))', animation: 'rp-cursor 1.4s ease-in-out infinite' }}
          />
        </span>
        <span className="font-light opacity-50 tracking-normal ml-[5px] md:ml-[6px]">Guard</span>
      </span>
    </Link>
  );
}

// ── Nav Desktop adaptatif ─────────────────────────────────────────────────
// md–lg (tablette) : icônes seules + tooltip au survol
// lg+  (laptop+)   : icône + label visible
// 2xl+ (FHD+)      : taille augmentée progressivement
// 4K+  (TV/cinéma) : très grand, confortable à distance
function FlatNav({ isActive }: { isActive: (href: string) => boolean }) {
  return (
    <TooltipProvider delayDuration={300}>
      <nav aria-label="Navigation principale"
        className="relative hidden md:flex items-center gap-0 h-full
                   overflow-x-auto overflow-y-hidden scrollbar-none">
        {NAV_LINKS.map(link => {
          const active = isActive(link.href);
          const Icon = link.icon;

          return (
            <Tooltip key={link.href}>
              <TooltipTrigger asChild>
                <Link
                  to={link.href}
                  data-active={active ? 'true' : 'false'}
                  className="relative flex items-center h-full shrink-0
                             px-1 md:px-1 lg:px-1.5 xl:px-2 2xl:px-2.5 4xl:px-4"
                >
                  {active ? (
                    /* ── ACTIF : pill pleine foreground ── */
                    <span className="flex items-center rounded-md select-none
                                     bg-foreground text-background
                                     transition-all duration-200
                                     gap-0 md:gap-0 lg:gap-1.5
                                     px-2 md:px-2.5 lg:px-3 xl:px-3.5 2xl:px-4 4xl:px-5
                                     py-[5px] md:py-[5px] lg:py-[6px] 2xl:py-[7px] 4xl:py-3
                                     text-[12px] md:text-[12px] lg:text-[13px] xl:text-[13px]
                                     2xl:text-[14px] 3xl:text-[15px] 4xl:text-[17px] 5xl:text-[20px]
                                     font-semibold tracking-[0.01em] whitespace-nowrap">
                      <Icon
                        className="shrink-0
                                   w-[14px] h-[14px] lg:w-[14px] lg:h-[14px]
                                   2xl:w-[15px] 2xl:h-[15px] 4xl:w-[18px] 4xl:h-[18px]
                                   5xl:w-[22px] 5xl:h-[22px]"
                        style={{ color: 'hsl(var(--sig))' }}
                      />
                      {/* Label masqué sur tablette, visible à partir de lg */}
                      <span className="hidden lg:inline ml-1.5 2xl:ml-2">
                        {link.label}
                      </span>
                    </span>
                  ) : (
                    /* ── INACTIF : texte atténué + hover pill ── */
                    <span className="group flex items-center rounded-md
                                     text-foreground/50 hover:text-foreground
                                     hover:bg-muted/70
                                     transition-all duration-200
                                     gap-0 md:gap-0 lg:gap-1.5
                                     px-2 md:px-2.5 lg:px-3 xl:px-3.5 2xl:px-4 4xl:px-5
                                     py-[5px] md:py-[5px] lg:py-[6px] 2xl:py-[7px] 4xl:py-3
                                     text-[12px] md:text-[12px] lg:text-[13px] xl:text-[13px]
                                     2xl:text-[14px] 3xl:text-[15px] 4xl:text-[17px] 5xl:text-[20px]
                                     font-medium tracking-[0.01em] whitespace-nowrap">
                      <Icon
                        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity duration-200
                                   w-[14px] h-[14px] lg:w-[14px] lg:h-[14px]
                                   2xl:w-[15px] 2xl:h-[15px] 4xl:w-[18px] 4xl:h-[18px]
                                   5xl:w-[22px] 5xl:h-[22px]"
                      />
                      {/* Label masqué sur tablette, visible à partir de lg */}
                      <span className="hidden lg:inline ml-1.5 2xl:ml-2">
                        {link.label}
                      </span>
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              {/* Tooltip visible uniquement sur tablette (md/lg) où le label est masqué */}
              <TooltipContent side="bottom" className="lg:hidden text-xs font-medium">
                {link.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}

// ── Header principal ──────────────────────────────────────────────────────
export default function Header() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lineReady,  setLineReady]  = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setLineReady(false);
    const t = setTimeout(() => setLineReady(true), 80);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const isActive = (href: string) =>
    location.pathname === href ||
    (href !== '/' && location.pathname.startsWith(href + '/'));

  const close = () => setMobileOpen(false);

  const signingOutRef = useRef(false);
  const handleSignOut = async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    try {
      await signOut();
      close();
      toast.success('Déconnecté avec succès');
      navigate('/');
    } finally {
      signingOutRef.current = false;
    }
  };

  return (
    <>
      {/* Keyframes curseur logo */}
      <style>{`
        @keyframes rp-cursor {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════
          HEADER SIGNATURE RPGuard — adaptatif tous écrans
          < 768px   : hamburger menu
          768–1023  : icônes nav seules + tooltips
          1024–1535 : icônes + labels
          1536–1919 : taille augmentée, padding élargi
          1920–2559 : FHD/2K — très aéré
          2560–3839 : QHD/4K cinéma
          3840+     : 4K TV/automobile — max-w illimité, tailles XXL
          ══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-xl">

        {/* Ligne signature rouge */}
        <div
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-[1.5px] origin-left"
          style={{
            background: `linear-gradient(90deg, hsl(var(--sig)) 0%, hsl(var(--sig)/0.3) 60%, transparent 100%)`,
            transform:  lineReady ? 'scaleX(1)' : 'scaleX(0)',
            transition: 'transform 0.6s cubic-bezier(.4,0,.2,1)',
          }}
        />

        {/* Conteneur principal — s'adapte de 320px à 7680px (8K) */}
        <div className="w-full mx-auto
                        px-4 md:px-5 lg:px-8 xl:px-10
                        2xl:px-14 3xl:px-20 4xl:px-28 5xl:px-40
                        grid grid-cols-[auto_1fr_auto] items-stretch
                        h-[52px] md:h-[58px] lg:h-[62px] xl:h-[64px]
                        2xl:h-[68px] 3xl:h-[76px] 4xl:h-[88px] 5xl:h-[108px]">

          {/* Col 1 — Logo */}
          <div className="flex items-center
                          pr-3 md:pr-4 lg:pr-6 xl:pr-8 2xl:pr-10 4xl:pr-14
                          border-r border-border/50">
            <Logo />
          </div>

          {/* Col 2 — Nav (desktop/tablette) */}
          <div className="flex items-stretch min-w-0 overflow-hidden
                          pl-1 md:pl-1 lg:pl-2 2xl:pl-3">
            {!loading && <FlatNav isActive={isActive} />}
          </div>

          {/* Col 3 — Actions droite */}
          <div className="flex shrink-0 items-center
                          gap-1.5 md:gap-2 lg:gap-2.5 xl:gap-3 2xl:gap-4 4xl:gap-6
                          pl-3 md:pl-4 lg:pl-5 xl:pl-6 2xl:pl-8 4xl:pl-12
                          border-l border-border/50">

            {/* ── DESKTOP ≥ md ─────────────────────────────────────── */}
            <div className="hidden md:flex items-center
                            gap-1.5 md:gap-2 lg:gap-2.5 2xl:gap-3 4xl:gap-5">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-20 lg:w-28 2xl:w-32 4xl:w-44 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ) : user ? (
                <>
                  {/* CTA Déposer */}
                  <Button asChild size="sm"
                    className="rounded-full shadow-none transition-opacity hover:opacity-90 gap-1.5
                               h-8 px-3 text-[12px]
                               md:h-8 md:px-3 md:text-[12px]
                               lg:h-9 lg:px-4 lg:text-[13px]
                               xl:h-9 xl:px-4 xl:text-[13px]
                               2xl:h-10 2xl:px-5 2xl:text-[14px]
                               3xl:h-11 3xl:px-6 3xl:text-[15px]
                               4xl:h-14 4xl:px-8 4xl:text-[18px]
                               5xl:h-16 5xl:px-10 5xl:text-[21px]
                               font-semibold"
                    style={{ background: 'hsl(var(--sig))', color: 'hsl(var(--sig-foreground))' }}>
                    <Link to="/soumettre" className="flex items-center gap-1.5">
                      <FilePlus className="w-3.5 h-3.5 shrink-0 2xl:w-4 2xl:h-4 4xl:w-5 4xl:h-5 5xl:w-6 5xl:h-6" />
                      <span>Déposer</span>
                      <ArrowUpRight className="w-3 h-3 shrink-0 opacity-80 4xl:w-4 4xl:h-4" />
                    </Link>
                  </Button>

                  {/* Avatar + dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger aria-label="Menu du compte"
                      className="flex items-center gap-1.5 rounded-md
                                 hover:bg-muted/60 transition-colors
                                 outline-none focus-visible:ring-2 focus-visible:ring-ring
                                 h-8 pl-1 pr-2 md:h-8
                                 lg:h-9 lg:pr-2.5
                                 2xl:h-10 2xl:pr-3
                                 4xl:h-14 4xl:pl-1.5 4xl:pr-4">
                      <span
                        className="flex items-center justify-center rounded-full
                                   text-background font-black shrink-0
                                   w-5 h-5 text-[9px]
                                   lg:w-6 lg:h-6 lg:text-[10px]
                                   2xl:w-7 2xl:h-7 2xl:text-[11px]
                                   4xl:w-10 4xl:h-10 4xl:text-[14px]
                                   5xl:w-12 5xl:h-12 5xl:text-[16px]"
                        style={{ background: 'hsl(var(--sig))' }}
                      >
                        {getInitials(profile?.username)}
                      </span>
                      <span className="text-foreground truncate font-medium
                                       hidden lg:block max-w-[70px]
                                       text-[12px] lg:text-[13px]
                                       2xl:text-[14px] 2xl:max-w-[90px]
                                       4xl:text-[17px] 4xl:max-w-[140px]">
                        {profile?.username ?? 'Membre'}
                      </span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground rotate-90
                                               4xl:w-4 4xl:h-4" />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end"
                      className="w-56 2xl:w-60 4xl:w-80 5xl:w-96 rounded-xl p-1.5 mt-1">
                      <DropdownMenuLabel className="px-2 py-1.5">
                        <p className="text-sm 4xl:text-lg font-semibold text-foreground truncate">
                          @{profile?.username ?? 'Membre'}
                        </p>
                        <p className="text-xs 4xl:text-base text-muted-foreground">
                          {profile?.role === 'admin' ? 'Administrateur' : 'Membre'}
                        </p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {MEMBER_LINKS.map(({ to, icon: Icon, label }) => (
                        <DropdownMenuItem key={to} asChild className="rounded-lg cursor-pointer">
                          <Link to={to}
                            className="flex items-center gap-2.5 px-2 py-2 text-sm 4xl:text-base 4xl:py-3">
                            <Icon className="w-4 h-4 4xl:w-5 4xl:h-5 text-muted-foreground shrink-0" />
                            {label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      {profile?.role === 'admin' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                            <Link to="/admin"
                              className="flex items-center gap-2.5 px-2 py-2 text-sm font-semibold
                                         4xl:text-base 4xl:py-3
                                         text-amber-600 dark:text-amber-400">
                              <ShieldAlert className="w-4 h-4 4xl:w-5 4xl:h-5 shrink-0" />
                              Administration
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}
                        className="rounded-lg cursor-pointer text-destructive
                                   focus:text-destructive focus:bg-destructive/10
                                   px-2 py-2 text-sm 4xl:text-base 4xl:py-3">
                        <LogOut className="w-4 h-4 4xl:w-5 4xl:h-5 mr-2.5 shrink-0" />
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                /* Visiteur */
                <div className="flex items-center gap-1.5 md:gap-2 lg:gap-2.5 2xl:gap-3 4xl:gap-5">
                  {/* Connexion — outline */}
                  <Button asChild variant="outline" size="sm"
                    className="rounded-md shadow-none transition-colors font-medium
                               border-border/80 text-foreground hover:bg-muted/60 hover:border-border
                               h-8 px-3 text-[12px]
                               lg:h-9 lg:px-4 lg:text-[13px]
                               2xl:h-10 2xl:px-5 2xl:text-[14px]
                               4xl:h-14 4xl:px-8 4xl:text-[18px]
                               5xl:h-16 5xl:px-10 5xl:text-[21px]">
                    <Link to="/connexion">Connexion</Link>
                  </Button>
                  {/* S'inscrire — pill rouge */}
                  <Button asChild size="sm"
                    className="rounded-full shadow-none transition-opacity hover:opacity-90 font-semibold
                               h-8 px-3 text-[12px]
                               lg:h-9 lg:px-4 lg:text-[13px]
                               2xl:h-10 2xl:px-5 2xl:text-[14px]
                               4xl:h-14 4xl:px-8 4xl:text-[18px]
                               5xl:h-16 5xl:px-10 5xl:text-[21px]"
                    style={{ background: 'hsl(var(--sig))', color: 'hsl(var(--sig-foreground))' }}>
                    <Link to="/inscription">S'inscrire</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* ── MOBILE < md — hamburger ──────────────────────────── */}
            <div className="md:hidden">
              {loading ? (
                <Skeleton className="w-9 h-9 rounded-md" />
              ) : (
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  {/* Bouton hamburger — touch target 44×44px minimum */}
                  <button
                    onClick={() => setMobileOpen(true)}
                    aria-label="Ouvrir le menu"
                    aria-expanded={mobileOpen}
                    className="flex items-center justify-center w-11 h-11 rounded-md
                               hover:bg-muted/60 transition-colors"
                  >
                    <Menu className="w-5 h-5 text-foreground" />
                  </button>

                  {/* ══════════════════════════════════════════════════
                      MENU MOBILE — plein écran éditorial
                      ══════════════════════════════════════════════════ */}
                  <SheetContent
                    side="right"
                    hideClose
                    className="w-full sm:w-full p-0 flex flex-col border-0"
                    style={{ background: 'hsl(var(--foreground))' }}
                  >
                    {/* En-tête — logo inversé + bouton fermer */}
                    <SheetHeader className="flex-row items-center justify-between
                                            px-6 pt-5 pb-4 shrink-0">
                      <SheetTitle asChild>
                        <Link to="/" onClick={close} aria-label="RPGuard — Accueil"
                          className="shrink-0 select-none">
                          <span className="font-extrabold tracking-tighter leading-none
                                           inline-flex items-baseline gap-0 text-[22px]"
                            style={{ color: 'hsl(var(--background))' }}>
                            <span className="relative">
                              RP
                              <span aria-hidden
                                className="absolute -right-[3px] top-[0.05em] bottom-[0.05em] w-[2px] rounded-full"
                                style={{ background: 'hsl(var(--sig))', animation: 'rp-cursor 1.4s ease-in-out infinite' }} />
                            </span>
                            <span className="font-light opacity-40 tracking-normal ml-[5px]">Guard</span>
                          </span>
                        </Link>
                      </SheetTitle>
                      <button onClick={close} aria-label="Fermer le menu"
                        className="w-10 h-10 flex items-center justify-center
                                   rounded-md transition-opacity hover:opacity-60"
                        style={{ color: 'hsl(var(--background))' }}>
                        <X className="w-5 h-5" />
                      </button>
                    </SheetHeader>

                    {/* Séparateur rouge signature */}
                    <div className="mx-6 h-[1px] shrink-0"
                      style={{ background: 'hsl(var(--sig)/0.6)' }} />

                    {/* Corps scrollable */}
                    <div className="flex-1 overflow-y-auto overscroll-contain
                                    px-6 py-6 flex flex-col gap-1">

                      {/* Nav principale — grands caractères éditoriaux */}
                      <nav aria-label="Navigation mobile" className="flex flex-col gap-0 mb-6">
                        {NAV_LINKS.map(({ href, label, num, icon: Icon }) => {
                          const active = isActive(href);
                          return (
                            <Link
                              key={href}
                              to={href}
                              onClick={close}
                              className="group flex items-center justify-between py-4
                                         border-b border-white/10 transition-all duration-200"
                            >
                              <div className="flex items-baseline gap-3">
                                <span className="text-[11px] font-bold tabular-nums"
                                  style={{ color: 'hsl(var(--sig))' }}>
                                  {num}
                                </span>
                                <span
                                  className="text-[28px] font-extrabold tracking-tighter leading-none
                                             transition-all duration-200"
                                  style={{
                                    color: active
                                      ? 'hsl(var(--background))'
                                      : 'hsl(var(--background)/0.5)',
                                  }}
                                >
                                  {label}
                                </span>
                              </div>
                              <Icon
                                className="w-5 h-5 shrink-0 opacity-30
                                           group-hover:opacity-70 transition-opacity"
                                style={{ color: 'hsl(var(--background))' }}
                              />
                            </Link>
                          );
                        })}
                      </nav>

                      {/* Espace membre / visiteur */}
                      {user ? (
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
                            style={{ color: 'hsl(var(--background)/0.35)' }}>
                            Espace Membre
                          </p>
                          {MEMBER_LINKS.map(({ to, icon: Icon, label }) => (
                            <Link key={to} to={to} onClick={close}
                              className="flex items-center gap-3 min-h-[44px] px-1 rounded-lg
                                         text-sm font-medium transition-colors"
                              style={{ color: 'hsl(var(--background)/0.65)' }}
                              onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--background))')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--background)/0.65)')}>
                              <Icon className="w-4 h-4 shrink-0 opacity-50" />
                              {label}
                            </Link>
                          ))}
                          {profile?.role === 'admin' && (
                            <Link to="/admin" onClick={close}
                              className="flex items-center gap-3 min-h-[44px] px-1 rounded-lg
                                         text-sm font-semibold mt-1"
                              style={{ color: 'hsl(38 92% 50%)' }}>
                              <ShieldAlert className="w-4 h-4 shrink-0" />
                              Administration
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 mt-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em]"
                            style={{ color: 'hsl(var(--background)/0.35)' }}>
                            Rejoindre RPGuard
                          </p>
                          <Button asChild size="lg"
                            className="w-full h-12 rounded-xl text-sm font-semibold shadow-none"
                            style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
                            <Link to="/inscription" onClick={close}>Créer un compte gratuitement</Link>
                          </Button>
                          <button onClick={() => { close(); navigate('/connexion'); }}
                            className="w-full h-11 rounded-xl text-sm font-medium border
                                       transition-opacity hover:opacity-80"
                            style={{ borderColor: 'hsl(var(--background)/0.25)', color: 'hsl(var(--background)/0.70)' }}>
                            Se connecter
                          </button>
                        </div>
                      )}

                      {/* Liens secondaires */}
                      <div className="mt-6 pt-5 border-t"
                        style={{ borderColor: 'hsl(var(--background)/0.12)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
                          style={{ color: 'hsl(var(--background)/0.35)' }}>
                          Explorer
                        </p>
                        {[
                          { to: '/actualites',      label: 'Actualités' },
                          { to: '/label-confiance', label: 'Label de Confiance' },
                          { to: '/contact',         label: 'Contact & Support' },
                        ].map(({ to, label }) => (
                          <Link key={to} to={to} onClick={close}
                            className="flex items-center min-h-[40px] px-1 rounded-lg
                                       text-sm transition-colors"
                            style={{ color: 'hsl(var(--background)/0.50)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--background)/0.80)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--background)/0.50)')}>
                            {label}
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Pied épinglé — si connecté */}
                    {user && (
                      <div className="shrink-0 p-5 pb-safe grid grid-cols-2 gap-2 border-t"
                        style={{ borderColor: 'hsl(var(--background)/0.12)' }}>
                        <Link to="/soumettre" onClick={close}
                          className="flex items-center justify-center gap-2 h-11 rounded-xl
                                     text-sm font-semibold transition-opacity hover:opacity-90"
                          style={{ background: 'hsl(var(--sig))', color: 'hsl(var(--sig-foreground))' }}>
                          <FilePlus className="w-4 h-4 shrink-0" />
                          Déposer
                        </Link>
                        <button onClick={handleSignOut}
                          className="flex items-center justify-center gap-2 h-11 rounded-xl
                                     text-sm font-medium border transition-opacity hover:opacity-60"
                          style={{
                            borderColor: 'hsl(var(--background)/0.20)',
                            color: 'hsl(var(--background)/0.55)',
                          }}>
                          <LogOut className="w-4 h-4 shrink-0" />
                          Déconnexion
                        </button>
                      </div>
                    )}
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}


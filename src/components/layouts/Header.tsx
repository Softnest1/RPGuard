import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  Shield, Menu, LogOut, LayoutDashboard, FilePlus, UserCircle2,
  ArrowRight, X, MessageSquare, ShieldAlert, BookOpen, FileText, Server, Activity
} from 'lucide-react';
import { toast } from 'sonner';

// ── NAVIGATION STRATÉGIQUE (ZÉRO DOUBLON) ───────────────────────────────────
const VISITOR_LINKS = [
  { href: '/plaintes', label: 'Plaintes', icon: FileText },
  { href: '/serveurs', label: 'Classement', icon: Server },
  { href: '/statistiques', label: 'Statistiques', icon: Activity },
  { href: '/label-confiance', label: 'Label Confiance', icon: Shield },
  { href: '/guide', label: 'Guide RP', icon: BookOpen },
];

const USER_LINKS = [
  { href: '/plaintes', label: 'Plaintes', icon: FileText },
  { href: '/serveurs', label: 'Classement', icon: Server },
  { href: '/arsenal', label: 'Bouclier Joueur', icon: ShieldAlert },
  { href: '/label-confiance', label: 'Label Confiance', icon: Shield },
  { href: '/actualites', label: 'Actualités', icon: Activity },
];

function getInitials(username?: string | null): string {
  return username ? username.slice(0, 2).toUpperCase() : '?';
}

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" className="flex items-center shrink-0 group" onClick={onClick}>
      <span className="font-extrabold text-[22px] md:text-[24px] 2xl:text-[28px] tracking-tighter text-foreground leading-none">
        RP<span className="opacity-50 font-medium">Guard</span>
      </span>
    </Link>
  );
}

export default function Header() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fermer le menu si l'URL change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
    toast.success('Déconnecté avec succès');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-xl border-b border-border/40">
      {/* 
        Le container fluide : 
        S'étend très largement sur les écrans 4K/Cinéma (max-w-[2560px]) 
        et gère son padding selon l'appareil.
      */}
      <div className="w-full max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-16 min-[1920px]:px-24 h-16 md:h-20 2xl:h-24 flex items-center justify-between gap-4">
        
        {/* LOGO & NAVIGATION DESKTOP */}
        <div className="flex items-center gap-6 lg:gap-10 2xl:gap-16">
          <Logo />

          {!loading && (
            <nav className="hidden lg:flex items-center gap-4 lg:gap-6 xl:gap-8 2xl:gap-12 animate-in fade-in">
              {(user ? USER_LINKS : VISITOR_LINKS).map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-[14px] xl:text-[15px] 2xl:text-[18px] font-medium transition-colors whitespace-nowrap ${
                    isActive(link.href) 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* ACTIONS DROITE DESKTOP (Visible à partir de lg / laptop) */}
        <div className="hidden lg:flex shrink-0 items-center gap-2 lg:gap-3 2xl:gap-5">
          {loading ? (
            <div className="flex gap-2">
              <Skeleton className="h-9 lg:h-10 2xl:h-12 w-20 lg:w-28 rounded-full" />
              <Skeleton className="h-9 w-9 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 rounded-full" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-2 lg:gap-3 2xl:gap-5 animate-in fade-in">
              <Button asChild size="sm" className="rounded-full h-9 lg:h-10 2xl:h-12 px-4 lg:px-5 2xl:px-8 text-[12px] lg:text-sm 2xl:text-base font-semibold shadow-none">
                <Link to="/soumettre" className="flex items-center">
                  <FilePlus className="w-4 h-4 md:mr-0 lg:mr-2 2xl:w-5 2xl:h-5" /> 
                  <span className="hidden lg:inline">Déposer une plainte</span>
                  <span className="hidden md:inline lg:hidden">Déposer</span>
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 2xl:w-12 2xl:h-12 rounded-full bg-muted border border-border/60 hover:bg-muted/80 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="text-[12px] lg:text-sm 2xl:text-base font-bold text-foreground">
                    {getInitials(profile?.username)}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 2xl:w-64 rounded-xl p-2 mt-1">
                  <DropdownMenuLabel className="px-2 py-1.5 mb-1">
                    <p className="text-sm 2xl:text-base font-semibold text-foreground truncate">@{profile?.username ?? 'Membre'}</p>
                    <p className="text-xs 2xl:text-sm text-muted-foreground truncate">{profile?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <div className="flex flex-col gap-0.5">
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link to="/tableau-de-bord" className="flex items-center gap-2.5 px-2 py-2 text-sm 2xl:text-base">
                        <LayoutDashboard className="w-4 h-4 2xl:w-5 2xl:h-5 text-muted-foreground" /> Mon espace
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link to="/messages" className="flex items-center gap-2.5 px-2 py-2 text-sm 2xl:text-base">
                        <MessageSquare className="w-4 h-4 2xl:w-5 2xl:h-5 text-muted-foreground" /> Messagerie
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link to="/tableau-de-bord?tab=profil" className="flex items-center gap-2.5 px-2 py-2 text-sm 2xl:text-base">
                        <UserCircle2 className="w-4 h-4 2xl:w-5 2xl:h-5 text-muted-foreground" /> Mon profil public
                      </Link>
                    </DropdownMenuItem>
                    
                    {profile?.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                          <Link to="/admin" className="flex items-center gap-2.5 px-2 py-2 text-sm 2xl:text-base font-semibold text-amber-600 dark:text-amber-500">
                            <ShieldAlert className="w-4 h-4 2xl:w-5 2xl:h-5" /> Espace Administration
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 px-2 py-2 text-sm 2xl:text-base">
                    <LogOut className="w-4 h-4 2xl:w-5 2xl:h-5 mr-2.5" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-1 lg:gap-2 animate-in fade-in">
              <Button asChild variant="ghost" size="sm" className="h-9 lg:h-10 2xl:h-12 px-3 lg:px-4 2xl:px-6 text-[12px] lg:text-sm 2xl:text-base font-medium rounded-full">
                <Link to="/connexion">Connexion</Link>
              </Button>
              <Button asChild size="sm" className="h-9 lg:h-10 2xl:h-12 px-4 lg:px-5 2xl:px-8 text-[12px] lg:text-sm 2xl:text-base font-semibold rounded-full shadow-none">
                <Link to="/inscription">S'inscrire</Link>
              </Button>
            </div>
          )}
        </div>

        {/* MENU MOBILE (HAMBURGER) - Uniquement < lg (téléphones et tablettes) */}
        <div className="lg:hidden flex items-center">
          {loading ? (
            <Skeleton className="w-10 h-10 rounded-full" />
          ) : (
            <button
              onClick={() => setMobileOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors text-foreground"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-6 h-6" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* DRAWER MOBILE — TRES EPURE */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        {/* On force une hauteur adaptative pour mobile (h-[100dvh] ou h-full) et on évite le scroll root overflow-y */}
        <SheetContent side="right" className="w-[85vw] max-w-[400px] sm:w-[380px] p-0 border-none bg-background flex flex-col h-[100dvh] shadow-2xl safe-area-padding" hideClose>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/40">
            <Logo onClick={() => setMobileOpen(false)} />
            <button 
              onClick={() => setMobileOpen(false)} 
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-8 pb-safe">
            <nav className="flex flex-col gap-6">
              {(user ? USER_LINKS : VISITOR_LINKS).map(link => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-4 text-xl font-medium tracking-tight transition-colors ${
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${active ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted border-border/50 text-muted-foreground'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-10 pt-8 border-t border-border/40">
              {user ? (
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Espace Membre</p>
                  
                  <Link to="/tableau-de-bord" className="flex items-center gap-3 text-lg font-medium text-foreground hover:opacity-70">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    Mon Tableau de bord
                  </Link>
                  
                  <Link to="/messages" className="flex items-center gap-3 text-lg font-medium text-foreground hover:opacity-70">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    Messagerie
                  </Link>
                  
                  <Link to="/tableau-de-bord?tab=profil" className="flex items-center gap-3 text-lg font-medium text-foreground hover:opacity-70">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <UserCircle2 className="w-4 h-4" />
                    </div>
                    Profil public
                  </Link>
                  
                  <Link to="/soumettre" className="flex items-center gap-3 text-lg font-bold text-primary hover:opacity-70 mt-2 bg-primary/5 p-3 rounded-xl border border-primary/20">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <FilePlus className="w-4 h-4" />
                    </div>
                    Déposer une plainte
                  </Link>

                  {profile?.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-3 text-lg font-bold text-amber-600 hover:opacity-70 mt-6 pt-4 border-t border-border/40">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      Espace Administration
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button asChild size="lg" className="w-full h-14 rounded-xl text-base font-semibold shadow-none group">
                    <Link to="/inscription">
                      Créer un compte
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full h-14 rounded-xl text-base border-border">
                    <Link to="/connexion">Se connecter</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {user && (
            <div className="p-6 pb-safe border-t border-border/40 shrink-0">
              <button 
                onClick={handleSignOut} 
                className="flex items-center gap-2 text-base font-medium text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Se déconnecter
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </header>
  );
}

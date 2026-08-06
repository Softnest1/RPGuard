import { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Mail, Users,
  Shield, ChevronRight, LogOut, Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NAV = [
  { href: '/admin',            label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/admin/plaintes',   label: 'Gestion Plaintes', icon: FileText },
  { href: '/admin/messages',   label: 'Interventions',    icon: Mail },
  { href: '/admin/membres',    label: 'Modération',       icon: Users },
  { href: '/admin/actualites', label: 'Actualités',       icon: Activity },
  { href: '/admin/diagnostic', label: 'Système',          icon: Shield },
];

export default function AdminLayout() {
  const { profile, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile?.role !== 'admin') navigate('/', { replace: true });
  }, [loading, profile, navigate]);

  if (loading || profile?.role !== 'admin') return null;

  const isActive = (href: string, exact = false) =>
    exact ? location.pathname === href : location.pathname.startsWith(href);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-card">
        {/* Logo */}
        <div className="flex flex-col px-6 py-6 border-b border-border">
          <Link to="/admin" className="min-w-0 group">
            <span className="text-[20px] font-extrabold text-foreground leading-none tracking-tighter">
              RP<span className="opacity-50 font-medium">Guard</span>
            </span>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1.5 transition-colors group-hover:text-foreground">Administration</p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 p-3 flex-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary/8 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : ''}`} />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-primary" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer sidebar */}
        <div className="p-3 border-t border-border space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            Retour au site
          </Link>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-destructive hover:bg-destructive/8 transition-all"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top-bar mobile */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-foreground flex-1">Admin RPGuard</span>
        </div>
        {/* Nav mobile horizontale */}
        <div className="md:hidden overflow-x-auto border-b border-border bg-card">
          <div className="flex gap-1 px-3 py-2 min-w-max">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  to={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-primary/8 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

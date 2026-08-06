import { useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Shield, ArrowRight, Users, FileText, Server, Zap, Eye, HandHeart,
  ChevronRight, FilePlus, TrendingUp, Swords, Flame, Trophy, CheckCircle, Activity,
  Info, Wrench, PackagePlus
} from 'lucide-react';
import PlainteCard from '@/components/common/PlainteCard';
import PageMeta from '@/components/common/PageMeta';
import PageContainer from '@/components/layouts/PageContainer';
import { fetchStatsQuick, fetchStats, fetchRecentPlaintesLight, fetchPlaintes, fetchWonPlaintes, fetchNews } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Plainte, PlaintegStats, News } from '@/types/types';

// ── Constantes & Données Statiques ─────────────────────────────────────────

const WHY_ITEMS = [
  { icon: Eye, title: 'Visibilité publique', desc: "Vos signalements sont visibles par toute la communauté. Les abus ne restent plus dans l'ombre." },
  { icon: Users, title: 'Force collective', desc: 'Chaque vote amplifie votre plainte. Ensemble, votre voix compte davantage.' },
  { icon: HandHeart, title: 'Protection de la communauté', desc: "Aidez les autres joueurs à choisir des serveurs sains avant de s'y investir." },
  { icon: Zap, title: 'Pression réelle', desc: 'Les administrateurs abusifs savent que leurs actions ont des conséquences visibles.' },
];

const HOW_STEPS = [
  { num: '01', title: 'Créez votre compte', desc: "Inscription gratuite en moins d'une minute, 100% anonyme et sécurisée." },
  { num: '02', title: 'Montez votre dossier', desc: "Décrivez l'abus, citez le serveur et consolidez avec vos meilleures preuves (vidéos, screens)." },
  { num: '03', title: 'La communauté tranche', desc: "Les joueurs votent et débattent. Les dossiers solides font plier les mauvaises gestions." },
];

const FAQ = [
  { q: 'Qu\'est-ce qu\'un "dossier solide" ?', a: "Un dossier avec un score de 80/100 ou plus. Il combine : une vidéo ou capture horodatée, une description de 200+ caractères, la date de l'incident, la raison et le contexte. Ces éléments rendent votre plainte crédible et difficile à contester." },
  { q: 'Puis-je rester anonyme ?', a: 'Absolument. Aucune adresse e-mail n\'est demandée lors de l\'inscription. Vous pouvez utiliser un Pseudo RP différent de votre vrai pseudo pour protéger votre identité en jeu.' },
  { q: 'Quelle preuve est la plus efficace ?', a: 'La vidéo est reine : elle vaut +30 points et est impossible à contester si le pseudo du fautif est visible. Une capture horodatée vaut +15 points. Sans preuve, votre plainte sera facilement contestée par la communauté.' },
  { q: 'Que se passe-t-il quand une plainte est "Validée" ?', a: 'Une plainte gagne le statut "Validée" lorsque les preuves sont irréfutables et le soutien communautaire est fort. Elle est alors mise en avant dans nos classements et impacte durablement la réputation du serveur.' },
];

// ── Sous-Composants Purs ───────────────────────────────────────────────────

function StatCard({ icon: Icon, value, label, highlight = false }: { icon: React.ElementType, value: number, label: string, highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 p-4 md:p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      <Icon className={`w-6 h-6 mb-2 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className={`text-3xl md:text-4xl font-black tabular-nums leading-none tracking-tight ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value.toLocaleString('fr-FR')}
      </span>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

function SectionHeader({ title, description, badge, badgeIcon: BadgeIcon, badgeColor = "primary" }: { title: string, description: string, badge?: string, badgeIcon?: React.ElementType, badgeColor?: "primary" | "destructive" | "green" }) {
  const colorClasses = {
    primary: "text-primary bg-primary/10 border-primary/20",
    destructive: "text-destructive bg-destructive/10 border-destructive/20",
    green: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/40 border-green-200 dark:border-green-900/50",
  };

  return (
    <div className="mb-10 max-w-2xl">
      {badge && BadgeIcon && (
        <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider rounded-full px-3 py-1 mb-4 border ${colorClasses[badgeColor]}`}>
          <BadgeIcon className="w-3.5 h-3.5" /> {badge}
        </div>
      )}
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 text-balance tracking-tight">
        {title}
      </h2>
      <p className="text-lg text-muted-foreground text-pretty">
        {description}
      </p>
    </div>
  );
}

// Variables globales pour faire office de cache ultra-rapide en mémoire (évite les clignotements à chaque retour sur l'accueil)
let cachedHomeStats: PlaintegStats | null = null;
let cachedHomeRecent: Plainte[] | null = null;
let cachedHomeNews: News[] | null = null;
let cachedHomeViral: Plainte[] | null = null;
let cachedHomeWon: Plainte[] | null = null;

// ── Composant Principal HomePage ───────────────────────────────────────────

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  
  // États de données avec initialisation depuis le cache si disponible
  const [stats, setStats] = useState<PlaintegStats>(cachedHomeStats || { total: 0, servers: 0, users: 0, today: 0, won: 0 });
  const [recentPlaintes, setRecentPlaintes] = useState<Plainte[]>(cachedHomeRecent || []);
  const [viralPlaintes, setViralPlaintes] = useState<Plainte[]>(cachedHomeViral || []);
  const [wonPlaintes, setWonPlaintes] = useState<Plainte[]>(cachedHomeWon || []);
  const [latestNews, setLatestNews] = useState<News[]>(cachedHomeNews || []);
  const [dataLoading, setDataLoading] = useState(!cachedHomeRecent);

  // Optimisation du fetch stratifié
  useEffect(() => {
    let active = true;
    
    const loadData = async () => {
      try {
        // Phase 1 : Données immédiates et légères
        const phase1Data = await Promise.all([
          fetchStatsQuick(),
          fetchRecentPlaintesLight(4),
          user?.id ? fetchNews(user.id) : Promise.resolve([])
        ]);
        
        if (!active) return;
        cachedHomeStats = phase1Data[0];
        cachedHomeRecent = phase1Data[1];
        cachedHomeNews = phase1Data[2].slice(0, 3);
        
        setStats(cachedHomeStats);
        setRecentPlaintes(cachedHomeRecent);
        setLatestNews(cachedHomeNews);
        setDataLoading(false);

        // Phase 2 : Données Lourdes (Statistiques précises, viralité, victoires)
        // Lancer les appels lourds sans attendre
        Promise.all([
          fetchStats(),
          fetchPlaintes({ status: 'Viral', sortBy: 'votes', limit: 4 }),
          fetchWonPlaintes(4)
        ]).then(([fullStats, viral, won]) => {
          if (!active) return;
          cachedHomeStats = fullStats;
          cachedHomeViral = viral;
          cachedHomeWon = won;
          
          setStats(fullStats);
          setViralPlaintes(viral);
          setWonPlaintes(won);
        }).catch(err => {
          console.error("Erreur Phase 2 HomePage:", err);
        });

      } catch (err) {
        console.error("Erreur chargement HomePage Phase 1:", err);
        if (active) setDataLoading(false);
      }
    };

    loadData();
    return () => { active = false; };
  }, [user]);

  return (
    <div className="flex flex-col w-full bg-background min-h-screen">
      <PageMeta 
        title="RPGuard — Justice Communautaire et Signalement d'Abus RP" 
        description="RPGuard est la première plateforme indépendante pour signaler les abus d'administrateurs sur GTA RP, FiveM et RedM. Constituez votre dossier, apportez vos preuves et laissez la communauté faire le tri." 
        keywords="GTA RP, FiveM, RedM, signalement abus, administrateurs abusifs, justice communautaire, plainte RP, serveur RP français"
      />

      {/* ── HERO STRATÉGIQUE ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border pt-16 pb-24 md:pt-28 md:pb-36 2xl:pt-40 2xl:pb-48 4xl:pt-56 4xl:pb-64 bg-muted/10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
        
        <PageContainer width="xl" className="relative text-center md:text-left flex flex-col md:items-start items-center">
          {authLoading ? (
            <Skeleton className="h-6 w-32 rounded-full mb-8" />
          ) : !user && (
            <div className="inline-flex items-center gap-1.5 text-xs 2xl:text-sm 4xl:text-base font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1 2xl:px-4 2xl:py-2 mb-8 2xl:mb-12">
              <Shield className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 4xl:w-5 4xl:h-5" /> 100% Indépendant
            </div>
          )}

          <h1 className="text-4xl md:text-6xl xl:text-7xl 2xl:text-[5.5rem] 4xl:text-[7rem] font-extrabold tracking-tight text-foreground leading-[1.1] mb-6 2xl:mb-10 text-balance max-w-4xl 2xl:max-w-6xl 4xl:max-w-7xl">
            Vos preuves. Notre force. <span className="text-muted-foreground font-light">Zéro impunité.</span>
          </h1>

          <p className="text-lg md:text-xl 2xl:text-2xl 4xl:text-3xl text-muted-foreground font-medium mb-10 2xl:mb-14 max-w-2xl 2xl:max-w-4xl 4xl:max-w-5xl leading-relaxed text-pretty">
            {authLoading ? (
              <Skeleton className="h-8 w-full max-w-2xl" />
            ) : user ? (
              "Le hub central de la communauté RP. Consultez les derniers dossiers ou accédez à votre espace pour gérer vos plaintes."
            ) : (
              "La première plateforme communautaire pour signaler, documenter et combattre les abus de pouvoir dans les serveurs de jeu de rôle. Protégez la communauté."
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 2xl:gap-6 w-full sm:w-auto mt-4 2xl:mt-8">
            {authLoading ? (
              <>
                <Skeleton className="h-14 2xl:h-16 4xl:h-20 w-full sm:w-56 2xl:w-64 rounded-full" />
                <Skeleton className="h-14 2xl:h-16 4xl:h-20 w-full sm:w-48 2xl:w-56 rounded-full" />
              </>
            ) : user ? (
              <>
                <Button asChild size="lg" className="h-14 2xl:h-16 4xl:h-20 rounded-full px-8 2xl:px-12 text-base 2xl:text-lg 4xl:text-xl shadow-sm w-full sm:w-auto group">
                  <Link to="/tableau-de-bord">
                    Accéder à mon espace
                    <ArrowRight className="w-5 h-5 2xl:w-6 2xl:h-6 ml-2 2xl:ml-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 2xl:h-16 4xl:h-20 rounded-full px-8 2xl:px-12 text-base 2xl:text-lg 4xl:text-xl border-border bg-background/50 backdrop-blur-sm w-full sm:w-auto">
                  <Link to="/soumettre"><FilePlus className="w-5 h-5 2xl:w-6 2xl:h-6 mr-2 2xl:mr-3" /> Nouveau signalement</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" className="h-14 2xl:h-16 4xl:h-20 rounded-full px-8 2xl:px-12 text-base 2xl:text-lg 4xl:text-xl shadow-sm w-full sm:w-auto group">
                  <Link to="/soumettre">
                    Faire un signalement
                    <ArrowRight className="w-5 h-5 2xl:w-6 2xl:h-6 ml-2 2xl:ml-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 2xl:h-16 4xl:h-20 rounded-full px-8 2xl:px-12 text-base 2xl:text-lg 4xl:text-xl border-border bg-background/50 backdrop-blur-sm w-full sm:w-auto">
                  <Link to="/plaintes">Consulter les dossiers</Link>
                </Button>
              </>
            )}
          </div>
          
          {/* Quick trust metrics pour les visiteurs */}
          {!user && !authLoading && (
            <div className="mt-8 2xl:mt-12 flex items-center gap-4 2xl:gap-6 text-sm 2xl:text-base 4xl:text-lg font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5 2xl:gap-2"><Shield className="w-4 h-4 2xl:w-5 2xl:h-5 text-primary" /> Anonymat garanti</span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1.5 2xl:gap-2"><Users className="w-4 h-4 2xl:w-5 2xl:h-5 text-primary" /> {stats.users > 0 ? `${stats.users}+ membres` : 'Communauté active'}</span>
            </div>
          )}
        </PageContainer>
      </section>

      {/* ── NOUVEAU BLOC: ACTUALITÉS (Seulement pour utilisateurs connectés) ───────────────────────── */}
      {!authLoading && user && (
        <section className="py-8 md:py-12 border-b border-border bg-background">
          <PageContainer width="xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> Dernières actualités
                </h3>
                <p className="text-sm text-muted-foreground mt-1">L'évolution de la plateforme en temps réel.</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                <Link to="/actualites">Voir tout le journal <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
              </Button>
            </div>
            
            {dataLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl w-full" />
                ))}
              </div>
            ) : latestNews.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-xl bg-muted/10 text-muted-foreground">
                Aucune actualité pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {latestNews.map((newsItem, idx) => {
                  const typeStyles = {
                    feature: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/50',
                    improvement: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50',
                    fix: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
                    news: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50'
                  };
                  const typeLabels = {
                    feature: 'Fonctionnalité',
                    improvement: 'Amélioration',
                    fix: 'Correctif',
                    news: 'Actualité'
                  };
                  
                  return (
                    <Link key={newsItem.id} to="/actualites" className={`group p-5 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors flex flex-col gap-3 ${idx === 2 ? 'hidden xl:flex' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeStyles[newsItem.type]}`}>
                          {typeLabels[newsItem.type]}
                        </span>
                        {newsItem.version && (
                          <span className="text-xs font-semibold text-foreground/70">{newsItem.version}</span>
                        )}
                      </div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{newsItem.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{newsItem.content.replace(/<[^>]*>?/gm, '').replace(/\\n/g, ' ')}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </PageContainer>
        </section>
      )}

      {/* ── STATS DYNAMIQUES ────────────────────────────────────────────── */}
      <section className="border-b border-border bg-background">
        <PageContainer width="xl" className="py-8 md:py-12 2xl:py-16 4xl:py-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 2xl:gap-10 4xl:gap-16">
            <StatCard icon={FileText} value={stats.total} label="Plaintes actives" />
            <StatCard icon={Server} value={stats.servers} label="Serveurs visés" />
            <StatCard icon={Users} value={stats.users} label="Membres inscrits" />
            <StatCard icon={Trophy} value={stats.won} label="Plaintes remportées" highlight />
          </div>
        </PageContainer>
      </section>

      {/* ── COMMENT ÇA MARCHE (Visiteurs uniquement, placé haut pour conversion) ── */}
      {!authLoading && !user && (
        <section className="py-16 md:py-24 2xl:py-32 4xl:py-48 border-b border-border bg-muted/10">
          <PageContainer width="xl">
            <SectionHeader title="La méthode RPGuard" description="Un processus simple, anonyme et redoutablement efficace." />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 2xl:gap-16 4xl:gap-24">
              {HOW_STEPS.map((step, i) => (
                <div key={step.num} className="relative">
                  {i !== 2 && <div className="hidden md:block absolute top-8 2xl:top-10 left-16 2xl:left-20 right-0 border-t-2 border-dashed border-border/60" />}
                  <div className="w-16 h-16 2xl:w-20 2xl:h-20 rounded-2xl bg-background border border-border flex items-center justify-center text-2xl 2xl:text-3xl font-black text-foreground mb-6 2xl:mb-8 relative z-10 shadow-sm">
                    {step.num}
                  </div>
                  <h3 className="text-2xl 2xl:text-3xl font-bold text-foreground mb-3 2xl:mb-4">{step.title}</h3>
                  <p className="text-base 2xl:text-xl text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </PageContainer>
        </section>
      )}

      {/* ── POURQUOI SIGNALER (Visiteurs uniquement) ───────────────────────── */}
      {!authLoading && !user && (
        <section className="py-16 md:py-24 2xl:py-32 4xl:py-48 bg-background border-b border-border">
          <PageContainer width="xl">
            <SectionHeader 
              title="Pourquoi briser le silence ?" 
              description="Le silence profite aux administrateurs toxiques. RPGuard rééquilibre le rapport de force."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 4xl:grid-cols-4 gap-6 2xl:gap-8 4xl:gap-12">
              {WHY_ITEMS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-6 md:p-8 2xl:p-10 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 2xl:w-16 2xl:h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-5 2xl:mb-8">
                    <Icon className="w-6 h-6 2xl:w-8 2xl:h-8 text-primary" />
                  </div>
                  <h3 className="text-xl 2xl:text-2xl font-bold text-foreground mb-3 2xl:mb-4">{title}</h3>
                  <p className="text-sm md:text-base 2xl:text-lg text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </PageContainer>
        </section>
      )}

      {/* ── DOSSIERS CHAUDS (VIRAL) ─────────────────────────────────────── */}
      {viralPlaintes.length > 0 && (
        <section className="py-16 md:py-24 2xl:py-32 4xl:py-48 border-b border-border bg-muted/10">
          <PageContainer width="xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 2xl:mb-16">
              <SectionHeader 
                title="Dossiers chauds" 
                description="Les signalements qui font le plus de bruit dans la communauté actuellement."
                badge="Tendance" badgeIcon={Flame} badgeColor="destructive"
              />
              <Button asChild variant="outline" className="hidden md:flex shrink-0 rounded-full 2xl:h-12 2xl:px-6 2xl:text-base">
                <Link to="/plaintes">Voir tous les dossiers <ArrowRight className="w-4 h-4 2xl:w-5 2xl:h-5 ml-2" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 4xl:grid-cols-5 gap-4 2xl:gap-6 4xl:gap-8">
              {viralPlaintes.map(p => <PlainteCard key={p.id} plainte={p} />)}
            </div>
            <Button asChild variant="outline" className="w-full mt-6 md:hidden rounded-full">
              <Link to="/plaintes">Voir tous les dossiers</Link>
            </Button>
          </PageContainer>
        </section>
      )}

      {/* ── DERNIERS DOSSIERS ───────────────────────────────────────────── */}
      <section className="py-16 md:py-24 2xl:py-32 4xl:py-48 border-b border-border">
        <PageContainer width="xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 2xl:mb-16">
            <SectionHeader 
              title="Récemment signalés" 
              description="La communauté veille. Voici les derniers abus rapportés."
              badge="En direct" badgeIcon={Zap}
            />
          </div>

          {dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 4xl:grid-cols-5 gap-4 2xl:gap-6 4xl:gap-8">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-[280px] 2xl:h-[320px] rounded-2xl w-full" />
              ))}
            </div>
          ) : recentPlaintes.length === 0 ? (
            <div className="text-center py-16 px-4 border border-dashed border-border rounded-xl bg-muted/10">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-foreground mb-2">Aucune plainte n'a été déposée.</h3>
              <p className="text-muted-foreground mb-6">Le calme avant la tempête. Soyez le premier lanceur d'alerte.</p>
              <Button asChild><Link to="/soumettre">Déposer une plainte</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 4xl:grid-cols-5 gap-4 2xl:gap-6 4xl:gap-8">
              {recentPlaintes.map(p => <PlainteCard key={p.id} plainte={p} />)}
            </div>
          )}
        </PageContainer>
      </section>

      {/* ── VICTOIRES COMMUNAUTAIRES (WON) ──────────────────────────────── */}
      {wonPlaintes.length > 0 && (
        <section className="py-16 md:py-24 2xl:py-32 4xl:py-48 border-b border-border bg-card">
          <PageContainer width="xl">
            <SectionHeader 
              title="Victoires communautaires" 
              description="Preuves irréfutables, soutien massif : ces plaintes ont été validées par l'équipe RPGuard."
              badge="Vérifié" badgeIcon={CheckCircle} badgeColor="green"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 4xl:grid-cols-5 gap-4 2xl:gap-6 4xl:gap-8">
              {wonPlaintes.map(p => <PlainteCard key={p.id} plainte={p} />)}
            </div>
          </PageContainer>
        </section>
      )}

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 2xl:py-32 4xl:py-48 bg-card border-b border-border">
        <PageContainer width="xl" className="max-w-4xl 2xl:max-w-5xl 4xl:max-w-6xl mx-auto">
          <SectionHeader title="Questions Fréquentes" description="Tout ce qu'il faut savoir sur la modération et la protection sur RPGuard." />
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border">
                <AccordionTrigger className="text-base md:text-lg 2xl:text-xl font-bold text-left py-6 2xl:py-8 hover:text-primary transition-colors">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-base md:text-lg 2xl:text-xl text-muted-foreground pb-6 2xl:pb-8 leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </PageContainer>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────────────────────── */}
      {!user && !authLoading ? (
        <section className="py-24 md:py-32 2xl:py-40 4xl:py-56 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:32px_32px] 2xl:bg-[size:48px_48px] opacity-20 pointer-events-none" />
          <PageContainer width="xl" className="relative text-center flex flex-col items-center">
            <h2 className="text-3xl md:text-5xl 2xl:text-6xl 4xl:text-[5rem] font-black mb-6 2xl:mb-10 text-balance tracking-tight">
              Prêt à assainir le RP Francophone ?
            </h2>
            <p className="text-lg md:text-xl 2xl:text-2xl 4xl:text-3xl font-medium text-primary-foreground/80 mb-10 2xl:mb-14 max-w-2xl 2xl:max-w-4xl 4xl:max-w-5xl text-pretty">
              Rejoignez des milliers de joueurs qui ont décidé de ne plus subir en silence. L'inscription prend 30 secondes.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 2xl:gap-6 w-full sm:w-auto">
              <Button asChild size="lg" variant="secondary" className="h-14 2xl:h-16 4xl:h-20 rounded-full px-8 2xl:px-12 text-base 2xl:text-lg 4xl:text-xl shadow-sm w-full sm:w-auto font-bold text-primary">
                <Link to="/inscription">Créer un compte gratuit</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 2xl:h-16 4xl:h-20 rounded-full px-8 2xl:px-12 text-base 2xl:text-lg 4xl:text-xl border-primary-foreground/30 text-primary hover:bg-primary-foreground/10 w-full sm:w-auto">
                <Link to="/guide">Lire le guide stratégique</Link>
              </Button>
            </div>
          </PageContainer>
        </section>
      ) : user && (
        <section className="py-24 md:py-32 2xl:py-40 4xl:py-56 bg-muted/20 border-t border-border relative overflow-hidden">
          <PageContainer width="xl" className="relative text-center flex flex-col items-center">
            <h2 className="text-3xl md:text-5xl 2xl:text-6xl 4xl:text-[5rem] font-black mb-6 2xl:mb-10 text-balance tracking-tight text-foreground">
              Continuez le combat.
            </h2>
            <p className="text-lg md:text-xl 2xl:text-2xl 4xl:text-3xl font-medium text-muted-foreground mb-10 2xl:mb-14 max-w-2xl 2xl:max-w-4xl 4xl:max-w-5xl text-pretty">
              Consultez le classement des serveurs pour voir comment la communauté a sanctionné les abus, ou gérez vos propres dossiers depuis votre espace.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 2xl:gap-6 w-full sm:w-auto">
              <Button asChild size="lg" className="h-14 2xl:h-16 4xl:h-20 rounded-full px-8 2xl:px-12 text-base 2xl:text-lg 4xl:text-xl shadow-sm w-full sm:w-auto font-bold">
                <Link to="/serveurs">Voir le classement des serveurs</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 2xl:h-16 4xl:h-20 rounded-full px-8 2xl:px-12 text-base 2xl:text-lg 4xl:text-xl border-border bg-background w-full sm:w-auto">
                <Link to="/tableau-de-bord">Gérer mes plaintes</Link>
              </Button>
            </div>
          </PageContainer>
        </section>
      )}

    </div>
  );
}

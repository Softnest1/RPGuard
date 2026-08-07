import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import ScrollToTop from '@/components/common/ScrollToTop';
import RequireAuth from '@/components/common/RequireAuth';
import PageErrorBoundary from '@/components/common/PageErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import AdminLayout from '@/components/layouts/AdminLayout';
import NotFound from '@/pages/NotFound';
import SelfHealingCore from '@/components/common/SelfHealingCore';
import { routes, adminRoutes } from './routes';

// Pages en plein écran sans Header/Footer (split-screen)
const FULLSCREEN_PATHS = ['/connexion', '/inscription', '/mot-de-passe-oublie'];

// Fallback minimaliste pendant le chargement d'un chunk lazy
const PageLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-muted"></div>
      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
    </div>
    <p className="text-sm font-medium text-muted-foreground animate-pulse">Chargement en cours...</p>
  </div>
);

const LayoutWrapper: React.FC = () => {
  const location = useLocation();
  const isFullscreen = FULLSCREEN_PATHS.includes(location.pathname);

  return (
    <>
      <SelfHealingCore />
      <ScrollToTop />
      {!isFullscreen && <Header />}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <PageErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {routes.map((route, index) =>
                route.public === false ? (
                  <Route
                    key={index}
                    path={route.path}
                    element={<RequireAuth>{route.element}</RequireAuth>}
                  />
                ) : (
                  <Route key={index} path={route.path} element={route.element} />
                )
              )}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </PageErrorBoundary>
      </main>
      {!isFullscreen && <Footer />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <IntersectObserver />
        <Routes>
          {/* Espace administrateur — layout isolé, protection dans AdminLayout */}
          <Route path="/admin" element={<AdminLayout />}>
            {adminRoutes.map((route, index) => (
              route.index
                ? <Route key={index} index element={route.element} />
                : <Route key={index} path={route.path} element={route.element} />
            ))}
          </Route>

          {/* Site public — layout standard */}
          <Route
            path="*"
            element={
              <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden relative">
                <LayoutWrapper />
              </div>
            }
          />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
};

export default App;

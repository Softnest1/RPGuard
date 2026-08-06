import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import "./index.css";

Sentry.init({
  dsn: import.meta.env['VITE_SENTRY_DSN'] as string | undefined,
  environment: import.meta.env.MODE,
});

// Fallback d'erreur global — affiché en cas de crash React non récupéré
function GlobalErrorFallback() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#555', gap: '16px', padding: '24px',
      textAlign: 'center',
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e5534b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <div>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>Une erreur inattendue est survenue</p>
        <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: 20 }}>RPGuard a rencontré un problème. Vos données sont en sécurité.</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 24px', borderRadius: '99px', background: '#111', color: '#fff',
            border: 'none', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500,
          }}
        >
          Rafraîchir la page
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<GlobalErrorFallback />}>
    <AppWrapper>
      <App />
    </AppWrapper>
  </Sentry.ErrorBoundary>
);

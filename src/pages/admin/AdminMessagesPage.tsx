import { Mail } from 'lucide-react';

export default function AdminMessagesPage() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Messages (Déprécié)</h1>
          <p className="text-sm text-muted-foreground mt-1">Le système de messagerie a été migré vers WhatsApp.</p>
        </div>
      </div>
      <div className="p-8 text-center border border-border rounded-xl bg-card">
        <Mail className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Interface désactivée</h2>
        <p className="text-muted-foreground">Les prises de contact se font désormais via WhatsApp.<br/>Cette page sera supprimée prochainement.</p>
      </div>
    </div>
  );
}

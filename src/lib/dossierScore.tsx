// Module partagé — logique de score de dossier
// Utilisé par PlainteDetailPage et SoumettreePage
import { TrendingUp } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DossierScoreInput {
  hasPreuves:     boolean;
  hasVideo:       boolean;
  descriptionLen: number;
  hasDate:        boolean;
  hasContexte:    boolean;
  nbAccuses:      number;
  hasRaison:      boolean;
}

export interface DossierScoreResult {
  score:    number;   // 0–100
  label:    string;
  color:    string;
  barColor: string;
  tips:     string[];
}

// ── Calcul du score ───────────────────────────────────────────────────────────

export function computeDossierScore(input: DossierScoreInput): DossierScoreResult {
  let score = 0;
  const tips: string[] = [];

  if (input.hasVideo)                   { score += 30; }
  else if (input.hasPreuves)            { score += 15; tips.push('Ajouter une vidéo double la force de vos preuves'); }
  else                                  { tips.push('Aucune preuve — risque élevé de rejet'); }

  if (input.descriptionLen >= 200)      { score += 25; }
  else if (input.descriptionLen >= 100) { score += 15; tips.push('Description plus détaillée (200+ caractères recommandés)'); }
  else if (input.descriptionLen >= 30)  { score += 8;  tips.push('Détaillez davantage les faits'); }
  else                                  { tips.push('Description trop courte'); }

  if (input.hasRaison)    { score += 15; }
  else                    { tips.push("Précisez la raison du signalement (étape 2)"); }

  if (input.hasDate)      { score += 15; }
  else                    { tips.push("Renseignez la date de l'incident (étape 1)"); }

  if (input.hasContexte)  { score += 10; }
  else                    { tips.push('Ajouter un contexte renforce la crédibilité'); }

  if (input.nbAccuses >= 2) { score += 5; }

  score = Math.min(100, score);

  let label    = 'Dossier faible';
  let color    = 'text-red-600';
  let barColor = 'bg-red-500';
  if (score >= 80)      { label = 'Dossier solide';  color = 'text-green-600';  barColor = 'bg-green-500'; }
  else if (score >= 55) { label = 'Dossier correct'; color = 'text-amber-600';  barColor = 'bg-amber-500'; }
  else if (score >= 30) { label = 'Dossier partiel'; color = 'text-orange-500'; barColor = 'bg-orange-500'; }

  return { score, label, color, barColor, tips };
}

// ── Widget compact (SoumettreePage) ───────────────────────────────────────────

export function DossierScoreWidget({ score: s, className = '' }: { score: DossierScoreResult; className?: string }) {
  return (
    <div className={`p-4 rounded-2xl border border-border bg-card ${className}`}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Force du dossier</span>
        </div>
        <span className={`text-sm font-bold tabular-nums ${s.color}`}>{s.score}/100 — {s.label}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${s.barColor}`}
          style={{ width: `${s.score}%` }}
        />
      </div>
      {s.tips.length > 0 && (
        <ul className="flex flex-col gap-1">
          {s.tips.map((t) => (
            <li key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Bannière (PlainteDetailPage) ──────────────────────────────────────────────

export function DossierScoreBanner({ score: s, className = '' }: { score: DossierScoreResult; className?: string }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border border-border bg-card ${className}`}>
      <div className="shrink-0 flex flex-col items-center">
        <span className={`text-2xl font-bold tabular-nums leading-none ${s.color}`}>{s.score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className={`text-xs font-semibold ${s.color}`}>{s.label}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${s.barColor}`} style={{ width: `${s.score}%` }} />
        </div>
      </div>
    </div>
  );
}

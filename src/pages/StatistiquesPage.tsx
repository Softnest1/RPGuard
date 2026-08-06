import React from 'react';
import PageMeta from '@/components/common/PageMeta';
import { BarChart3, TrendingUp, AlertTriangle, Shield, Clock } from 'lucide-react';
import { supabase } from '@/db/supabase';

// Mock data pour la démo, en production cela viendrait de l'API Supabase
const statsData = {
  totalPlaintes: 1243,
  resolvedPlaintes: 856,
  avgResolutionTime: '4.2 jours',
  topAbus: [
    { type: 'Bannissement sans raison', count: 432 },
    { type: 'Abus de commandes (Godmode/Noclip)', count: 310 },
    { type: 'Insultes / Manque de respect (Staff)', count: 215 },
    { type: 'Favoritisme', count: 156 },
  ]
};

export default function StatistiquesPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
      <PageMeta 
        title="Statistiques de Transparence RPGuard — Abus et Signalements RP"
        description="Consultez les statistiques publiques de RPGuard sur les abus d'administrateurs dans les serveurs GTA RP. Transparence totale sur les signalements et taux de résolution."
        keywords="statistiques abus RP, transparence serveurs RP, plaintes GTA RP, RPGuard stats"
      />

      <div className="flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl mb-6 ring-1 ring-blue-500/20">
          <BarChart3 className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 tracking-tight text-balance">
          Transparence & Données
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Parce que la justice exige de la transparence, RPGuard rend publiques les tendances d'abus sur la scène RP. Découvrez l'impact de vos signalements.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        <div className="p-6 bg-card border border-border rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Plaintes Déposées</h3>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold">{statsData.totalPlaintes}</p>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-500" /> +12% ce mois-ci
          </p>
        </div>

        <div className="p-6 bg-card border border-border rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Dossiers Résolus</h3>
            <Shield className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold">{statsData.resolvedPlaintes}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Soit {Math.round((statsData.resolvedPlaintes / statsData.totalPlaintes) * 100)}% de taux de résolution
          </p>
        </div>

        <div className="p-6 bg-card border border-border rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Serveurs Labellisés</h3>
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">14</p>
          <p className="text-xs text-muted-foreground mt-2">
            Label de Confiance RPGuard
          </p>
        </div>

        <div className="p-6 bg-card border border-border rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Temps Moyen</h3>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold">{statsData.avgResolutionTime}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Pour la fermeture d'un ticket
          </p>
        </div>
      </div>

      {/* Top Motifs d'Abus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 md:p-8 bg-card border border-border rounded-2xl">
          <h3 className="text-xl font-semibold mb-6">Motifs d'Abus les Plus Courants</h3>
          <div className="space-y-6">
            {statsData.topAbus.map((abus, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{abus.type}</span>
                  <span className="text-muted-foreground">{abus.count} cas</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(abus.count / statsData.topAbus[0].count) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8 bg-card border border-border rounded-2xl flex flex-col justify-center">
          <h3 className="text-xl font-semibold mb-4">Pourquoi ces données ?</h3>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            RPGuard n'a pas vocation à détruire les serveurs, mais à assainir l'écosystème. En exposant les comportements les plus récurrents, nous aidons les fondateurs de serveurs à identifier les failles dans le recrutement de leur staff et les formations nécessaires.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ces statistiques sont mises à jour mensuellement de manière totalement anonymisée pour protéger l'identité des plaignants et des serveurs non-publiquement sanctionnés.
          </p>
        </div>
      </div>
    </div>
  );
}

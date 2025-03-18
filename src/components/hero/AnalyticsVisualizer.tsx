
import React from 'react';
import { Cpu, BarChart3, TrendingUp, Globe, Zap } from 'lucide-react';
import { formatRevenue } from '@/utils/formatters';

interface AnalyticsVisualizerProps {
  displayedAdsCount: number;
  displayedRevenueCount: number;
  variant?: 'radar' | 'globe' | 'processor' | 'bars' | 'trend';
}

const AnalyticsVisualizer = ({
  displayedAdsCount,
  displayedRevenueCount,
  variant = 'processor'
}: AnalyticsVisualizerProps) => {
  
  // Formattage des statistiques pour l'affichage
  const formattedAdsCount = displayedAdsCount.toLocaleString('fr-FR');
  const formattedRevenue = formatRevenue(displayedRevenueCount);
  
  // Rendu de la visualisation "radar" (cercles concentriques avec pulsations)
  if (variant === 'radar') {
    return (
      <div className="w-full max-w-lg bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 relative overflow-hidden">
        <h3 className="text-sm font-medium text-primary mb-3">Réseau d'analyse en activité</h3>
        
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            <span className="text-sm">Publicités analysées: <span className="font-bold">{formattedAdsCount}</span></span>
          </div>
          <div className="text-sm">
            Revenus: <span className="font-bold">{formattedRevenue}</span>
          </div>
        </div>

        <div className="relative h-[180px] flex items-center justify-center">
          {/* Cercles pulsants */}
          <div className="absolute w-[30px] h-[30px] rounded-full bg-primary/10 animate-ping"></div>
          <div className="absolute w-[60px] h-[60px] rounded-full border border-primary/20 animate-pulse"></div>
          <div className="absolute w-[100px] h-[100px] rounded-full border border-primary/15 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="absolute w-[150px] h-[150px] rounded-full border border-primary/10 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          
          {/* Centre du radar */}
          <div className="z-10 bg-primary text-primary-foreground w-14 h-14 rounded-full flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>
    );
  }
  
  // Rendu de la visualisation "globe" (réseau mondial)
  if (variant === 'globe') {
    return (
      <div className="w-full max-w-lg bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 relative overflow-hidden">
        <h3 className="text-sm font-medium text-primary mb-3">Réseau mondial CashBot</h3>
        
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            <span className="text-sm">Publicités analysées: <span className="font-bold">{formattedAdsCount}</span></span>
          </div>
          <div className="text-sm">
            Revenus: <span className="font-bold">{formattedRevenue}</span>
          </div>
        </div>

        <div className="relative h-[180px] flex items-center justify-center">
          {/* Représentation stylisée d'un globe */}
          <div className="relative w-[150px] h-[150px] rounded-full border border-primary/30 flex items-center justify-center">
            <div className="absolute w-full h-[1px] bg-primary/20 top-1/2 transform -translate-y-1/2"></div>
            <div className="absolute h-full w-[1px] bg-primary/20 left-1/2 transform -translate-x-1/2"></div>
            <div className="absolute w-[150px] h-[30px] rounded-full border border-primary/10 top-1/2 transform -translate-y-1/2"></div>
            
            {/* Points de connexion */}
            <div className="absolute h-2 w-2 bg-green-500 rounded-full animate-pulse" style={{ top: '30%', left: '20%' }}></div>
            <div className="absolute h-2 w-2 bg-blue-500 rounded-full animate-pulse" style={{ top: '60%', left: '70%' }}></div>
            <div className="absolute h-2 w-2 bg-yellow-500 rounded-full animate-pulse" style={{ top: '40%', left: '60%' }}></div>
            <div className="absolute h-2 w-2 bg-purple-500 rounded-full animate-pulse" style={{ top: '70%', left: '30%' }}></div>
            
            <Globe size={30} className="text-primary" />
          </div>
        </div>
      </div>
    );
  }
  
  // Rendu de la visualisation "processor" (représentation CPU)
  if (variant === 'processor') {
    return (
      <div className="w-full max-w-lg bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 relative overflow-hidden">
        <h3 className="text-sm font-medium text-primary mb-3">Moteur d'analyse IA</h3>
        
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            <span className="text-sm">Publicités analysées: <span className="font-bold">{formattedAdsCount}</span></span>
          </div>
          <div className="text-sm">
            Revenus: <span className="font-bold">{formattedRevenue}</span>
          </div>
        </div>

        <div className="relative h-[180px] flex items-center justify-center">
          {/* Représentation stylisée d'un processeur */}
          <div className="relative w-[150px] h-[150px] border-2 border-primary/30 flex items-center justify-center">
            {/* Lignes internes du processeur */}
            <div className="absolute w-[80%] h-[1px] bg-primary/40 top-1/4"></div>
            <div className="absolute w-[80%] h-[1px] bg-primary/40 top-2/4"></div>
            <div className="absolute w-[80%] h-[1px] bg-primary/40 top-3/4"></div>
            
            <div className="absolute h-[80%] w-[1px] bg-primary/40 left-1/4"></div>
            <div className="absolute h-[80%] w-[1px] bg-primary/40 left-2/4"></div>
            <div className="absolute h-[80%] w-[1px] bg-primary/40 left-3/4"></div>
            
            {/* Points d'activité */}
            <div className="absolute h-3 w-3 bg-green-500/70 rounded-full animate-pulse" style={{ top: '25%', left: '25%' }}></div>
            <div className="absolute h-3 w-3 bg-blue-500/70 rounded-full animate-pulse" style={{ top: '25%', left: '75%' }}></div>
            <div className="absolute h-3 w-3 bg-yellow-500/70 rounded-full animate-pulse" style={{ top: '75%', left: '25%' }}></div>
            <div className="absolute h-3 w-3 bg-purple-500/70 rounded-full animate-pulse" style={{ top: '75%', left: '75%' }}></div>
            
            <Cpu size={36} className="text-primary z-10" />
          </div>
        </div>
      </div>
    );
  }
  
  // Rendu de la visualisation "bars" (barres d'activité)
  if (variant === 'bars') {
    return (
      <div className="w-full max-w-lg bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 relative overflow-hidden">
        <h3 className="text-sm font-medium text-primary mb-3">Performance d'analyse</h3>
        
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            <span className="text-sm">Publicités analysées: <span className="font-bold">{formattedAdsCount}</span></span>
          </div>
          <div className="text-sm">
            Revenus: <span className="font-bold">{formattedRevenue}</span>
          </div>
        </div>

        <div className="relative h-[180px] flex items-end justify-around">
          {/* Barres d'activité */}
          <div className="flex flex-col items-center">
            <div className="h-[120px] w-4 bg-gradient-to-t from-purple-500 to-primary rounded relative overflow-hidden">
              <div className="absolute bottom-0 w-full bg-white/10 h-1/2 animate-pulse" style={{ animationDuration: '1.5s' }}></div>
            </div>
            <span className="text-xs mt-2">EU</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="h-[90px] w-4 bg-gradient-to-t from-blue-500 to-primary rounded relative overflow-hidden">
              <div className="absolute bottom-0 w-full bg-white/10 h-2/3 animate-pulse" style={{ animationDuration: '2s' }}></div>
            </div>
            <span className="text-xs mt-2">NA</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="h-[140px] w-4 bg-gradient-to-t from-green-500 to-primary rounded relative overflow-hidden">
              <div className="absolute bottom-0 w-full bg-white/10 h-1/3 animate-pulse" style={{ animationDuration: '1.8s' }}></div>
            </div>
            <span className="text-xs mt-2">AS</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="h-[70px] w-4 bg-gradient-to-t from-yellow-500 to-primary rounded relative overflow-hidden">
              <div className="absolute bottom-0 w-full bg-white/10 h-3/5 animate-pulse" style={{ animationDuration: '1.7s' }}></div>
            </div>
            <span className="text-xs mt-2">AF</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="h-[100px] w-4 bg-gradient-to-t from-red-500 to-primary rounded relative overflow-hidden">
              <div className="absolute bottom-0 w-full bg-white/10 h-2/5 animate-pulse" style={{ animationDuration: '1.9s' }}></div>
            </div>
            <span className="text-xs mt-2">SA</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="h-[80px] w-4 bg-gradient-to-t from-orange-500 to-primary rounded relative overflow-hidden">
              <div className="absolute bottom-0 w-full bg-white/10 h-4/5 animate-pulse" style={{ animationDuration: '2.1s' }}></div>
            </div>
            <span className="text-xs mt-2">OC</span>
          </div>
          
          <BarChart3 size={24} className="absolute text-white/20 right-2 bottom-2" />
        </div>
      </div>
    );
  }
  
  // Rendu de la visualisation "trend" (ligne de tendance)
  if (variant === 'trend') {
    return (
      <div className="w-full max-w-lg bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 relative overflow-hidden">
        <h3 className="text-sm font-medium text-primary mb-3">Évolution en temps réel</h3>
        
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            <span className="text-sm">Publicités analysées: <span className="font-bold">{formattedAdsCount}</span></span>
          </div>
          <div className="text-sm">
            Revenus: <span className="font-bold">{formattedRevenue}</span>
          </div>
        </div>

        <div className="relative h-[180px] w-full">
          {/* Background grid */}
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-primary/10"></div>
            ))}
          </div>
          
          {/* Trend line */}
          <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
            {/* Simplified path that shows upward trend */}
            <path 
              d="M0,150 C50,140 80,160 120,120 C160,80 200,100 250,70 C300,40 340,60 400,20" 
              fill="none" 
              stroke="url(#gradient)" 
              strokeWidth="3"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Animated dot on the line */}
          <div className="absolute h-3 w-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse right-4 top-5"></div>
          
          <TrendingUp size={24} className="absolute text-white/20 right-2 bottom-2" />
        </div>
      </div>
    );
  }
  
  // Par défaut, retourner la visualisation de type processeur
  return (
    <div className="w-full max-w-lg bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4">
      <h3 className="text-sm font-medium text-primary mb-3">Analyse IA en cours</h3>
      
      <div className="flex justify-between mb-2">
        <span className="text-sm">Publicités analysées: <span className="font-bold">{formattedAdsCount}</span></span>
        <span className="text-sm">Revenus: <span className="font-bold">{formattedRevenue}</span></span>
      </div>
      
      <div className="flex items-center justify-center h-[160px]">
        <Zap size={48} className="text-primary animate-pulse" />
      </div>
    </div>
  );
};

export default AnalyticsVisualizer;

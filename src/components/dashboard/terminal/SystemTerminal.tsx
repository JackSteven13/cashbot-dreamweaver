
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import TerminalOutput from './TerminalOutput';

interface SystemTerminalProps {
  isNewUser?: boolean;
  dailyLimit?: number;
  subscription?: string;
  remainingSessions?: number;
  referralCount?: number;
  displayBalance?: number;
  referralBonus?: number;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const SystemTerminal: React.FC<SystemTerminalProps> = ({
  isNewUser = false,
  dailyLimit = 0.5,
  subscription = 'freemium',
  remainingSessions = 0,
  referralCount = 0,
  displayBalance = 0,
  referralBonus = 0,
  lastSessionTimestamp,
  isBotActive = true
}) => {
  // State pour gérer l'état visuel du terminal
  const [animationActive, setAnimationActive] = useState(false);
  const [scrollToBottom, setScrollToBottom] = useState(false);
  const [outputs, setOutputs] = useState<Array<{text: string, type: string}>>([]);
  
  // Générer les messages initiaux du terminal
  useEffect(() => {
    const initialOutputs = [
      { text: "Initialisation du système...", type: "system" },
      { text: `Status: ${isBotActive ? "Actif" : "Inactif"}`, type: "info" },
      { text: `Abonnement: ${subscription}`, type: "info" },
      { text: `Limite quotidienne: ${dailyLimit}€`, type: "info" },
      { text: `Balance actuelle: ${displayBalance.toFixed(2)}€`, type: "success" },
      { text: `Parrainages actifs: ${referralCount}`, type: "info" },
      { text: isBotActive 
        ? "Module d'analyse actif. Génération de revenus en cours..."
        : "Module d'analyse en pause. Activez-le pour générer des revenus.", 
        type: isBotActive ? "success" : "warning" 
      }
    ];
    
    setOutputs(initialOutputs);
  }, [isBotActive, subscription, dailyLimit, displayBalance, referralCount]);
  
  // Animer le terminal en réponse aux événements
  useEffect(() => {
    const handleTerminalUpdate = () => {
      setAnimationActive(true);
      setTimeout(() => {
        setAnimationActive(false);
      }, 1500);
      setScrollToBottom(true);
    };
    
    // Ajouter des entrées au terminal lorsque le système change d'état
    const handleBotStatusChange = (event: CustomEvent) => {
      const { active } = event.detail;
      
      setOutputs(prev => [
        ...prev, 
        { 
          text: active 
            ? "Module d'analyse activé. Démarrage de l'optimisation..." 
            : "Module d'analyse désactivé. Arrêt de l'optimisation.",
          type: active ? "success" : "warning"
        }
      ]);
      
      handleTerminalUpdate();
    };
    
    // Ajouter des entrées au terminal quand des données utilisateur sont chargées
    const handleUserDataLoaded = (event: CustomEvent) => {
      const { isNewUser } = event.detail;
      
      setOutputs(prev => [
        ...prev, 
        { 
          text: isNewUser 
            ? "Nouvel utilisateur détecté. Configuration du système en cours..." 
            : "Utilisateur reconnu. Chargement des préférences...",
          type: "info"
        }
      ]);
      
      handleTerminalUpdate();
    };
    
    const handleDailyReset = () => {
      setOutputs(prev => [
        ...prev,
        { text: "Réinitialisation quotidienne effectuée. Nouveaux quotas disponibles.", type: "system" }
      ]);
      
      handleTerminalUpdate();
    };
    
    // Ajouter des messages liés à l'activité des robots
    const handleMicroGain = (event: CustomEvent) => {
      const { amount, agent } = event.detail;
      
      if (amount && agent) {
        setOutputs(prev => [
          ...prev,
          { text: `Module #${agent}: Optimisation de ${amount}€ générée`, type: "success" }
        ]);
        
        handleTerminalUpdate();
      }
    };
    
    // Ajouter des messages lors des analyses actives
    const handleActivityEvent = (event: CustomEvent) => {
      const { level, agents } = event.detail;
      
      if (Math.random() > 0.7) { // Ne pas afficher tous les événements pour éviter de surcharger
        const messages = [
          "Analyse du système en cours...",
          "Optimisation des paramètres...",
          "Vérification des performances...",
          "Surveillance des composants...",
          "Synchronisation avec les services externes..."
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        setOutputs(prev => [
          ...prev,
          { text: `${randomMessage} [${agents || 3} modules actifs]`, type: "info" }
        ]);
        
        handleTerminalUpdate();
      }
    };
    
    // Limiter le nombre de messages dans le terminal
    const limitTerminalMessages = () => {
      setOutputs(prev => {
        if (prev.length > 30) {
          return prev.slice(prev.length - 30);
        }
        return prev;
      });
    };
    
    const messageLimit = setInterval(limitTerminalMessages, 10000);
    
    window.addEventListener('bot:status-change', handleBotStatusChange as EventListener);
    window.addEventListener('user:data-loaded', handleUserDataLoaded as EventListener);
    window.addEventListener('dailyGains:reset', handleDailyReset);
    window.addEventListener('micro-gain', handleMicroGain as EventListener);
    window.addEventListener('activity', handleActivityEvent as EventListener);
    
    return () => {
      window.removeEventListener('bot:status-change', handleBotStatusChange as EventListener);
      window.removeEventListener('user:data-loaded', handleUserDataLoaded as EventListener);
      window.removeEventListener('dailyGains:reset', handleDailyReset);
      window.removeEventListener('micro-gain', handleMicroGain as EventListener);
      window.removeEventListener('activity', handleActivityEvent as EventListener);
      clearInterval(messageLimit);
    };
  }, []);
  
  return (
    <Card className={cn(
      "h-[450px] bg-slate-900 border-slate-800 font-mono text-sm overflow-hidden",
      animationActive && "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
    )}>
      <div className="bg-slate-800 p-2 border-b border-slate-800 flex items-center">
        {isBotActive ? (
          <Server className="h-4 w-4 text-blue-400 mr-2" />
        ) : (
          <Activity className="h-4 w-4 text-amber-400 mr-2" />
        )}
        <div className="text-xs text-slate-400">
          Système {isBotActive ? "actif" : "en pause"} | {subscription} | Limite: {dailyLimit}€/jour
        </div>
      </div>
      
      <div className="p-4 h-[calc(100%-40px)] overflow-auto">
        <TerminalOutput outputs={outputs} scrollToBottom={scrollToBottom} />
      </div>
    </Card>
  );
};

export default SystemTerminal;

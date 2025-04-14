
import { useState, useEffect, useRef } from 'react';
import { triggerDashboardEvent } from '@/utils/animations';

export const useActivitySimulation = () => {
  const [activityLevel, setActivityLevel] = useState(1);
  const activityInterval = useRef<NodeJS.Timeout | null>(null);
  const sessionInProgress = useRef(false);
  const agentsCount = useRef(Math.floor(Math.random() * 3) + 2); // 2-4 agents actifs

  useEffect(() => {
    const simulateActivity = () => {
      // Simulation plus dynamique avec des pics d'activité
      const baseActivityLevel = Math.floor(Math.random() * 5) + 1;
      const peakActivity = Math.random() < 0.3; // 30% de chance de pic d'activité
      const newActivityLevel = peakActivity ? Math.min(5, baseActivityLevel + 2) : baseActivityLevel;
      
      setActivityLevel(newActivityLevel);
      
      // Déclencher des événements d'activité plus fréquents
      triggerDashboardEvent('activity', { 
        level: newActivityLevel,
        agents: agentsCount.current 
      });
      
      // Pour les niveaux d'activité élevés, générer plus de micro-gains
      if (newActivityLevel >= 4 && !sessionInProgress.current) {
        const microGainsCount = Math.floor(Math.random() * 3) + 1; // 1-3 micro-gains
        
        for (let i = 0; i < microGainsCount; i++) {
          const microGain = (Math.random() * 0.02 + 0.01).toFixed(2); // 0.01€ - 0.03€
          setTimeout(() => {
            triggerDashboardEvent('micro-gain', { 
              amount: parseFloat(microGain),
              agent: Math.floor(Math.random() * agentsCount.current) + 1
            });
          }, i * 800); // Espacer les gains de 800ms
        }
      }
    };
    
    // Intervalle plus court pour une activité plus dynamique
    activityInterval.current = setInterval(simulateActivity, 8000);
    
    // Simuler des changements dans le nombre d'agents actifs
    const agentUpdateInterval = setInterval(() => {
      agentsCount.current = Math.floor(Math.random() * 3) + 2;
    }, 30000);
    
    return () => {
      if (activityInterval.current) clearInterval(activityInterval.current);
      clearInterval(agentUpdateInterval);
    };
  }, []);

  return {
    activityLevel,
    activeAgents: agentsCount.current,
    setSessionInProgress: (inProgress: boolean) => {
      sessionInProgress.current = inProgress;
    }
  };
};

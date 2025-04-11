
import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Bot, BotOff, AlertTriangle } from 'lucide-react';
import { calculateTimeUntilMidnight } from '@/utils/timeUtils';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

interface BotControlPanelProps {
  isBotActive: boolean;
  showLimitReached: boolean;
  subscription: string;
  userId?: string;
}

const BotControlPanel: React.FC<BotControlPanelProps> = ({
  isBotActive,
  showLimitReached,
  subscription,
  userId
}) => {
  const [isActive, setIsActive] = useState(isBotActive);
  const [countdown, setCountdown] = useState<string>('');
  const [limitReached, setLimitReached] = useState(showLimitReached);
  
  // Effet pour se synchroniser avec l'état externe
  useEffect(() => {
    setIsActive(isBotActive);
    setLimitReached(showLimitReached);
    
    // Restaurer l'état du bot à partir de localStorage
    if (userId) {
      try {
        const storedBotStatus = localStorage.getItem(`botActive_${userId}`);
        if (storedBotStatus !== null) {
          const parsedStatus = storedBotStatus === 'true';
          setIsActive(parsedStatus);
        }
      } catch (e) {
        console.error("Failed to restore bot status from localStorage:", e);
      }
    }
  }, [isBotActive, showLimitReached, userId]);
  
  // Gérer le compte à rebours si la limite est atteinte
  useEffect(() => {
    if (limitReached) {
      // Calculer le temps jusqu'à minuit
      updateCountdown();
      
      // Mettre à jour chaque seconde
      const timer = setInterval(updateCountdown, 1000);
      
      return () => clearInterval(timer);
    }
  }, [limitReached]);
  
  // Formater le temps jusqu'à minuit
  const updateCountdown = () => {
    const timeUntilMidnight = calculateTimeUntilMidnight();
    
    // Formater en HH:MM:SS
    const hours = Math.floor(timeUntilMidnight / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeUntilMidnight % (1000 * 60)) / 1000);
    
    setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };
  
  // Gérer le changement d'état du bot
  const handleBotToggle = (value: boolean) => {
    // Si la limite est atteinte, ne pas autoriser l'activation
    if (limitReached && value === true) {
      return;
    }
    
    setIsActive(value);
    
    // Enregistrer l'état dans localStorage
    if (userId) {
      localStorage.setItem(`botActive_${userId}`, value.toString());
    }
    
    // Déclencher l'événement global de changement d'état du bot
    window.dispatchEvent(new CustomEvent('bot:status-change', {
      detail: { 
        userId,
        active: value
      }
    }));
  };
  
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            {isActive ? (
              <Bot className="h-5 w-5 text-green-500" />
            ) : (
              <BotOff className="h-5 w-5 text-slate-500" />
            )}
            Assistant d'analyse
          </CardTitle>
          <Switch 
            checked={isActive} 
            onCheckedChange={handleBotToggle} 
            disabled={limitReached}
            className="data-[state=checked]:bg-green-500"
          />
        </div>
        <CardDescription>
          Génération automatique de revenus
        </CardDescription>
      </CardHeader>
      <CardContent>
        {limitReached ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-500" />
            <div>
              <p className="font-medium">Limite quotidienne atteinte</p>
              <p className="text-sm mt-1">
                Vous avez atteint votre limite de {dailyLimit.toFixed(2)}€ pour aujourd'hui. 
                Le bot sera réactivé automatiquement demain.
              </p>
              {countdown && (
                <p className="text-sm font-mono bg-amber-100/50 px-2 py-1 rounded mt-2 inline-block">
                  Réactivation dans: {countdown}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-slate-600">
            {isActive 
              ? "L'assistant génère automatiquement des revenus en analysant le contenu vidéo." 
              : "L'assistant est actuellement désactivé. Activez-le pour générer des revenus automatiquement."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BotControlPanel;

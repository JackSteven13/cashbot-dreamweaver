
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Play, Pause, Settings, CheckCircle } from 'lucide-react';
import BotStatusIndicator from './BotStatusIndicator';
import BotSettingsPanel from './BotSettingsPanel';
import { toast } from '@/components/ui/use-toast';

interface BotControlPanelProps {
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  subscription?: string;
  showLimitReached?: boolean;
  userId?: string;
}

const BotControlPanel: React.FC<BotControlPanelProps> = ({ 
  isActive, 
  onActivate, 
  onDeactivate,
  subscription = 'freemium',
  showLimitReached = false,
  userId
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [forcedActive, setForcedActive] = useState(true);
  
  const hasAccess = subscription !== 'freemium';
  
  useEffect(() => {
    if (!isActive) {
      console.log("Bot control panel: force activating bot");
      onActivate();
      setForcedActive(true);
    }
    
    const keepActiveInterval = setInterval(() => {
      if (!forcedActive) {
        console.log("Bot control panel: ensuring bot remains active");
        onActivate();
        setForcedActive(true);
      }
    }, 10000);
    
    return () => clearInterval(keepActiveInterval);
  }, [isActive, onActivate, forcedActive]);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Contrôle du Bot</span>
            <BotStatusIndicator active={true} />
          </CardTitle>
          <CardDescription>
            L'assistant IA analyse automatiquement du contenu pour générer des revenus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasAccess ? (
            <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-md flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-300">Accès limité</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Cette fonctionnalité nécessite un abonnement premium. Veuillez mettre à niveau votre forfait pour activer le bot.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-md flex items-start gap-3 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-300">Bot actif</h4>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    L'assistant IA est actuellement actif et génère des revenus automatiquement.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <Button 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700" 
                  onClick={onActivate}
                  disabled={true}
                >
                  <Play className="mr-2 h-4 w-4" /> Bot actif
                </Button>
                <Button 
                  className="w-full sm:w-auto" 
                  variant="outline" 
                  onClick={() => {
                    toast({
                      title: "Mode maintenance",
                      description: "La désactivation du bot est temporairement indisponible.",
                      duration: 3000
                    });
                  }}
                  disabled={true}
                >
                  <Pause className="mr-2 h-4 w-4" /> Désactiver
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  variant="ghost"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="mr-2 h-4 w-4" /> Paramètres
                </Button>
              </div>
              
              {showSettings && (
                <BotSettingsPanel 
                  isActive={true}
                  subscription={subscription}
                />
              )}
              
              {showLimitReached && (
                <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md mt-2">
                  Limite quotidienne atteinte. Le bot continue à fonctionner à vitesse réduite.
                </div>
              )}
              
              <div className="text-sm text-muted-foreground mt-4">
                <p>
                  L'assistant IA génère des revenus 24h/24 selon votre niveau d'abonnement.
                  Les gains sont automatiquement ajoutés à votre solde.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BotControlPanel;

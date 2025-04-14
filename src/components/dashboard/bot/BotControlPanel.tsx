
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Play, Pause, Settings } from 'lucide-react';
import BotStatusIndicator from './BotStatusIndicator';
import BotSettingsPanel from './BotSettingsPanel';

interface BotControlPanelProps {
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  subscription?: string;
}

const BotControlPanel: React.FC<BotControlPanelProps> = ({ 
  isActive, 
  onActivate, 
  onDeactivate,
  subscription = 'freemium'
}) => {
  const [showSettings, setShowSettings] = useState(false);
  
  // Vérifier si l'utilisateur a accès au bot en fonction de son abonnement
  const hasAccess = subscription !== 'freemium';
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Contrôle du Bot</span>
            <BotStatusIndicator active={isActive} />
          </CardTitle>
          <CardDescription>
            Activez ou désactivez le bot pour générer automatiquement des revenus.
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
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <Button 
                  className="w-full sm:w-auto" 
                  onClick={onActivate}
                  disabled={isActive}
                >
                  <Play className="mr-2 h-4 w-4" /> Activer le Bot
                </Button>
                <Button 
                  className="w-full sm:w-auto" 
                  variant="outline" 
                  onClick={onDeactivate}
                  disabled={!isActive}
                >
                  <Pause className="mr-2 h-4 w-4" /> Désactiver le Bot
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
                  isActive={isActive}
                  subscription={subscription}
                />
              )}
              
              <div className="text-sm text-muted-foreground mt-4">
                <p>
                  Le bot générera automatiquement des revenus en fonction de votre niveau d'abonnement.
                  Vous pouvez le désactiver à tout moment.
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

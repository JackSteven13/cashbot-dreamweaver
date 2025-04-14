
import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface BotSettingsPanelProps {
  isActive: boolean;
  subscription: string;
}

const BotSettingsPanel: React.FC<BotSettingsPanelProps> = ({ 
  isActive,
  subscription 
}) => {
  const [activityLevel, setActivityLevel] = useState(5);
  const [autoRestart, setAutoRestart] = useState(true);
  const [notifications, setNotifications] = useState(true);
  
  // Déterminer le niveau maximum d'activité en fonction de l'abonnement
  const maxActivityLevel = subscription === 'premium' ? 10 : 7;
  
  return (
    <div className="border rounded-md p-4 space-y-5">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Niveau d'activité</Label>
          <span className="text-sm font-medium">{activityLevel}/10</span>
        </div>
        <Slider 
          value={[activityLevel]} 
          min={1} 
          max={10} 
          step={1}
          onValueChange={(value) => {
            const newValue = Math.min(value[0], maxActivityLevel);
            setActivityLevel(newValue);
          }}
          disabled={!isActive || subscription === 'freemium'}
        />
        {subscription !== 'premium' && (
          <p className="text-xs text-muted-foreground">
            Niveau maximum avec votre abonnement: {maxActivityLevel}/10. 
            Passez à Premium pour débloquer les niveaux supérieurs.
          </p>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="auto-restart" className="flex-grow">
          Redémarrage automatique
          <span className="block text-xs text-muted-foreground">
            Redémarrer automatiquement le bot après une déconnexion
          </span>
        </Label>
        <Switch 
          id="auto-restart" 
          checked={autoRestart} 
          onCheckedChange={setAutoRestart}
          disabled={!isActive || subscription === 'freemium'}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="notifications" className="flex-grow">
          Notifications
          <span className="block text-xs text-muted-foreground">
            Recevoir des notifications sur l'activité du bot
          </span>
        </Label>
        <Switch 
          id="notifications" 
          checked={notifications} 
          onCheckedChange={setNotifications}
          disabled={!isActive || subscription === 'freemium'}
        />
      </div>
    </div>
  );
};

export default BotSettingsPanel;

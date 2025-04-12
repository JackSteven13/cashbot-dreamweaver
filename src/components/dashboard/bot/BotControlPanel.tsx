
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Bot, Info } from 'lucide-react';

interface BotControlPanelProps {
  isBotActive: boolean;
  showLimitReached: boolean;
  subscription?: string;
  userId?: string;
}

const BotControlPanel: React.FC<BotControlPanelProps> = ({
  isBotActive,
  showLimitReached,
  subscription = 'freemium',
  userId
}) => {
  const { toast } = useToast();
  const [switchValue, setSwitchValue] = useState(isBotActive);
  
  // Synchroniser l'état interne avec les props
  useEffect(() => {
    setSwitchValue(isBotActive);
  }, [isBotActive]);
  
  // Fonction pour gérer le changement d'état du bot
  const handleToggleBot = (checked: boolean) => {
    // Si la limite est atteinte, ne pas permettre l'activation
    if (showLimitReached && checked) {
      toast({
        title: "Limite quotidienne atteinte",
        description: "Vous avez atteint votre limite quotidienne. Le bot sera disponible à nouveau demain.",
        variant: "destructive",
        duration: 5000
      });
      return;
    }
    
    // Mettre à jour l'état local
    setSwitchValue(checked);
    
    // Déclencher l'événement global pour informer les autres composants
    window.dispatchEvent(new CustomEvent('bot:status-change', {
      detail: {
        active: checked,
        userId: userId
      }
    }));
    
    // Afficher un toast de confirmation
    toast({
      title: checked ? "Assistant d'analyse activé" : "Assistant d'analyse désactivé",
      description: checked 
        ? "L'assistant va maintenant générer des revenus automatiquement."
        : "La génération automatique de revenus est en pause.",
      duration: 3000
    });
    
    // Persister l'état du bot dans localStorage
    localStorage.setItem(`botActive_${userId}`, checked.toString());
  };
  
  return (
    <div className="w-full mb-6 bg-[#121723] rounded-lg border border-slate-800 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-medium">Assistant d'analyse</h3>
        </div>
        <Switch 
          checked={switchValue} 
          onCheckedChange={handleToggleBot}
          disabled={showLimitReached}
        />
      </div>
      
      <p className="text-sm text-muted-foreground mt-1">Génération automatique de revenus</p>
      
      <p className="text-sm text-muted-foreground my-2">
        {showLimitReached ? (
          <span className="text-amber-400">Limite quotidienne atteinte. Disponible à nouveau demain.</span>
        ) : (
          switchValue ? (
            "L'assistant génère automatiquement des revenus en analysant le contenu vidéo."
          ) : (
            "Activez-le pour générer des revenus automatiquement."
          )
        )}
      </p>
      
      <div className="flex items-center mt-2 text-xs text-muted-foreground">
        <Info className="h-3 w-3 mr-1" />
        <span>
          {subscription === 'freemium' 
            ? "Abonnement freemium: limité à 0.50€/jour" 
            : `Abonnement ${subscription} actif`}
        </span>
      </div>
    </div>
  );
};

export default BotControlPanel;


import React, { useState, useEffect } from 'react';
import { Gift, Timer, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

interface ProTrialButtonProps {
  subscription: string;
  onActivate: () => void;
}

const ProTrialButton: React.FC<ProTrialButtonProps> = ({ 
  subscription,
  onActivate
}) => {
  const [isPromoActivated, setIsPromoActivated] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  // Vérifier si le mode Pro temporaire est déjà activé
  useEffect(() => {
    const checkPromoStatus = () => {
      const proTrialActive = localStorage.getItem('proTrialActive') === 'true';
      const proTrialExpires = localStorage.getItem('proTrialExpires');
      
      if (proTrialActive && proTrialExpires) {
        const expiryTime = parseInt(proTrialExpires, 10);
        const now = Date.now();
        
        if (now < expiryTime) {
          setIsPromoActivated(true);
          updateTimeRemaining(expiryTime);
        } else {
          // Si expiré, nettoyer le localStorage
          localStorage.removeItem('proTrialActive');
          localStorage.removeItem('proTrialExpires');
          setIsPromoActivated(false);
          setTimeRemaining(null);
          
          if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
          }
        }
      }
    };
    
    checkPromoStatus();
    
    // Définir un intervalle pour mettre à jour le temps restant
    if (!intervalId) {
      const id = setInterval(checkPromoStatus, 60000) as unknown as number;
      setIntervalId(id);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);
  
  const updateTimeRemaining = (expiryTime: number) => {
    const now = Date.now();
    const remainingMs = expiryTime - now;
    
    if (remainingMs <= 0) {
      setTimeRemaining("Expiré");
      return;
    }
    
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    setTimeRemaining(`${hours}h ${minutes}m`);
  };
  
  const handleActivate = () => {
    if (subscription === 'freemium' && !isPromoActivated) {
      onActivate();
    } else if (isPromoActivated) {
      toast({
        title: "Offre déjà activée",
        description: `Votre période d'essai Pro est déjà en cours! Il vous reste ${timeRemaining}.`,
      });
    } else {
      toast({
        title: "Non disponible",
        description: "Vous utilisez déjà un abonnement payant supérieur à l'offre d'essai.",
      });
    }
  };
  
  if (subscription !== 'freemium' && !isPromoActivated) {
    return null;
  }
  
  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-indigo-900 to-blue-900 text-white">
      <div className="p-4 relative overflow-hidden">
        {/* Motif de fond */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMxLjIgMCAyLjEuOSAyLjEgMi4xdjI3LjhjMCAxLjItLjkgMi4xLTIuMSAyLjFIOFYxOGgyOHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA0Ii8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="bg-indigo-600/40 p-2 rounded-lg mr-3">
              <Gift className="h-6 w-6 text-indigo-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Offre Pro</h3>
              <p className="text-blue-200 text-sm">48h d'accès gratuit</p>
            </div>
          </div>
          
          {isPromoActivated && timeRemaining && (
            <Badge variant="outline" className="bg-indigo-600/30 border-indigo-500/50 text-indigo-200 px-2 py-1">
              <Timer className="h-3 w-3 mr-1" />
              {timeRemaining}
            </Badge>
          )}
        </div>
        
        <div className="space-y-3 mb-3">
          {isPromoActivated ? (
            <div className="bg-indigo-800/40 p-2.5 rounded-lg text-center border border-indigo-500/20">
              <p className="text-indigo-200 text-sm font-medium">
                ✅ Mode Pro activé ! Profitez de tous les avantages Pro
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5 pl-2">
              <li className="flex items-start text-sm text-indigo-200">
                <Zap className="h-4 w-4 text-indigo-300 mt-0.5 mr-2 flex-shrink-0" />
                <span>Limite journalière de 5€ (au lieu de 0.5€)</span>
              </li>
              <li className="flex items-start text-sm text-indigo-200">
                <Zap className="h-4 w-4 text-indigo-300 mt-0.5 mr-2 flex-shrink-0" />
                <span>Sessions illimitées (au lieu d'une seule)</span>
              </li>
            </ul>
          )}
        </div>
        
        <Button 
          onClick={handleActivate}
          className={`w-full ${isPromoActivated 
            ? 'bg-indigo-700/60 hover:bg-indigo-700/80 text-indigo-100 cursor-default' 
            : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white'}`}
          disabled={isPromoActivated}
        >
          {isPromoActivated 
            ? `Activé (${timeRemaining})` 
            : "Activer 48h d'essai Pro gratuit"}
        </Button>
      </div>
    </Card>
  );
};

export default ProTrialButton;

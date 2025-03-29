
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Crown, ChevronRight } from 'lucide-react';
import Button from '@/components/Button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface FeaturedPlanCardProps {
  currentSubscription: string;
  onSelectPlan: (planId: 'elite') => void;
}

const FeaturedPlanCard: React.FC<FeaturedPlanCardProps> = ({ 
  currentSubscription,
  onSelectPlan
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isCurrentPlan = currentSubscription === 'elite';
  
  const handleSelectPlan = () => {
    onSelectPlan('elite');
  };
  
  return (
    <div className={cn(
      "w-full max-w-4xl rounded-2xl overflow-hidden shadow-lg border-2 transition-all",
      isCurrentPlan 
        ? "border-green-500 bg-green-50/50 dark:bg-green-900/20" 
        : "border-purple-500 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10"
    )}>
      <div className="relative">
        {/* Elite Badge */}
        <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-4 py-1 rounded-bl-lg">
          <div className="flex items-center">
            <Crown className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs font-bold">ÉLITE</span>
          </div>
        </div>
        
        <div className="p-5 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center">
                <h3 className="text-lg md:text-2xl font-bold tracking-tight text-purple-800 dark:text-purple-300">
                  Offre Élite Premium
                </h3>
                <Sparkles className="h-5 w-5 ml-2 text-purple-500" />
              </div>
              <p className="text-sm md:text-base text-purple-700 dark:text-purple-400 opacity-90">
                Notre offre la plus complète pour les professionnels
              </p>
            </div>
            
            <div className="flex items-center">
              <span className="text-2xl md:text-4xl font-bold text-purple-800 dark:text-purple-300">
                549€
              </span>
              <span className="text-sm md:text-base text-purple-700 dark:text-purple-400 ml-1">
                /an
              </span>
            </div>
          </div>
          
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm md:text-base text-purple-700 dark:text-purple-400 mb-2">
                Fonctionnalités principales
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center text-xs md:text-sm text-purple-800 dark:text-purple-300">
                  <Sparkles className="h-3.5 w-3.5 mr-2 text-purple-500" />
                  Limite de gains de 50€ par jour
                </li>
                <li className="flex items-center text-xs md:text-sm text-purple-800 dark:text-purple-300">
                  <Sparkles className="h-3.5 w-3.5 mr-2 text-purple-500" />
                  Accès illimité à toutes les fonctionnalités
                </li>
                <li className="flex items-center text-xs md:text-sm text-purple-800 dark:text-purple-300">
                  <Sparkles className="h-3.5 w-3.5 mr-2 text-purple-500" />
                  Commission de parrainage de 100%
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm md:text-base text-purple-700 dark:text-purple-400 mb-2">
                Avantages exclusifs
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center text-xs md:text-sm text-purple-800 dark:text-purple-300">
                  <Sparkles className="h-3.5 w-3.5 mr-2 text-purple-500" />
                  30% de commission récurrente
                </li>
                <li className="flex items-center text-xs md:text-sm text-purple-800 dark:text-purple-300">
                  <Sparkles className="h-3.5 w-3.5 mr-2 text-purple-500" />
                  10% de commission niveau 2
                </li>
                <li className="flex items-center text-xs md:text-sm text-purple-800 dark:text-purple-300">
                  <Sparkles className="h-3.5 w-3.5 mr-2 text-purple-500" />
                  Fonctionnalités exclusives en avant-première
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6">
            <Button
              variant={isCurrentPlan ? "secondary" : "primary"}
              className={cn(
                "w-full py-3 text-base flex items-center justify-center gap-2",
                isCurrentPlan ? "bg-green-500 text-white" : "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
              )}
              disabled={isCurrentPlan}
              onClick={handleSelectPlan}
            >
              {isCurrentPlan ? 'Votre abonnement actuel' : 'Sélectionner Élite Premium'}
              {!isCurrentPlan && <ChevronRight className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedPlanCard;

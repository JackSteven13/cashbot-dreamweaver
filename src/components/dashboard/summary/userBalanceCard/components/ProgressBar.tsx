
import React, { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getWithdrawalThreshold } from '@/utils/referral/withdrawalUtils';

interface ProgressBarProps {
  displayBalance: number;
  subscription: string;
  withdrawalThreshold?: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  displayBalance = 0,
  subscription = 'freemium',
  withdrawalThreshold: propsThreshold,
  className
}) => {
  // Déterminer le seuil correct - utiliser la prop si fournie, sinon la fonction utilitaire
  const withdrawalThreshold = useMemo(() => {
    if (propsThreshold !== undefined) return propsThreshold;
    return getWithdrawalThreshold(subscription);
  }, [propsThreshold, subscription]);
  
  // Calculer le pourcentage d'avancement
  const progressPercentage = useMemo(() => {
    if (!withdrawalThreshold || withdrawalThreshold <= 0) return 0;
    const percentage = (displayBalance / withdrawalThreshold) * 100;
    return Math.min(100, Math.max(0, percentage));
  }, [displayBalance, withdrawalThreshold]);
  
  return (
    <div className="mt-4 mb-2">
      <div className="flex justify-between mb-1 items-center">
        <span className="text-xs text-muted-foreground">Progression retrait</span>
        <div className="flex items-center">
          <span className="text-xs">{displayBalance.toFixed(2)}€ / {withdrawalThreshold}€</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 ml-1 text-amber-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Seuil minimum à atteindre pour retirer vos gains. {withdrawalThreshold}€ pour un compte {subscription}.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <Progress value={progressPercentage} className={`h-2 ${className || ''}`} />
      </div>
    </div>
  );
};

export default ProgressBar;

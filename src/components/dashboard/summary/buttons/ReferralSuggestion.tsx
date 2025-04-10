
import React from 'react';
import { Users, Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { getWithdrawalThreshold } from '@/utils/referral/withdrawalUtils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface ReferralSuggestionProps {
  triggerElement: React.ReactNode;
  onStartReferral?: () => void;
  subscription?: string;
}

export const ReferralSuggestion: React.FC<ReferralSuggestionProps> = ({
  triggerElement,
  onStartReferral,
  subscription = 'freemium'
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Déterminer le seuil de retrait en fonction de l'abonnement
  const withdrawalThreshold = getWithdrawalThreshold(subscription);

  // Fonction par défaut pour démarrer le parrainage
  const handleStartReferral = () => {
    if (onStartReferral) {
      onStartReferral();
    } else {
      // Naviguer vers la page de parrainage
      navigate('/dashboard/referrals');
    }
  };

  // Sur mobile, on utilise un Popover qui s'ouvre au clic
  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          {triggerElement}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <ReferralSuggestionContent 
            onStartReferral={handleStartReferral}
            withdrawalThreshold={withdrawalThreshold}
            subscription={subscription}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // Sur desktop, on utilise un HoverCard
  return (
    <HoverCard openDelay={100} closeDelay={200}>
      <HoverCardTrigger asChild>
        {triggerElement}
      </HoverCardTrigger>
      <HoverCardContent side="top" align="center" className="w-80 p-4">
        <ReferralSuggestionContent 
          onStartReferral={handleStartReferral} 
          withdrawalThreshold={withdrawalThreshold}
          subscription={subscription}
        />
      </HoverCardContent>
    </HoverCard>
  );
};

// Contenu réutilisable pour le Popover et le HoverCard
const ReferralSuggestionContent: React.FC<{ 
  onStartReferral: () => void;
  withdrawalThreshold: number;
  subscription?: string;
}> = ({ onStartReferral, withdrawalThreshold, subscription = 'freemium' }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <Users className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-slate-800 mb-1">Gagnez plus avec le parrainage</h4>
          <p className="text-sm text-slate-600">
            Parrainez des amis et gagnez <span className="font-medium text-green-600">20-50%</span> de leurs abonnements annuels, automatiquement.
          </p>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-md p-2 flex items-start gap-2">
        <Gift className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-800">
          <p>Atteignez votre seuil de retrait de <span className="font-semibold">{withdrawalThreshold}€</span> plus rapidement grâce aux revenus récurrents de vos filleuls !</p>
        </div>
      </div>
      
      <Button 
        size="sm" 
        variant="default" 
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 mt-1"
        onClick={onStartReferral}
      >
        <span>Commencer à parrainer</span>
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};

export default ReferralSuggestion;

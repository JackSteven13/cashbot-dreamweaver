
import React from 'react';
import { Users, Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
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
}

export const ReferralSuggestion: React.FC<ReferralSuggestionProps> = ({
  triggerElement,
  onStartReferral = () => window.location.href = "/dashboard/referrals"
}) => {
  const isMobile = useIsMobile();

  // Sur mobile, on utilise un Popover qui s'ouvre au clic
  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          {triggerElement}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <ReferralSuggestionContent onStartReferral={onStartReferral} />
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
        <ReferralSuggestionContent onStartReferral={onStartReferral} />
      </HoverCardContent>
    </HoverCard>
  );
};

// Contenu réutilisable pour le Popover et le HoverCard
const ReferralSuggestionContent: React.FC<{ onStartReferral: () => void }> = ({ onStartReferral }) => {
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
        <p className="text-xs text-blue-800">
          Atteignez votre seuil de retrait plus rapidement grâce aux revenus récurrents de vos filleuls !
        </p>
      </div>
      
      <Button 
        size="sm" 
        variant="default" 
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 mt-1"
        onClick={onStartReferral}
      >
        <span>Commencer maintenant</span>
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};

export default ReferralSuggestion;

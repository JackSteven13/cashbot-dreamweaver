
import React from 'react';
import { Users, Link2Icon, Gift } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ReferralSuggestionProps {
  referralLink: string;
  referralCount?: number;
  withdrawalThreshold?: number;
}

export const ReferralSuggestion: React.FC<ReferralSuggestionProps> = ({
  referralLink,
  referralCount = 0,
  withdrawalThreshold = 200
}) => {
  const handleStartReferral = () => {
    // Copier le lien dans le presse-papiers au lieu de naviguer
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        toast({
          title: "Lien de parrainage copié !",
          description: "Partagez-le avec vos amis pour gagner des commissions.",
          className: "bg-green-500 text-white"
        });
      })
      .catch(() => {
        toast({
          title: "Erreur",
          description: "Impossible de copier le lien. Veuillez réessayer.",
          variant: "destructive"
        });
      });
  };

  return (
    <div className="relative z-10 pb-6 pt-2 sm:pt-0 hover:-translate-y-0.5 transition-transform duration-300">
      {/* Affichage du parrainage */}
      <div className="bg-blue-900 p-4 rounded-lg shadow-md relative overflow-hidden">
        <Users className="absolute -right-2 -top-2 text-blue-800 opacity-10" size={60} />
        
        <div className="flex flex-col space-y-4">
          <div>
            <h4 className="text-blue-300 font-medium mb-1 flex items-center">
              <Users size={16} className="mr-1.5" />
              Gagnez plus avec le parrainage
            </h4>
            
            <p className="text-sm text-blue-100">
              Parrainez des amis et gagnez <span className="font-semibold">20-50%</span> de 
              leurs abonnements annuels, automatiquement.
            </p>
          </div>
          
          <div className="bg-blue-50 text-blue-800 p-3 rounded">
            <div className="flex items-start">
              <div className="mr-2 mt-0.5 text-amber-500">
                <Gift className="h-5 w-5" />
              </div>
              <p className="text-sm">
                Atteignez votre seuil de retrait de <span className="font-bold">{withdrawalThreshold}€</span> plus 
                rapidement grâce aux revenus récurrents de vos filleuls !
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleStartReferral}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center justify-center transition-colors"
          >
            <span>Commencer à parrainer</span>
            <Link2Icon size={18} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

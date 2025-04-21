
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/utils/balance/limitCalculations';
import { Users, Link, Copy, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  // Calculer un nombre d'affiliations suggéré plus petit et atteignable
  // (même si en réalité il en faudrait plus)
  const suggestedReferralsCount = Math.min(5, Math.max(1, Math.ceil(withdrawalThreshold / 200)));
  
  // S'assurer qu'un lien d'affiliation est toujours disponible
  const displayLink = referralLink || `${window.location.origin}/register?ref=generate`;
  
  // Fonction pour copier le lien
  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(displayLink);
      toast({
        title: "Lien copié !",
        description: "Votre lien d'affiliation a été copié dans le presse-papier"
      });
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      
      // Méthode alternative
      const textarea = document.createElement('textarea');
      textarea.value = displayLink;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        toast({
          title: "Lien copié !",
          description: "Votre lien d'affiliation a été copié dans le presse-papier"
        });
      } catch (err) {
        toast({
          title: "Erreur",
          description: "Impossible de copier le lien. Veuillez le sélectionner manuellement.",
          variant: "destructive"
        });
      }
      
      document.body.removeChild(textarea);
    }
  };
  
  return (
    <Card className="bg-white dark:bg-slate-800 border-t-4 border-t-purple-500 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Users className="h-5 w-5 mr-2 text-purple-500" />
          Programme d'affiliation
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {referralCount > 0 ? (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-semibold">{referralCount} affilié{referralCount > 1 ? 's' : ''} actif{referralCount > 1 ? 's' : ''}</span>
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
              {referralCount >= 3 ? 
                "Excellent! Vous êtes éligible pour les retraits prioritaires!" : 
                "Invitez encore quelques amis pour débloquer les retraits prioritaires!"}
            </p>
          </div>
        ) : (
          <div className="flex items-center space-x-2 mb-4 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Invitez <span className="font-semibold">{suggestedReferralsCount} ami{suggestedReferralsCount > 1 ? 's' : ''}</span> et débloquez jusqu'à <span className="font-bold">{formatPrice(withdrawalThreshold/2)}</span> de bonus!
            </p>
          </div>
        )}
        <div className="text-sm font-medium">
          Votre lien unique:
        </div>
        <div className="mt-2 mb-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm break-all">
          {displayLink}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300"
        >
          <Copy className="h-4 w-4" />
          Copier le lien
        </Button>
      </CardContent>
    </Card>
  );
};

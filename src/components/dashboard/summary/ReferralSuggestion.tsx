
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/utils/balance/limitCalculations';
import { Users, Link, Copy } from 'lucide-react';
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
  // Calculer le nombre approximatif d'affiliations nécessaires pour atteindre le seuil
  const estimatedReferralsNeeded = Math.max(0, Math.ceil((withdrawalThreshold - 0) / 50));
  
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
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {referralCount > 0 ? (
            <>Vous avez <span className="font-semibold">{referralCount} filleul{referralCount > 1 ? 's' : ''}</span>. Continuez à inviter des amis pour augmenter vos gains.</>
          ) : (
            <>Parrainez environ <span className="font-semibold">{estimatedReferralsNeeded} personne{estimatedReferralsNeeded > 1 ? 's' : ''}</span> pour atteindre le seuil de retrait de {formatPrice(withdrawalThreshold)}.</>
          )}
        </p>
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
          className="w-full flex items-center justify-center gap-2"
        >
          <Copy className="h-4 w-4" />
          Copier le lien
        </Button>
      </CardContent>
    </Card>
  );
};

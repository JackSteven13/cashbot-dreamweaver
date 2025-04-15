
import React, { useState } from 'react';
import { Copy, CheckCheck, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReferralLinkDisplayProps {
  referralLink: string;
  referralCount?: number;
}

const ReferralLinkDisplay: React.FC<ReferralLinkDisplayProps> = ({ 
  referralLink, 
  referralCount = 0 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    
    // Afficher un toast de confirmation
    toast({
      title: "Lien copié !",
      description: "Votre lien de parrainage a été copié dans le presse-papier",
      variant: "success",
    });
    
    // Réinitialiser l'état de copie après 2 secondes
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  // Gestion du partage via l'API Web Share si disponible
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mon lien de parrainage',
          text: 'Rejoignez-moi sur cette plateforme avec mon lien de parrainage !',
          url: referralLink
        });
      } else {
        // Si l'API Share n'est pas disponible, copier le lien
        handleCopyReferralLink();
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      handleCopyReferralLink();
    }
  };

  return (
    <Card className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Share2 className="h-5 w-5 mr-2 text-purple-600" />
          Votre lien de parrainage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">
          Partagez ce lien avec vos amis et gagnez jusqu'à <span className="font-medium text-purple-700">20%</span> de commission !
          {referralCount > 0 && (
            <span className="ml-1">Vous avez déjà <span className="font-medium text-purple-700">{referralCount}</span> filleul(s).</span>
          )}
        </p>
        
        <div className="flex space-x-2">
          <input 
            readOnly 
            value={referralLink} 
            className="font-mono text-sm flex-1 p-2 border rounded-md bg-white"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button 
            onClick={handleCopyReferralLink} 
            variant={copied ? "default" : "outline"}
            className={copied ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {copied ? <CheckCheck className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? "Copié" : "Copier"}
          </Button>
          <Button 
            onClick={handleShare}
            variant="default"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Partager
          </Button>
        </div>
        
        <div className="mt-4 bg-blue-100 p-3 rounded-md text-sm text-blue-800 border border-blue-200">
          <p className="font-medium mb-1">Comment ça marche :</p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Partagez votre lien avec vos amis</li>
            <li>Ils s'inscrivent via votre lien</li>
            <li>Vous recevez une commission sur leurs abonnements</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralLinkDisplay;

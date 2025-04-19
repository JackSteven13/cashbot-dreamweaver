
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogClose } from '@/components/ui/dialog';
import { Copy, CheckCheck, X, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { COMMISSION_RATES } from '@/components/dashboard/summary/constants';

interface ReferralLinkModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  referralLink: string;
  subscription?: string;
}

const ReferralLinkModal: React.FC<ReferralLinkModalProps> = ({ 
  open, 
  setOpen,
  referralLink,
  subscription = 'freemium'
}) => {
  const [copied, setCopied] = useState(false);
  const [displayedLink, setDisplayedLink] = useState("");

  // S'assurer que le lien est visible
  useEffect(() => {
    // Toujours avoir un lien à afficher
    setDisplayedLink(referralLink || `${window.location.origin}/register?ref=your-code`);
  }, [referralLink]);

  const handleCopyLink = () => {
    if (!displayedLink) {
      toast({
        title: "Erreur",
        description: "Lien d'affiliation indisponible",
        variant: "destructive"
      });
      return;
    }
    
    navigator.clipboard.writeText(displayedLink);
    setCopied(true);
    toast({
      title: "Lien copié !",
      description: "Votre lien d'affiliation a été copié dans le presse-papier",
      duration: 3000,
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleShare = async () => {
    if (!displayedLink) {
      toast({
        title: "Erreur",
        description: "Lien d'affiliation indisponible",
        variant: "destructive"
      });
      return;
    }

    // Vérifier si l'API de partage est disponible
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoignez-moi sur Stream Genius',
          text: 'Découvrez Stream Genius, une plateforme innovante pour gagner des revenus passifs',
          url: displayedLink,
        });
        toast({
          title: "Partage réussi !",
          description: "Votre lien a été partagé",
          duration: 3000,
        });
      } catch (error) {
        console.error('Erreur lors du partage:', error);
        // Si le partage échoue ou est annulé, proposer la copie
        handleCopyLink();
      }
    } else {
      // Si l'API de partage n'est pas disponible, copier dans le presse-papiers
      handleCopyLink();
    }
  };

  // Obtenir le taux de commission en fonction de l'abonnement
  const commissionRate = COMMISSION_RATES[subscription as keyof typeof COMMISSION_RATES] || 0.2;
  const commissionPercent = Math.round(commissionRate * 100);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Partagez votre lien d'affiliation
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Parrainez des amis et gagnez <span className="font-semibold text-green-600 dark:text-green-400">{commissionPercent}%</span> de commissions sur leurs abonnements !
          </p>

          <div className="relative">
            <input
              type="text"
              value={displayedLink}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="w-full p-2 pr-10 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md font-mono overflow-x-auto"
            />
            <div className="mt-2 flex gap-2">
              <Button 
                onClick={handleCopyLink} 
                variant={copied ? "default" : "outline"}
                className={`flex-1 ${copied ? "bg-green-600" : ""}`}
              >
                {copied ? <CheckCheck className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copié" : "Copier le lien"}
              </Button>
              
              <Button
                onClick={handleShare}
                variant="secondary"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Partager
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Comment ça marche :</h3>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li>Partagez votre lien unique avec vos amis</li>
              <li>Lorsqu'ils s'inscrivent avec votre lien, ils sont automatiquement enregistrés comme vos filleuls</li>
              <li>Vous recevez {commissionPercent}% de commission sur leurs abonnements</li>
              <li>Vos commissions sont ajoutées directement à votre solde disponible</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralLinkModal;

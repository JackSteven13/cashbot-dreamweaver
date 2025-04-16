
import React, { useState } from 'react';
import { Copy, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getCommissionRate } from '@/utils/referral/commissionUtils';
import { COMMISSION_RATES } from '@/components/dashboard/summary/constants';

interface ReferralSystemProps {
  referralLink: string;
  subscription?: string;
  className?: string;
}

const ReferralSystem: React.FC<ReferralSystemProps> = ({ 
  referralLink, 
  subscription = 'freemium',
  className = '' 
}) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  
  const handleCopyReferralLink = () => {
    if (!referralLink) {
      toast({
        title: "Erreur",
        description: "Lien d'affiliation non disponible. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
      return;
    }
    
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Lien copié !",
      description: "Votre lien d'affiliation a été copié dans le presse-papier",
    });
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Obtenir le taux de commission en fonction de l'abonnement
  const commissionRate = COMMISSION_RATES[subscription as keyof typeof COMMISSION_RATES] || 0.2;
  const commissionPercent = Math.round(commissionRate * 100);
  
  return (
    <div className={className}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            size="sm"
          >
            <span>Voir mon lien d'affiliation</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogTitle>
            Votre lien d'affiliation
          </DialogTitle>
          
          <div className="space-y-4 py-2">
            <div className="text-sm text-muted-foreground">
              Partagez votre lien avec vos amis et gagnez {commissionPercent}% de commissions sur leurs abonnements !
            </div>
            
            <div className="flex space-x-2">
              <input 
                readOnly 
                value={referralLink || "Chargement du lien..."} 
                className="font-mono text-sm flex-1 p-2 border rounded-md"
              />
              <Button onClick={handleCopyReferralLink} variant={copied ? "default" : "outline"} className="shrink-0">
                {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="bg-amber-50 border border-amber-100 rounded-md p-3 text-sm text-amber-800">
              <p className="font-medium">Comment ça marche :</p>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Partagez votre lien avec vos amis</li>
                <li>Ils créent un compte via votre lien</li>
                <li>Vous gagnez automatiquement une commission sur leurs abonnements</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferralSystem;

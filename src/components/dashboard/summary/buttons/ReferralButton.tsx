
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

interface ReferralButtonProps {
  referralLink: string;
}

const ReferralButton: React.FC<ReferralButtonProps> = ({ referralLink }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink).then(
      () => {
        setCopied(true);
        toast({
          title: "Lien copié!",
          description: "Votre lien de parrainage a été copié dans le presse-papiers",
          duration: 3000,
        });
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error('Impossible de copier le lien: ', err);
        toast({
          title: "Erreur",
          description: "Impossible de copier le lien. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    );
  };

  const shareOnSocialMedia = (platform: string) => {
    let url = '';
    const text = "Rejoignez-moi sur cette plateforme incroyable et commencez à générer des revenus!";
    
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + referralLink)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent('Invitation à rejoindre cette plateforme')}&body=${encodeURIComponent(text + '\n\n' + referralLink)}`;
        break;
      default:
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white"
              variant="default"
              size="lg"
            >
              <div className="flex items-center">
                <Share2 className="mr-2 h-5 w-5" />
                <span>Partager</span>
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Partagez votre lien de parrainage</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Partagez votre lien de parrainage</DialogTitle>
            <DialogDescription>
              Parrainez des amis et gagnez des commissions sur leurs activités.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-3">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-sm break-all">
                  {referralLink}
                </div>
              </div>
              <Button 
                className={`px-3 ${copied ? 'bg-green-500' : 'bg-blue-500'}`}
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-4 w-4" /> : 'Copier'}
              </Button>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Partager via</h4>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-16"
                  onClick={() => shareOnSocialMedia('facebook')}
                >
                  <div className="text-blue-600 text-xl mb-1">f</div>
                  <div className="text-xs">Facebook</div>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-16"
                  onClick={() => shareOnSocialMedia('twitter')}
                >
                  <div className="text-blue-400 text-xl mb-1">🐦</div>
                  <div className="text-xs">Twitter</div>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-16"
                  onClick={() => shareOnSocialMedia('whatsapp')}
                >
                  <div className="text-green-500 text-xl mb-1">📱</div>
                  <div className="text-xs">WhatsApp</div>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-16"
                  onClick={() => shareOnSocialMedia('telegram')}
                >
                  <div className="text-blue-500 text-xl mb-1">✈️</div>
                  <div className="text-xs">Telegram</div>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-16"
                  onClick={() => shareOnSocialMedia('email')}
                >
                  <div className="text-gray-600 dark:text-gray-300 text-xl mb-1">✉️</div>
                  <div className="text-xs">Email</div>
                </Button>
                <DialogClose asChild>
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center justify-center h-16"
                  >
                    <div className="text-gray-500 text-xl mb-1">✖️</div>
                    <div className="text-xs">Fermer</div>
                  </Button>
                </DialogClose>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReferralButton;

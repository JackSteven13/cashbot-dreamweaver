
import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  CheckCheck, 
  Link as LinkIcon,
  Twitter,
  Facebook,
  Mail,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ReferralSystemProps {
  referralLink: string;
  className?: string;
}

const ReferralSystem: React.FC<ReferralSystemProps> = ({ referralLink, className = '' }) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  
  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Lien copié !",
      description: "Votre lien de parrainage a été copié dans le presse-papier",
    });
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  const shareOptions = [
    {
      name: 'Twitter',
      icon: <Twitter className="h-5 w-5" />,
      action: () => {
        const text = "Rejoignez-moi sur Stream Genius et gagnez de l'argent en analysant les publicités!";
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`, '_blank');
      }
    },
    {
      name: 'Facebook',
      icon: <Facebook className="h-5 w-5" />,
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
      }
    },
    {
      name: 'Email',
      icon: <Mail className="h-5 w-5" />,
      action: () => {
        const subject = "Rejoignez-moi sur Stream Genius";
        const body = `Bonjour,\n\nJe voulais vous inviter à rejoindre Stream Genius. C'est un excellent moyen de générer des revenus passifs!\n\nVoici mon lien d'invitation: ${referralLink}\n\nÀ bientôt!`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      }
    },
    {
      name: 'SMS',
      icon: <Smartphone className="h-5 w-5" />,
      action: () => {
        const text = `Rejoins-moi sur Stream Genius pour gagner de l'argent: ${referralLink}`;
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          window.open(`sms:&body=${encodeURIComponent(text)}`);
        } else {
          window.open(`sms:?body=${encodeURIComponent(text)}`);
        }
      }
    }
  ];
  
  return (
    <div className={className}>
      {/* Bouton pour ouvrir la boîte de dialogue */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            size="sm"
          >
            <Share2 className="h-4 w-4" />
            <span>Partager mon lien</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogTitle>
            Partagez votre lien de parrainage
          </DialogTitle>
          
          <div className="space-y-4 py-2">
            <div className="text-sm text-muted-foreground">
              Partagez votre lien avec vos amis et gagnez 20-35% de commissions sur leurs abonnements!
            </div>
            
            <div className="flex space-x-2">
              <Input 
                readOnly 
                value={referralLink} 
                className="font-mono text-sm"
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
            
            <div>
              <h4 className="text-sm font-medium mb-2">Partager via :</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {shareOptions.map((option) => (
                  <Button 
                    key={option.name}
                    variant="outline" 
                    onClick={() => {
                      option.action();
                      toast({
                        title: `Partage via ${option.name}`,
                        description: "Merci de partager votre lien de parrainage!"
                      });
                    }}
                    className="flex flex-col gap-2 h-auto py-3"
                  >
                    {option.icon}
                    <span className="text-xs">{option.name}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            <Button 
              className="w-full"
              onClick={() => {
                handleCopyReferralLink();
                setOpen(false);
              }}
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Copier et fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferralSystem;

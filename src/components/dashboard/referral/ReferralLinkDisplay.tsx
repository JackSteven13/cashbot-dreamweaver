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
  const [displayedLink, setDisplayedLink] = useState("");
  
  React.useEffect(() => {
    const linkToDisplay = referralLink || `${window.location.origin}/register?ref=your-code`;
    setDisplayedLink(linkToDisplay);
  }, [referralLink]);

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(displayedLink);
    setCopied(true);
    
    toast({
      title: "Lien copié !",
      description: "Votre lien d'affiliation a été copié dans le presse-papier",
      variant: "default",
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mon lien d\'affiliation',
          text: 'Rejoignez-moi sur cette plateforme avec mon lien d\'affiliation !',
          url: displayedLink
        });
      } else {
        handleCopyReferralLink();
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      handleCopyReferralLink();
    }
  };

  return (
    <Card className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Share2 className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
          Votre lien d'affiliation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Partagez ce lien avec vos amis et gagnez jusqu'à <span className="font-medium text-purple-700 dark:text-purple-400">20%</span> de commission !
          {referralCount > 0 && (
            <span className="ml-1">Vous avez déjà <span className="font-medium text-purple-700 dark:text-purple-400">{referralCount}</span> filleul(s).</span>
          )}
        </p>
        
        <div className="flex flex-col gap-2">
          <div className="relative w-full">
            <input 
              readOnly 
              value={displayedLink} 
              className="w-full font-mono text-xs sm:text-sm p-2 border rounded-md bg-white dark:bg-slate-800 text-black dark:text-white overflow-x-auto"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleCopyReferralLink} 
              variant={copied ? "default" : "outline"}
              className={`flex-1 ${copied ? "bg-green-600 hover:bg-green-700" : ""}`}
            >
              {copied ? <CheckCheck className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copié" : "Copier"}
            </Button>
            <Button 
              onClick={handleShare}
              variant="default"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Partager
            </Button>
          </div>
        </div>
        
        <div className="mt-4 bg-blue-100 dark:bg-blue-800/30 p-3 rounded-md text-sm text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700/50">
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

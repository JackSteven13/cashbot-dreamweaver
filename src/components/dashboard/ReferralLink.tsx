
import React, { useState, useEffect } from 'react';
import { Copy, CheckCheck, Award, Users, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ReferralLinkProps {
  referralLink: string;
  referrals?: any[];
}

const AffiliationLink: React.FC<ReferralLinkProps> = ({ referralLink, referrals = [] }) => {
  const [copied, setCopied] = useState(false);
  const [displayedLink, setDisplayedLink] = useState("");
  const [isLinkReady, setIsLinkReady] = useState(false);

  useEffect(() => {
    if (!referralLink || referralLink === '') {
      const fallbackLink = `${window.location.origin}/register?ref=generate`;
      setDisplayedLink(fallbackLink);
      setIsLinkReady(true);
      console.log("Lien d'affiliation non fourni, utilisation d'un lien temporaire", fallbackLink);
      return;
    }

    let processedLink = referralLink;
    if (!processedLink.startsWith('http')) {
      processedLink = `${window.location.origin}/register?ref=${processedLink.split('ref=').pop() || ''}`;
    }
    
    setDisplayedLink(processedLink);
    setIsLinkReady(true);
    console.log("Lien d'affiliation formaté:", processedLink);
  }, [referralLink]);

  const handleCopyReferralLink = () => {
    if (!isLinkReady) {
      toast({
        title: "Lien en cours de chargement",
        description: "Veuillez patienter pendant que le lien se génère.",
        variant: "default"
      });
      return;
    }
    
    try {
      navigator.clipboard.writeText(displayedLink)
        .then(() => {
          setCopied(true);
          toast({
            title: "Lien copié !",
            description: "Votre lien d'affiliation a été copié dans le presse-papier",
            variant: "default"
          });
          
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error("Erreur copie clipboard API:", err);
          fallbackCopy();
        });
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      fallbackCopy();
    }
  };
  
  const fallbackCopy = () => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = displayedLink;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        toast({
          title: "Lien copié !",
          description: "Votre lien d'affiliation a été copié dans le presse-papier",
          variant: "default"
        });
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error("Copie échouée");
      }
      document.body.removeChild(textArea);
    } catch (error) {
      console.error("Fallback copy failed:", error);
      toast({
        title: "Échec de la copie",
        description: "Veuillez sélectionner et copier le lien manuellement",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (!isLinkReady) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mon lien d\'affiliation Stream Genius',
          text: 'Rejoins Stream Genius et gagne de l\'argent avec l\'analyse publicitaire! Utilise mon lien d\'affiliation:',
          url: displayedLink
        });
        toast({
          title: "Partage réussi",
          description: "Merci d'avoir partagé votre lien!"
        });
      } else {
        handleCopyReferralLink();
      }
    } catch (error) {
      console.error('Erreur de partage:', error);
      handleCopyReferralLink();
    }
  };

  return (
    <div className="mt-4 sm:mt-8 rounded-lg overflow-hidden border border-blue-100 dark:border-blue-800/50 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-sm">
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2">
          <Award className="text-amber-500 dark:text-amber-400 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
          <h3 className="text-lg sm:text-xl font-semibold text-[#1e3a5f] dark:text-blue-100">Programme d'affiliation</h3>
        </div>
        
        <div className="bg-white dark:bg-slate-800/60 rounded-lg p-3 sm:p-4 shadow-sm border border-blue-100 dark:border-blue-800/50">
          <p className="text-xs sm:text-sm text-[#486581] dark:text-slate-300 mb-2 sm:mb-3 font-medium">
            Partagez ce lien avec vos amis et gagnez <span className="font-bold text-green-600 dark:text-green-400">20% de commission</span> sur les abonnements!
          </p>
          
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="relative w-full">
              <Input
                value={isLinkReady ? displayedLink : "Chargement du lien..."}
                readOnly
                onClick={(e) => {
                  if (isLinkReady) {
                    (e.target as HTMLInputElement).select();
                  }
                }}
                className="font-mono text-xs sm:text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500 w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={handleCopyReferralLink} 
                className={`border ${copied ? 'bg-green-500 text-white' : 'bg-[#f0f4f8] dark:bg-slate-800 text-[#334e68] dark:text-slate-200'} hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-all duration-200 w-full`}
                disabled={copied || !isLinkReady}
                size="sm"
              >
                {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
                <span className="ml-2">{copied ? "Copié !" : "Copier"}</span>
              </Button>
              <Button 
                variant="default"
                onClick={handleShare}
                disabled={!isLinkReady}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                size="sm"
              >
                <Share2 size={16} />
                <span className="ml-2">Partager</span>
              </Button>
            </div>
          </div>
          
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-2 sm:p-3 rounded-md border border-amber-100 dark:border-amber-800/50 flex items-start gap-2">
              <div>
                <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 font-medium">Gagnez 20% de commission</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">Sans limite de filleuls!</p>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-md border border-blue-100 dark:border-blue-800/50 flex items-start gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 font-medium">{referrals.length} membre{referrals.length !== 1 ? 's' : ''}</p>
                <p className="text-xs text-blue-700 dark:text-blue-400">Invitez vos amis!</p>
              </div>
            </div>
          </div>
        </div>
        
        {referrals.length > 0 ? (
          <div className="mt-2 sm:mt-4 bg-white dark:bg-slate-800/60 rounded-md border border-gray-200 dark:border-gray-700 p-2 sm:p-3">
            <h4 className="text-xs sm:text-sm font-semibold text-[#334e68] dark:text-slate-200 mb-2">Vos membres affiliés :</h4>
            <div className="space-y-1 sm:space-y-2 max-h-28 sm:max-h-40 overflow-y-auto">
              {referrals.map((referral, index) => (
                <div key={index} className="p-1 sm:p-2 border border-gray-100 dark:border-gray-800 rounded flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 text-xs sm:text-sm">
                  <span>{new Date(referral.created_at).toLocaleDateString()}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                    {referral.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md p-2 sm:p-3 text-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Vous n'avez pas encore de membres affiliés.</p>
            <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">Partagez votre lien pour commencer à gagner !</p>
          </div>
        )}
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-medium py-1 hover:no-underline">
              Comment ça marche ?
            </AccordionTrigger>
            <AccordionContent className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-md border border-blue-100 dark:border-blue-800/50 text-xs text-blue-700 dark:text-blue-300">
              <ol className="list-decimal ml-4 space-y-1">
                <li>Partagez votre lien d'affiliation</li>
                <li>Vos amis créent un compte et s'abonnent</li>
                <li>Vous recevez 20% de leur abonnement</li>
                <li>Les commissions sont ajoutées à votre solde chaque mois</li>
                <li>Augmentez vos revenus passifs avec chaque nouveau membre affilié</li>
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default AffiliationLink;

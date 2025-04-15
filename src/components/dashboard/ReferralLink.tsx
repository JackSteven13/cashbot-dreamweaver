
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

const ReferralLink: React.FC<ReferralLinkProps> = ({ referralLink, referrals = [] }) => {
  const [copied, setCopied] = useState(false);
  const [displayedLink, setDisplayedLink] = useState("");
  const [isLinkReady, setIsLinkReady] = useState(false);

  // S'assurer que le lien est correctement généré
  useEffect(() => {
    if (referralLink) {
      // S'assurer que le lien est complet avec le protocole
      let processedLink = referralLink;
      if (!processedLink.startsWith('http')) {
        processedLink = `${window.location.origin}/register?ref=${processedLink.split('ref=').pop() || ''}`;
      }
      setDisplayedLink(processedLink);
      setIsLinkReady(true);
    } else {
      // Fallback si le lien n'est pas disponible
      setDisplayedLink(`${window.location.origin}/register`);
    }
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
      navigator.clipboard.writeText(displayedLink);
      setCopied(true);
      
      toast({
        title: "Lien copié !",
        description: "Votre lien de parrainage a été copié dans le presse-papier",
        variant: "default"
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      toast({
        title: "Erreur de copie",
        description: "Impossible de copier le lien. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (!isLinkReady) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mon lien de parrainage Stream Genius',
          text: 'Rejoins Stream Genius et gagne de l\'argent avec l\'analyse publicitaire! Utilise mon lien de parrainage:',
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
    <div className="mt-8 rounded-lg overflow-hidden border border-blue-100 dark:border-blue-800/50 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-900/20 dark:to-indigo-900/20">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="text-amber-500 dark:text-amber-400 h-6 w-6 flex-shrink-0" />
          <h3 className="text-xl font-semibold text-[#1e3a5f] dark:text-blue-100">Programme de parrainage</h3>
        </div>
        
        <div className="bg-white dark:bg-slate-800/60 rounded-lg p-4 shadow-sm border border-blue-100 dark:border-blue-800/50">
          <p className="text-sm text-[#486581] dark:text-slate-300 mb-3 font-medium">
            Partagez ce lien avec vos amis et gagnez <span className="font-bold text-green-600 dark:text-green-400">20% de commission</span> sur les revenus de leurs abonnements !
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                value={isLinkReady ? displayedLink : "Chargement du lien..."}
                readOnly
                onClick={(e) => {
                  if (isLinkReady) {
                    (e.target as HTMLInputElement).select();
                  }
                }}
                className="font-mono text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleCopyReferralLink} 
                className={`border ${copied ? 'bg-green-500 text-white' : 'bg-[#f0f4f8] dark:bg-slate-800 text-[#334e68] dark:text-slate-200'} hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-all duration-200 w-full sm:w-auto`}
                disabled={copied || !isLinkReady}
              >
                {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
                <span className="ml-2">{copied ? "Copié !" : "Copier"}</span>
              </Button>
              <Button 
                variant="default"
                onClick={handleShare}
                disabled={!isLinkReady}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                <Share2 size={16} />
                <span className="ml-2">Partager</span>
              </Button>
            </div>
          </div>
          
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md border border-amber-100 dark:border-amber-800/50 flex items-start gap-2">
              <div>
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">Gagnez 20% de commission</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">Sans limite de filleuls ni plafond de gains!</p>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800/50 flex items-start gap-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">{referrals.length} filleul{referrals.length !== 1 ? 's' : ''} actif{referrals.length !== 1 ? 's' : ''}</p>
                <p className="text-xs text-blue-700 dark:text-blue-400">Invitez vos amis pour augmenter vos gains!</p>
              </div>
            </div>
          </div>
        </div>
        
        {referrals.length > 0 ? (
          <div className="mt-4 bg-white dark:bg-slate-800/60 rounded-md border border-gray-200 dark:border-gray-700 p-3">
            <h4 className="text-sm font-semibold text-[#334e68] dark:text-slate-200 mb-2">Vos filleuls actifs :</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {referrals.map((referral, index) => (
                <div key={index} className="p-2 border border-gray-100 dark:border-gray-800 rounded flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 text-sm">
                  <span>{new Date(referral.created_at).toLocaleDateString()}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                    {referral.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md p-3 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Vous n'avez pas encore de filleuls.</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Partagez votre lien pour commencer à gagner !</p>
          </div>
        )}
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="text-blue-600 dark:text-blue-400 text-sm font-medium py-1 hover:no-underline">
              Comment ça marche ?
            </AccordionTrigger>
            <AccordionContent className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800/50 text-xs text-blue-700 dark:text-blue-300">
              <ol className="list-decimal ml-4 space-y-1">
                <li>Partagez votre lien de parrainage avec vos amis</li>
                <li>Ils créent un compte avec votre lien et souscrivent à un abonnement</li>
                <li>Vous recevez automatiquement 20% de leur abonnement mensuel</li>
                <li>Les commissions sont ajoutées à votre solde disponible chaque mois</li>
                <li>Votre revenu passif augmente avec chaque nouveau filleul</li>
              </ol>
              <p className="mt-2 font-medium text-blue-800 dark:text-blue-200">Les commissions sont attribuées automatiquement chaque mois!</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default ReferralLink;

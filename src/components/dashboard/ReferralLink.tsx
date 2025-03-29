
import React, { useState } from 'react';
import { Copy, CheckCheck, Award, Users, DollarSign, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { 
  Table, 
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mon lien de parrainage Stream Genius',
          text: 'Rejoins Stream Genius et gagne de l\'argent avec l\'analyse publicitaire! Utilise mon lien de parrainage:',
          url: referralLink
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
    <div className="mt-8 rounded-lg overflow-hidden border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="text-amber-500 h-6 w-6 flex-shrink-0" />
          <h3 className="text-xl font-semibold text-[#1e3a5f]">Programme de parrainage</h3>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
          <p className="text-sm text-[#486581] mb-3 font-medium">
            Partagez ce lien avec vos amis et gagnez <span className="font-bold text-green-600">35% de commission</span> sur les revenus de leurs abonnements !
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={referralLink} 
                readOnly 
                className="bg-white rounded-lg px-3 py-2 w-full text-sm text-[#334e68] border border-[#cbd5e0] focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleCopyReferralLink} 
                className="border border-[#cbd5e0] bg-[#f0f4f8] hover:bg-blue-100 text-[#334e68] transition-all duration-200 flex-1 sm:flex-none"
                disabled={copied}
              >
                {copied ? <CheckCheck size={16} className="text-green-500" /> : <Copy size={16} />}
                <span className="ml-2">{copied ? "Copié !" : "Copier"}</span>
              </Button>
              <Button 
                variant="default"
                onClick={handleShare}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
              >
                <LinkIcon size={16} />
                <span className="ml-2">Partager</span>
              </Button>
            </div>
          </div>
          
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="bg-amber-50 p-3 rounded-md border border-amber-100 flex items-start gap-2">
              <DollarSign className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">Gagnez 35% de commission</p>
                <p className="text-xs text-amber-700">Sans limite de filleuls ni plafond de gains!</p>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 flex items-start gap-2">
              <Users className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">{referrals.length} filleul{referrals.length !== 1 ? 's' : ''} actif{referrals.length !== 1 ? 's' : ''}</p>
                <p className="text-xs text-blue-700">Invitez vos amis pour augmenter vos gains!</p>
              </div>
            </div>
          </div>
        </div>
        
        {referrals.length > 0 ? (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-[#334e68] mb-2">Vos filleuls actifs :</h4>
            <div className="bg-white rounded-md border border-gray-200 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Abonnement</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(referral.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {referral.plan_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {referral.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-center">
            <p className="text-sm text-gray-600">Vous n'avez pas encore de filleuls.</p>
            <p className="text-sm text-blue-600 font-medium">Partagez votre lien pour commencer à gagner !</p>
          </div>
        )}
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="text-blue-600 text-sm font-medium py-1 hover:no-underline">
              Comment ça marche ?
            </AccordionTrigger>
            <AccordionContent className="bg-blue-50 p-3 rounded-md border border-blue-100 text-xs text-blue-700">
              <ol className="list-decimal ml-4 space-y-1">
                <li>Partagez votre lien de parrainage avec vos amis</li>
                <li>Ils créent un compte avec votre lien et souscrivent à un abonnement</li>
                <li>Vous recevez automatiquement 35% de leur abonnement mensuel (après frais Stripe)</li>
                <li>Les commissions sont ajoutées à votre solde disponible chaque mois</li>
                <li>Votre revenu passif augmente avec chaque nouveau filleul</li>
              </ol>
              <p className="mt-2 font-medium text-blue-800">Les commissions sont attribuées automatiquement chaque mois - aucune action supplémentaire requise!</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default ReferralLink;

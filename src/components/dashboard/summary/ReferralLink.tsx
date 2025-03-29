
import React, { useState } from 'react';
import { Copy, CheckCheck, Award, Users } from 'lucide-react';
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
import { COMMISSION_RATES, RECURRING_COMMISSION_RATES, LEVEL2_COMMISSION_RATES } from '@/components/dashboard/summary/constants';

interface ReferralLinkProps {
  referralLink: string;
  referrals?: any[];
  subscription: string;
  isTopReferrer?: boolean;
}

const ReferralLink: React.FC<ReferralLinkProps> = ({ 
  referralLink, 
  referrals = [], 
  subscription = 'freemium',
  isTopReferrer = false
}) => {
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

  // Get commission rates based on subscription
  const directCommission = COMMISSION_RATES[subscription as keyof typeof COMMISSION_RATES] || 0.35;
  const recurringCommission = RECURRING_COMMISSION_RATES[subscription as keyof typeof RECURRING_COMMISSION_RATES] || 0;
  const level2Commission = LEVEL2_COMMISSION_RATES[subscription as keyof typeof LEVEL2_COMMISSION_RATES] || 0;

  return (
    <div className="mt-8 border border-blue-100 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex items-center mb-3 justify-between">
        <div className="flex items-center">
          <Award className="text-amber-500 h-5 w-5 mr-2" />
          <h3 className="text-lg font-semibold text-[#1e3a5f]">Programme de parrainage</h3>
        </div>
        
        {isTopReferrer && (
          <div className="bg-amber-500/20 border border-amber-500/30 text-amber-700 text-xs font-medium py-1 px-2 rounded-full flex items-center">
            <Users className="h-3 w-3 mr-1" />
            Top Parrain
          </div>
        )}
      </div>
      
      <p className="text-sm text-[#486581] mb-3">
        Partagez ce lien avec vos amis et gagnez <span className="font-bold text-green-600">{Math.round(directCommission * 100)}% de commission</span> sur leurs abonnements !
        {recurringCommission > 0 && (
          <span className="font-bold text-amber-600"> + {Math.round(recurringCommission * 100)}% récurrent</span>
        )}
        {level2Commission > 0 && (
          <span className="font-bold text-purple-600"> + {Math.round(level2Commission * 100)}% niveau 2</span>
        )}
      </p>
      
      <div className="flex flex-col sm:flex-row mb-3">
        <div className="relative flex-1 mb-2 sm:mb-0">
          <input 
            type="text" 
            value={referralLink} 
            readOnly 
            className="bg-white rounded-lg sm:rounded-r-none px-3 py-2 w-full text-sm text-[#334e68] border border-[#cbd5e0] focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={handleCopyReferralLink} 
          className="sm:rounded-l-none border border-[#cbd5e0] bg-[#f0f4f8] hover:bg-blue-100 text-[#334e68] transition-all duration-200 whitespace-nowrap"
          disabled={copied}
        >
          {copied ? <CheckCheck size={16} className="text-green-500" /> : <Copy size={16} />}
          <span className="ml-2">{copied ? "Copié !" : "Copier"}</span>
        </Button>
      </div>
      
      <div className="bg-amber-50 p-3 rounded-md border border-amber-100 mb-4">
        <p className="text-sm text-amber-800 font-medium">
          💰 Gagnez <span className="font-bold">{Math.round(directCommission * 100)}%</span> sur les abonnements de chaque personne qui s'inscrit avec votre lien !
        </p>
        {recurringCommission > 0 && (
          <p className="text-xs text-amber-700 mt-1">
            ✨ Bonus récurrent : recevez <span className="font-bold">{Math.round(recurringCommission * 100)}%</span> de commission tous les mois !
          </p>
        )}
        {level2Commission > 0 && (
          <p className="text-xs text-amber-700 mt-1">
            🌟 Bonus niveau 2 : gagnez <span className="font-bold">{Math.round(level2Commission * 100)}%</span> sur les abonnements des filleuls de vos filleuls !
          </p>
        )}
      </div>
      
      {referrals.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-[#334e68] mb-2">Vos filleuls actifs :</h4>
          <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
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
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {referral.plan_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
        <div className="text-sm text-gray-500 text-center py-2">
          Vous n'avez pas encore de filleuls. Partagez votre lien pour commencer à gagner !
        </div>
      )}
      
      <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-100 text-xs text-blue-700">
        <p className="font-medium">Comment ça marche :</p>
        <ol className="list-decimal ml-4 mt-1 space-y-1">
          <li>Partagez votre lien de parrainage avec vos amis</li>
          <li>Ils créent un compte avec votre lien et souscrivent à un abonnement</li>
          <li>Vous recevez automatiquement {Math.round(directCommission * 100)}% de leurs abonnements</li>
          {recurringCommission > 0 && (
            <li>Vous continuez à recevoir {Math.round(recurringCommission * 100)}% de leurs abonnements chaque mois</li>
          )}
          {level2Commission > 0 && (
            <li>Vous gagnez aussi {Math.round(level2Commission * 100)}% sur les abonnements des filleuls de vos filleuls</li>
          )}
          <li>Les commissions sont ajoutées à votre solde disponible sous 30 jours</li>
        </ol>
      </div>
    </div>
  );
};

export default ReferralLink;


import React, { useState } from 'react';
import { Copy, CheckCheck, Award } from 'lucide-react';
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

  return (
    <div className="mt-8 border border-blue-100 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex items-center mb-3">
        <Award className="text-amber-500 h-5 w-5 mr-2" />
        <h3 className="text-lg font-semibold text-[#1e3a5f]">Programme de parrainage</h3>
      </div>
      
      <p className="text-sm text-[#486581] mb-3">Partagez ce lien avec vos amis et gagnez <span className="font-bold text-green-600">70% de commission</span> sur leurs revenus !</p>
      
      <div className="flex flex-col sm:flex-row mb-3 gap-2">
        <input 
          type="text" 
          value={referralLink} 
          readOnly 
          className="bg-white rounded-lg sm:rounded-r-none px-3 py-2 flex-1 text-sm text-[#334e68] border border-[#cbd5e0] focus:ring-2 focus:ring-blue-300 w-full"
        />
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
          💰 Gagnez <span className="font-bold">70%</span> sur les revenus de chaque personne qui s'inscrit avec votre lien !
        </p>
      </div>
      
      {referrals.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-[#334e68] mb-2">Vos filleuls actifs :</h4>
          <div className="bg-white rounded-md border border-gray-200 overflow-hidden overflow-x-auto">
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
      
      <div className="mt-4">
        <button 
          className="text-blue-600 text-sm font-medium flex items-center"
          onClick={() => document.getElementById('referral-details')?.classList.toggle('hidden')}
        >
          Comment ça marche <span className="ml-1">↓</span>
        </button>
        
        <div id="referral-details" className="hidden mt-2 bg-blue-50 p-3 rounded-md border border-blue-100 text-xs text-blue-700">
          <p className="font-medium">Comment ça marche :</p>
          <ol className="list-decimal ml-4 mt-1 space-y-1">
            <li>Partagez votre lien de parrainage avec vos amis</li>
            <li>Ils créent un compte avec votre lien et souscrivent à un abonnement</li>
            <li>Vous recevez automatiquement 70% de leurs revenus</li>
            <li>Les commissions sont ajoutées à votre solde disponible</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ReferralLink;

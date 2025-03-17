
import React, { useState } from 'react';
import { Copy, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface ReferralLinkProps {
  referralLink: string;
}

const ReferralLink: React.FC<ReferralLinkProps> = ({ referralLink }) => {
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
      <h3 className="text-lg font-semibold mb-3 text-[#1e3a5f]">🚀 Votre lien de parrainage</h3>
      <p className="text-sm text-[#486581] mb-3">Partagez ce lien avec vos amis et gagnez 70% de commission sur leurs revenus !</p>
      <div className="flex">
        <input 
          type="text" 
          value={referralLink} 
          readOnly 
          className="bg-white rounded-l-lg px-3 py-2 flex-1 text-sm text-[#334e68] border border-[#cbd5e0] focus:ring-2 focus:ring-blue-300"
        />
        <Button 
          variant="outline" 
          onClick={handleCopyReferralLink} 
          className="rounded-l-none border border-[#cbd5e0] bg-[#f0f4f8] hover:bg-blue-100 text-[#334e68] transition-all duration-200"
          disabled={copied}
        >
          {copied ? <CheckCheck size={16} className="text-green-500" /> : <Copy size={16} />}
          <span className="ml-2">{copied ? "Copié !" : "Copier"}</span>
        </Button>
      </div>
      <div className="mt-4 bg-amber-50 p-2 rounded-md border border-amber-100">
        <p className="text-sm text-amber-800 font-medium">
          💰 Gagnez 70% sur les revenus de chaque personne qui s'inscrit avec votre lien !
        </p>
      </div>
    </div>
  );
};

export default ReferralLink;

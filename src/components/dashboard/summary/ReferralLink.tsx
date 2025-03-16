
import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface ReferralLinkProps {
  referralLink: string;
}

const ReferralLink: React.FC<ReferralLinkProps> = ({ referralLink }) => {
  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Lien copié !",
      description: "Votre lien de parrainage a été copié dans le presse-papier",
    });
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-3 text-[#1e3a5f]">🚀 Votre lien magique :</h3>
      <div className="flex">
        <input 
          type="text" 
          value={referralLink} 
          readOnly 
          className="bg-[#f0f4f8] rounded-l-lg px-3 py-2 flex-1 text-sm text-[#334e68] border-[#cbd5e0]"
        />
        <Button variant="outline" onClick={handleCopyReferralLink} className="rounded-l-none border-[#cbd5e0] bg-[#f0f4f8] text-[#334e68]">
          <Copy size={16} />
        </Button>
      </div>
      <p className="text-sm text-[#486581] mt-2">Gagnez 70% sur chaque filleul !</p>
    </div>
  );
};

export default ReferralLink;

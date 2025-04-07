
import React, { useState } from 'react';
import { Copy, CheckCheck, Award, Users, PercentIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface ReferralCardProps {
  referralLink: string;
  referralCount?: number;
  subscription?: string;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ 
  referralLink, 
  referralCount = 0, 
  subscription = 'freemium' 
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

  return (
    <div className="mt-4 bg-slate-800/60 rounded-lg p-4 border border-slate-700/50 shadow-lg">
      <div className="flex items-center mb-3">
        <Award className="text-amber-500 h-5 w-5 mr-2" />
        <h3 className="text-lg font-semibold text-slate-200">Programme de parrainage</h3>
      </div>
      
      <p className="text-sm text-slate-300 mb-3">
        Partagez ce lien avec vos amis et gagnez <span className="font-bold text-green-400">20% de commission</span> sur leurs abonnements !
      </p>
      
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <input 
            type="text" 
            value={referralLink} 
            readOnly 
            className="bg-slate-700/50 rounded-lg px-3 py-2 w-full text-sm text-slate-300 border border-slate-600"
          />
        </div>
        <Button 
          variant="secondary" 
          onClick={handleCopyReferralLink} 
          className="transition-all duration-200"
          disabled={copied}
        >
          {copied ? <CheckCheck size={16} className="text-green-500 mr-2" /> : <Copy size={16} className="mr-2" />}
          {copied ? "Copié !" : "Copier"}
        </Button>
      </div>
      
      <div className="bg-slate-700/40 p-3 rounded-md border border-slate-600/50">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-400" />
          <div>
            <p className="text-sm font-medium text-slate-200">{referralCount} filleul{referralCount !== 1 ? 's' : ''}</p>
            <p className="text-xs text-slate-400">Invitez vos amis pour augmenter vos gains!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralCard;

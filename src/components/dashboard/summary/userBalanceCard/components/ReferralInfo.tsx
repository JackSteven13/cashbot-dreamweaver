
import React from 'react';
import { Users } from 'lucide-react';

interface ReferralInfoProps {
  referralCount: number;
  referralBonus: number;
}

const ReferralInfo: React.FC<ReferralInfoProps> = ({ referralCount, referralBonus }) => {
  if (referralCount > 0) {
    return (
      <div className="mt-4 bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border border-white/5 flex justify-between items-center hover:border-[#9b87f5]/30 transition-all duration-300 group">
        <div>
          <div className="text-xs text-white/70 mb-1">Filleuls actifs</div>
          <div className="font-medium flex items-center">
            {referralCount} {referralCount > 1 ? 'personnes' : 'personne'}
            <span className="text-green-400 ml-2 text-xs">(+{referralBonus}% de gains)</span>
          </div>
        </div>
        <Users className="h-5 w-5 text-white/70 group-hover:text-[#9b87f5] transition-colors duration-300" />
      </div>
    );
  }
  
  return (
    <div className="mt-4 bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border border-white/5 flex justify-between items-center opacity-80 hover:opacity-100 hover:border-[#9b87f5]/30 transition-all duration-300 group">
      <div>
        <div className="text-xs text-white/70 mb-1">Filleuls actifs</div>
        <div className="font-medium text-white/80">Aucun filleul</div>
      </div>
      <Users className="h-5 w-5 text-white/50 group-hover:text-[#9b87f5] transition-colors duration-300" />
    </div>
  );
};

export default ReferralInfo;

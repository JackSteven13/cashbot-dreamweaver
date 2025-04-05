
import React from 'react';

interface ReferralInfoProps {
  referralCount: number;
  referralBonus: number;
}

const ReferralInfo: React.FC<ReferralInfoProps> = ({
  referralCount = 0,
  referralBonus = 0
}) => {
  // Ensure we have valid numbers
  const safeReferralCount = typeof referralCount === 'number' ? referralCount : 0;
  const safeReferralBonus = typeof referralBonus === 'number' ? referralBonus : 0;
  
  // Format numbers safely
  const formattedReferralBonus = safeReferralBonus.toFixed(2);
  
  return (
    <div className="mt-4 border-t border-gray-600/50 pt-3">
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-300">
          Parrainages actifs
        </div>
        <div className="text-sm">
          <span className="text-yellow-400 font-semibold">{safeReferralCount}</span>
          <span className="text-gray-400 ml-2">
            ({formattedReferralBonus}€)
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReferralInfo;

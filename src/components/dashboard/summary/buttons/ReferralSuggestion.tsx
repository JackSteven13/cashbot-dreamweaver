
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/utils/balance/limitCalculations';
import { Users } from 'lucide-react';

interface ReferralSuggestionProps {
  referralLink: string;
  referralCount?: number;
  withdrawalThreshold?: number;
}

export const ReferralSuggestion: React.FC<ReferralSuggestionProps> = ({ 
  referralLink, 
  referralCount = 0,
  withdrawalThreshold = 200
}) => {
  // Calculer le nombre approximatif de parrainages nécessaires pour atteindre le seuil
  const estimatedReferralsNeeded = Math.max(0, Math.ceil((withdrawalThreshold - 0) / 50));
  
  return (
    <Card className="bg-white dark:bg-slate-800 border-t-4 border-t-purple-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Users className="h-5 w-5 mr-2 text-purple-500" />
          Programme de parrainage
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {referralCount > 0 ? (
            <>Vous avez <span className="font-semibold">{referralCount} filleul{referralCount > 1 ? 's' : ''}</span>. Continuez à inviter des amis pour augmenter vos gains.</>
          ) : (
            <>Parrainez environ <span className="font-semibold">{estimatedReferralsNeeded} personne{estimatedReferralsNeeded > 1 ? 's' : ''}</span> pour atteindre le seuil de retrait de {formatPrice(withdrawalThreshold)}.</>
          )}
        </p>
        <div className="text-sm font-medium">
          Votre lien unique:
        </div>
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm break-all">
          {referralLink}
        </div>
      </CardContent>
    </Card>
  );
};

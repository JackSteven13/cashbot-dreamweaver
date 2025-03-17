
import React from 'react';
import { DollarSign, Users } from 'lucide-react';

interface UserBalanceCardProps {
  displayBalance: number;
  subscription: string;
  dailyLimit: number;
  sessionsDisplay: string;
  referralCount: number;
  referralBonus?: number;
}

const UserBalanceCard: React.FC<UserBalanceCardProps> = ({
  displayBalance,
  subscription,
  dailyLimit,
  sessionsDisplay,
  referralCount,
  referralBonus = 0,
}) => {
  return (
    <div className="flex-1">
      <div className="flex items-center mb-4">
        <DollarSign className="text-[#2d5f8a] h-8 w-8 mr-2" />
        <h2 className="text-2xl font-semibold text-[#1e3a5f]">
          Solde : {displayBalance.toFixed(2)}€
        </h2>
      </div>
      
      <div className="mb-3 bg-blue-50 p-3 rounded-md border border-blue-100">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Abonnement actuel :</span> {subscription.charAt(0).toUpperCase() + subscription.slice(1)}
        </p>
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Gain maximum :</span> {dailyLimit}€ par jour
        </p>
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Sessions :</span> {sessionsDisplay}
        </p>
        <div className="flex items-center mt-1">
          <Users size={16} className="text-blue-800 mr-1" />
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Filleuls actifs :</span> {referralCount}
            {referralCount > 0 && (
              <span className="ml-1 text-green-600 font-medium">(+{referralBonus}% de bonus)</span>
            )}
          </p>
        </div>
      </div>
      
      {referralCount > 0 && (
        <div className="mb-3 bg-green-50 p-3 rounded-md border border-green-100">
          <p className="text-sm text-green-800 font-medium">
            🎉 Félicitations ! Vos {referralCount} filleuls vous rapportent un bonus de {referralBonus}% sur vos gains.
          </p>
          <p className="text-xs text-green-700 mt-1">
            Parrainez plus d'amis pour augmenter votre bonus (maximum 25%).
          </p>
        </div>
      )}
    </div>
  );
};

export default UserBalanceCard;


import React from 'react';
import { DollarSign } from 'lucide-react';

interface UserBalanceCardProps {
  displayBalance: number;
  subscription: string;
  dailyLimit: number;
  sessionsDisplay: string;
  referralCount: number;
}

const UserBalanceCard: React.FC<UserBalanceCardProps> = ({
  displayBalance,
  subscription,
  dailyLimit,
  sessionsDisplay,
  referralCount,
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
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Filleuls actifs :</span> {referralCount}
          {referralCount > 0 && <span className="ml-1 text-green-600">(+{Math.min(referralCount * 5, 25)}% de bonus)</span>}
        </p>
      </div>
    </div>
  );
};

export default UserBalanceCard;

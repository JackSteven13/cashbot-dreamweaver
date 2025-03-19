
import React from 'react';
import { Loader2 } from 'lucide-react';

interface SubscriptionStatusIndicatorProps {
  isLoading: boolean;
  currentSubscription: string | null;
}

const SubscriptionStatusIndicator: React.FC<SubscriptionStatusIndicatorProps> = ({
  isLoading,
  currentSubscription
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center mt-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }
  
  if (currentSubscription && currentSubscription !== 'freemium') {
    return (
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/50 to-blue-800/50 rounded-lg shadow-inner">
        <p className="text-[#a0e4ff] font-semibold">
          Votre abonnement actuel: <span className="text-white font-bold">
            {currentSubscription.charAt(0).toUpperCase() + currentSubscription.slice(1)}
          </span>
        </p>
      </div>
    );
  }
  
  return null;
};

export default SubscriptionStatusIndicator;

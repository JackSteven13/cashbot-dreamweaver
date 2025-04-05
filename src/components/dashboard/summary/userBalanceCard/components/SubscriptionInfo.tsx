
import React from 'react';
import { Award } from 'lucide-react';

interface SubscriptionInfoProps {
  subscription: string;
  sessionsDisplay: string;
}

const SubscriptionInfo: React.FC<SubscriptionInfoProps> = ({ 
  subscription,
  sessionsDisplay
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 mt-5">
      <div className="bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border border-white/5 hover:border-[#9b87f5]/30 transition-all duration-300 group">
        <div className="text-xs text-white/70 mb-1">Abonnement</div>
        <div className="font-medium capitalize flex items-center">
          {subscription}
          {subscription !== 'freemium' && (
            <span className="ml-2">
              <Award size={14} className="text-[#9b87f5] group-hover:animate-pulse" />
            </span>
          )}
        </div>
      </div>
      
      <div className="bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border border-white/5 hover:border-[#9b87f5]/30 transition-all duration-300">
        <div className="text-xs text-white/70 mb-1">Sessions</div>
        <div className="font-medium">{sessionsDisplay}</div>
      </div>
    </div>
  );
};

export default SubscriptionInfo;

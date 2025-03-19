
import React from 'react';
import EarningsCard from './EarningsCard';
import LocationFeed from '@/components/LocationFeed';
import { SystemTerminal } from '@/components/dashboard/terminal';

interface SideContentProps {
  balance: number;
  isNewUser: boolean;
  referralCount: number;
  referralBonus: number;
  dailyLimit: number;
}

const SideContent = ({ 
  balance, 
  isNewUser, 
  referralCount, 
  referralBonus,
  dailyLimit
}: SideContentProps) => {
  // Calculate remaining sessions based on user type
  const remainingSessions = isNewUser ? 1 : 'illimitées';

  return (
    <>
      <SystemTerminal
        isNewUser={isNewUser}
        dailyLimit={dailyLimit}
        subscription={isNewUser ? 'freemium' : 'pro'}
        remainingSessions={remainingSessions}
        referralCount={referralCount}
        displayBalance={balance}
        referralBonus={referralBonus}
      />
      <EarningsCard 
        balance={balance} 
        isNewUser={isNewUser} 
        referralBonus={referralBonus} 
      />
      <LocationFeed />
    </>
  );
};

export default SideContent;

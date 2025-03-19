
import React from 'react';
import EarningsCard from './EarningsCard';
import LocationFeed from '@/components/LocationFeed';

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
  return (
    <>
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

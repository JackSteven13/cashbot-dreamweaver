
import React from 'react';
import EarningsCard from './EarningsCard';
import LocationFeed from '@/components/LocationFeed';

interface SideContentProps {
  balance: number;
  isNewUser: boolean;
  referralBonus: number;
}

const SideContent = ({ balance, isNewUser, referralBonus }: SideContentProps) => {
  return (
    <>
      <EarningsCard 
        balance={balance} 
        isNewUser={isNewUser} 
        referralBonus={referralBonus} 
      />
      <div className="mt-4">
        <LocationFeed />
      </div>
    </>
  );
};

export default SideContent;


import React from 'react';
import RevenueCalculator from '@/components/dashboard/RevenueCalculator';

interface RevenueTabProps {
  currentSubscription: string;
  isNewUser: boolean;
}

const RevenueTab: React.FC<RevenueTabProps> = ({ 
  currentSubscription,
  isNewUser
}) => {
  return (
    <div className="animate-fade-in">
      <RevenueCalculator 
        currentSubscription={currentSubscription} 
        isNewUser={isNewUser}
      />
    </div>
  );
};

export default RevenueTab;

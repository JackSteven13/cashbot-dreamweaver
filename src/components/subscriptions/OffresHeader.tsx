
import React from 'react';
import SubscriptionStatusIndicator from './SubscriptionStatusIndicator';

interface OffresHeaderProps {
  isLoading: boolean;
  currentSubscription: string;
}

const OffresHeader: React.FC<OffresHeaderProps> = ({ isLoading, currentSubscription }) => {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold text-[#f0f4f8] mb-4">
        Nos offres d'abonnement
      </h1>
      <p className="text-xl text-[#a0b3c6] max-w-3xl mx-auto">
        Choisissez l'offre qui vous convient et maximisez vos gains passifs
      </p>
      
      <SubscriptionStatusIndicator 
        isLoading={isLoading}
        currentSubscription={currentSubscription}
      />
    </div>
  );
};

export default OffresHeader;

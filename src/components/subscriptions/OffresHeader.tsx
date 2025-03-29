
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SubscriptionStatusIndicator from '@/components/subscriptions/SubscriptionStatusIndicator';
import SubscriptionSynchronizer from './SubscriptionSynchronizer';

interface OffresHeaderProps {
  isLoading: boolean;
  currentSubscription: string | null;
}

const OffresHeader: React.FC<OffresHeaderProps> = ({ 
  isLoading, 
  currentSubscription 
}) => {
  const navigate = useNavigate();
  const [syncedSubscription, setSyncedSubscription] = useState<string | null>(currentSubscription);

  useEffect(() => {
    if (currentSubscription !== syncedSubscription && currentSubscription !== null) {
      setSyncedSubscription(currentSubscription);
    }
  }, [currentSubscription]);

  const handleSync = (subscription: string) => {
    console.log("Synchronisation reçue:", subscription);
    setSyncedSubscription(subscription);
  };

  return (
    <div className="space-y-8 mb-12">
      {/* Synchroniseur invisible pour assurer des données à jour */}
      <SubscriptionSynchronizer onSync={handleSync} forceCheck={true} />
      
      <div className="space-y-6 max-w-2xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          Nos offres premium
        </h1>
        <p className="text-base md:text-lg text-blue-800 dark:text-blue-200 max-w-2xl">
          Choisissez l'offre qui correspond le mieux à vos besoins et maximisez vos revenus.
          Passez à l'offre <span className="font-bold text-purple-600 dark:text-purple-400">Élite</span> pour des gains optimaux.
        </p>
        
        <div className="flex justify-center gap-4 mt-6">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm md:text-base"
          >
            Retour au Dashboard <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <SubscriptionStatusIndicator 
        isLoading={isLoading} 
        currentSubscription={syncedSubscription} 
      />
    </div>
  );
};

export default OffresHeader;

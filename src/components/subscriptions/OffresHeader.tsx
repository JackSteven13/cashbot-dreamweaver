
import React from 'react';
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
  const [syncedSubscription, setSyncedSubscription] = React.useState<string | null>(currentSubscription);

  React.useEffect(() => {
    if (currentSubscription !== syncedSubscription) {
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
      <SubscriptionSynchronizer onSync={handleSync} />
      
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white">
          Nos offres
        </h1>
        <p className="text-lg text-blue-100 max-w-2xl">
          Choisissez l'offre qui correspond le mieux à vos besoins et maximisez vos revenus.
        </p>
        
        <div className="flex flex-wrap gap-4 mt-4">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
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


import React from 'react';
import { Sparkles } from 'lucide-react';

interface OffresHeaderProps {
  isLoading: boolean;
  currentSubscription: string;
}

const OffresHeader: React.FC<OffresHeaderProps> = ({ isLoading, currentSubscription }) => {
  // Fonction pour obtenir le nom d'affichage de l'abonnement
  const getSubscriptionDisplayName = (subscription: string): string => {
    switch (subscription) {
      case 'freemium':
        return 'Freemium';
      case 'starter':
        return 'Starter';
      case 'gold':
        return 'Gold';
      case 'elite':
        return 'Élite';
      default:
        return 'Freemium';
    }
  };
  
  return (
    <div className="mb-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-white">
        Nos offres d'abonnement
      </h1>
      <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6">
        Choisissez l'offre qui vous correspond le mieux
      </p>
      
      {!isLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 md:p-6 border border-blue-100 dark:border-blue-800">
          <p className="text-base md:text-lg text-gray-700 dark:text-gray-200">
            Votre abonnement actuel: {' '}
            <span className="font-semibold">
              {currentSubscription === 'elite' ? (
                <span className="inline-flex items-center">
                  {getSubscriptionDisplayName(currentSubscription)}
                  <Sparkles className="ml-1 h-4 w-4 text-purple-500" />
                </span>
              ) : (
                getSubscriptionDisplayName(currentSubscription)
              )}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default OffresHeader;

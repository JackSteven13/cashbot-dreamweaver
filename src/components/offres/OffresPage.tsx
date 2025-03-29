
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OffresHeader from '@/components/subscriptions/OffresHeader';
import SubscriptionPlansList from '@/components/subscriptions/SubscriptionPlansList';
import { useSubscription } from '@/hooks/offres/useSubscription';

const OffresPage: React.FC = () => {
  const { currentSubscription, isLoading } = useSubscription();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-24">
        <OffresHeader 
          isLoading={isLoading} 
          currentSubscription={currentSubscription} 
        />
        
        <SubscriptionPlansList 
          currentSubscription={currentSubscription} 
        />
      </main>
      
      <Footer />
    </div>
  );
};

export default OffresPage;

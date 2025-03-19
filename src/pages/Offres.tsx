
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OffresHeader from '@/components/subscriptions/OffresHeader';
import SubscriptionPlansList from '@/components/subscriptions/SubscriptionPlansList';

const Offres = () => {
  const [currentSubscription, setCurrentSubscription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        setIsLoading(true);
        
        // Vérifier si l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Essayer d'abord de récupérer l'abonnement à partir de Supabase
          try {
            // Utiliser la fonction RPC pour obtenir l'abonnement actuel (typage correct)
            const { data, error } = await supabase
              .rpc('get_current_subscription', { 
                user_id: session.user.id 
              }) as { data: string | null, error: any };
              
            if (!error && data) {
              console.log("Abonnement récupéré via RPC:", data);
              // Mettre à jour l'état local et localStorage
              setCurrentSubscription(data);
              localStorage.setItem('subscription', data);
            } else {
              // En cas d'erreur, tenter une requête directe
              console.log("Erreur RPC, tentative de récupération directe:", error);
              const { data: directData, error: directError } = await supabase
                .from('user_balances')
                .select('subscription')
                .eq('id', session.user.id)
                .single();
                
              if (!directError && directData) {
                console.log("Abonnement récupéré directement:", directData.subscription);
                setCurrentSubscription(directData.subscription);
                localStorage.setItem('subscription', directData.subscription);
              } else {
                // Fallback sur localStorage
                const localSub = localStorage.getItem('subscription') || 'freemium';
                console.log("Utilisation de l'abonnement du localStorage:", localSub);
                setCurrentSubscription(localSub);
              }
            }
          } catch (error) {
            console.error("Erreur lors de la vérification de l'abonnement:", error);
            // Fallback sur localStorage
            const localSub = localStorage.getItem('subscription') || 'freemium';
            setCurrentSubscription(localSub);
          }
        } else {
          // Si pas de session, utiliser 'freemium'
          setCurrentSubscription('freemium');
        }
      } catch (error) {
        console.error("Erreur globale:", error);
        setCurrentSubscription('freemium');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSubscription();
  }, []);
  
  return (
    <div className="cyberpunk-bg min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
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

export default Offres;

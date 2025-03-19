
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { PlanType } from '@/hooks/payment/types';
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';
import SubscriptionPlanCard from '@/components/dashboard/calculator/SubscriptionPlanCard';
import Button from '@/components/Button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

type Plan = {
  id: PlanType;
  title: string;
  price: number;
  description: string;
  features: string[];
  limit: number;
  mostPopular?: boolean;
  disabled?: boolean;
  current?: boolean;
};

const Offres = () => {
  const navigate = useNavigate();
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
  
  const handleSelectPlan = (planId: PlanType) => {
    if (planId === currentSubscription) {
      toast({
        title: "Vous êtes déjà abonné à ce forfait",
        description: "Vous bénéficiez déjà des avantages de ce forfait.",
      });
      return;
    }
    
    if (planId === 'freemium') {
      // Rediriger vers le processus de paiement pour freemium (gratuit)
      navigate('/payment', { state: { plan: 'freemium' } });
    } else {
      // Rediriger vers le processus de paiement pour le plan sélectionné
      navigate('/payment', { state: { plan: planId } });
    }
  };
  
  // Définir les plans avec les détails et caractéristiques
  const plans: Plan[] = [
    {
      id: 'freemium',
      title: 'Freemium',
      price: 0,
      description: 'Pour débuter et explorer la plateforme',
      features: [
        'Limite de gains de 0,5€ par jour',
        '1 session manuelle par jour',
        '1 session automatique par jour',
        'Support par email'
      ],
      limit: SUBSCRIPTION_LIMITS['freemium'],
      current: currentSubscription === 'freemium',
      disabled: currentSubscription === 'freemium'
    },
    {
      id: 'pro',
      title: 'Pro',
      price: 19.99,
      description: 'Pour les utilisateurs sérieux',
      features: [
        'Limite de gains de 5€ par jour',
        'Sessions manuelles illimitées',
        'Sessions automatiques illimitées',
        'Support prioritaire',
        'Accès aux fonctionnalités avancées'
      ],
      limit: SUBSCRIPTION_LIMITS['pro'],
      mostPopular: true,
      current: currentSubscription === 'pro',
      disabled: currentSubscription === 'pro'
    },
    {
      id: 'visionnaire',
      title: 'Visionnaire',
      price: 49.99,
      description: 'Pour maximiser vos gains',
      features: [
        'Limite de gains de 20€ par jour',
        'Sessions manuelles et automatiques illimitées',
        'Support prioritaire 24/7',
        'Accès à toutes les fonctionnalités',
        'Commissions de parrainage augmentées'
      ],
      limit: SUBSCRIPTION_LIMITS['visionnaire'],
      current: currentSubscription === 'visionnaire',
      disabled: currentSubscription === 'visionnaire'
    },
    {
      id: 'alpha',
      title: 'Alpha',
      price: 99.99,
      description: 'Pour les professionnels et entreprises',
      features: [
        'Limite de gains de 50€ par jour',
        'Accès illimité à toutes les fonctionnalités',
        'Support dédié 24/7',
        'Commissions de parrainage maximales',
        'Fonctionnalités exclusives en avant-première'
      ],
      limit: SUBSCRIPTION_LIMITS['alpha'],
      current: currentSubscription === 'alpha',
      disabled: currentSubscription === 'alpha'
    }
  ];

  return (
    <div className="cyberpunk-bg min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#f0f4f8] mb-4">
            Nos offres d'abonnement
          </h1>
          <p className="text-xl text-[#a0b3c6] max-w-3xl mx-auto">
            Choisissez l'offre qui vous convient et maximisez vos gains passifs
          </p>
          
          {isLoading ? (
            <div className="flex justify-center mt-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : currentSubscription && currentSubscription !== 'freemium' ? (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/50 to-blue-800/50 rounded-lg shadow-inner">
              <p className="text-[#a0e4ff] font-semibold">
                Votre abonnement actuel: <span className="text-white font-bold">{currentSubscription.charAt(0).toUpperCase() + currentSubscription.slice(1)}</span>
              </p>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <SubscriptionPlanCard
              key={plan.id}
              title={plan.title}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              limit={plan.limit}
              current={plan.current}
              mostPopular={plan.mostPopular}
              action={
                <Button
                  variant="dark"
                  className={`w-full ${plan.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={plan.disabled}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {plan.current ? 'Abonnement actuel' : 'Sélectionner'}
                </Button>
              }
            />
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Offres;

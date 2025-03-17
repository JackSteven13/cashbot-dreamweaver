
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Types des plans d'abonnement
type PlanType = 'freemium' | 'pro' | 'visionnaire' | 'alpha';

// Structure d'un plan
interface Plan {
  id: PlanType;
  name: string;
  price: number;
  description: string;
  features: string[];
  recommended: boolean;
  callToAction: string;
}

// Liste des plans disponibles
const plans: Plan[] = [
  {
    id: 'freemium',
    name: 'Freemium',
    price: 0,
    description: 'Parfait pour découvrir la plateforme',
    features: [
      'Accès à la plateforme de base',
      '1 session automatique par jour',
      'Gains limités à 50€ par mois',
      'Support par email'
    ],
    recommended: false,
    callToAction: 'Commencer gratuitement'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    description: 'Pour les utilisateurs sérieux',
    features: [
      'Tout ce qui est inclus dans Freemium',
      '5 sessions automatiques par jour',
      'Gains jusqu\'à 250€ par mois',
      'Support prioritaire',
      'Accès aux analyses avancées'
    ],
    recommended: true,
    callToAction: 'Choisir Pro'
  },
  {
    id: 'visionnaire',
    name: 'Visionnaire',
    price: 49.99,
    description: 'Pour ceux qui veulent maximiser leurs gains',
    features: [
      'Tout ce qui est inclus dans Pro',
      'Sessions illimitées',
      'Gains jusqu\'à 1000€ par mois',
      'Support dédié 7j/7',
      'Algorithmes optimisés pour votre profil',
      'Priorité sur les nouvelles fonctionnalités'
    ],
    recommended: false,
    callToAction: 'Choisir Visionnaire'
  },
  {
    id: 'alpha',
    name: 'Alpha',
    price: 99.99,
    description: 'Notre offre premium sans limites',
    features: [
      'Tout ce qui est inclus dans Visionnaire',
      'Gains illimités',
      'Accès à toutes les opportunités',
      'Support VIP 24/7',
      'Conseiller personnel dédié',
      'Accès anticipé aux innovations',
      'Frais de retrait réduits'
    ],
    recommended: false,
    callToAction: 'Choisir Alpha'
  }
];

const Offres = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      
      if (session) {
        // Si l'utilisateur est connecté, récupérer son plan actuel
        const { data, error } = await supabase
          .from('user_balances')
          .select('subscription')
          .eq('id', session.user.id)
          .single();
          
        if (!error && data) {
          setCurrentPlan(data.subscription as PlanType);
        }
      }
    };
    
    checkAuth();
  }, []);

  const handleSubscribe = (plan: PlanType) => {
    if (!isLoggedIn) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour souscrire à un abonnement.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    // Si l'utilisateur est déjà sur ce plan
    if (currentPlan === plan) {
      toast({
        title: "Déjà abonné",
        description: `Vous êtes déjà abonné au plan ${plan}.`,
      });
      return;
    }
    
    // Rediriger vers la page de paiement avec le plan sélectionné
    navigate('/payment', { state: { plan } });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Nos offres</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choisissez l'offre qui correspond le mieux à vos objectifs financiers et commencez à générer des revenus passifs dès aujourd'hui.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`rounded-lg overflow-hidden border ${
                  plan.recommended 
                    ? 'border-blue-500 dark:border-blue-400 shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700'
                } transition-all hover:shadow-md bg-white dark:bg-gray-800`}
              >
                {plan.recommended && (
                  <div className="bg-blue-500 dark:bg-blue-600 text-white text-center py-2 text-sm font-medium">
                    Recommandé
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price}€</span>
                    <span className="text-gray-500 dark:text-gray-400">/mois</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">{plan.description}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${
                      plan.recommended 
                        ? 'bg-blue-500 hover:bg-blue-600' 
                        : ''
                    }`}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={currentPlan === plan.id}
                  >
                    {currentPlan === plan.id ? 'Abonnement actif' : plan.callToAction}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Besoin d'une solution sur mesure ?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Contactez-nous pour discuter de vos besoins spécifiques et découvrir comment nous pouvons vous aider à atteindre vos objectifs financiers.
            </p>
            <Button variant="outline" size="lg">
              Nous contacter
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Offres;

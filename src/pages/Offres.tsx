
import React, { useState, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/Button';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import Footer from '@/components/Footer';

const OFFRES = {
  'freemium': { 'prix': 0, 'sessions': 1, 'gain_max': 0.5, 'avantages': ['Tableau de bord basique'] },
  'pro': { 'prix': 19.99, 'sessions': 'illimitées', 'gain_max': 5, 'avantages': ['Analyses premium', 'Support prioritaire'] },
  'visionnaire': { 'prix': 49.99, 'sessions': 'illimitées', 'gain_max': 20, 'avantages': ['Classement VIP', 'Pubs premium'] },
  'alpha': { 'prix': 99.99, 'sessions': 'illimitées', 'gain_max': 50, 'avantages': ['Coaching IA', 'Pubs ultra-premium'] }
};

const Offres = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<string>('freemium');
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  
  // Fonction améliorée pour récupérer l'abonnement actuel depuis Supabase
  const fetchCurrentSubscription = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("Pas de session utilisateur, utilisation localStorage");
        const localSubscription = localStorage.getItem('subscription') || 'freemium';
        setCurrentSubscription(localSubscription);
        setIsLoading(false);
        return localSubscription;
      }
      
      console.log("Session trouvée, récupération de l'abonnement directement depuis Supabase...");
      
      // Forcer le bypass du cache pour obtenir les données les plus récentes
      const { data: userBalanceData, error } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', session.user.id)
        .single();
      
      if (!error && userBalanceData) {
        console.log("Abonnement trouvé dans Supabase:", userBalanceData.subscription);
        // Mettre à jour le state et localStorage
        setCurrentSubscription(userBalanceData.subscription);
        localStorage.setItem('subscription', userBalanceData.subscription);
        setIsLoading(false);
        return userBalanceData.subscription;
      } else {
        console.error("Erreur récupération abonnement:", error);
        
        // Si erreur, essayons une approche différente avec RPC pour contourner le cache
        try {
          const { data: freshData, error: rpcError } = await supabase
            .rpc('get_current_subscription', { user_id: session.user.id });
            
          if (!rpcError && freshData) {
            console.log("Abonnement récupéré via RPC:", freshData);
            setCurrentSubscription(freshData);
            localStorage.setItem('subscription', freshData);
            setIsLoading(false);
            return freshData;
          }
        } catch (rpcErr) {
          console.error("Erreur RPC:", rpcErr);
        }
        
        // Fallback sur localStorage en dernier recours
        const localSubscription = localStorage.getItem('subscription') || 'freemium';
        setCurrentSubscription(localSubscription);
        setIsLoading(false);
        return localSubscription;
      }
    } catch (err) {
      console.error('Erreur récupération abonnement:', err);
      // Fallback sur localStorage en cas d'erreur
      const localSubscription = localStorage.getItem('subscription') || 'freemium';
      setCurrentSubscription(localSubscription);
      setIsLoading(false);
      return localSubscription;
    }
  }, []);
  
  // Charger l'abonnement actuel au chargement de la page avec rafraîchissement forcé
  useEffect(() => {
    fetchCurrentSubscription(true);
    
    // Vérifier si une mise à jour de l'abonnement a été effectuée
    const forceRefreshFlag = localStorage.getItem('forceRefreshBalance');
    if (forceRefreshFlag === 'true') {
      console.log("Forçage du rafraîchissement détecté");
      localStorage.removeItem('forceRefreshBalance');
      // Double vérification après un court délai pour permettre à Supabase de se mettre à jour
      setTimeout(() => {
        fetchCurrentSubscription(true);
      }, 1000);
    }
    
    // Ajouter un intervalle pour vérifier périodiquement l'abonnement
    const checkInterval = setInterval(() => {
      fetchCurrentSubscription(true);
      setLastRefreshTime(Date.now());
    }, 5000); // Vérifier toutes les 5 secondes
    
    return () => clearInterval(checkInterval);
  }, [fetchCurrentSubscription]);

  // Vérifier si le plan est l'abonnement actuel de l'utilisateur
  const isCurrentPlan = (plan: string) => {
    return plan === currentSubscription;
  };

  const handleSubscribe = async (niveau: string) => {
    // Vérifier à nouveau l'abonnement actuel avant de procéder
    const refreshedSubscription = await fetchCurrentSubscription(true);
    
    if (niveau === refreshedSubscription) {
      toast({
        title: "Abonnement déjà actif",
        description: `Vous êtes déjà abonné au forfait ${niveau.charAt(0).toUpperCase() + niveau.slice(1)}.`,
      });
      return;
    }

    if (niveau === 'freemium') {
      try {
        setIsProcessing(niveau);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { error } = await supabase
            .from('user_balances')
            .update({ 
              subscription: niveau,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);
            
          if (error) {
            throw error;
          }
        }
        
        // Mettre à jour localStorage et state
        localStorage.setItem('subscription', niveau);
        setCurrentSubscription(niveau);
        
        // Forcer le rafraîchissement sur le dashboard
        localStorage.setItem('forceRefreshBalance', 'true');
        
        toast({
          title: `Abonnement ${niveau.charAt(0).toUpperCase() + niveau.slice(1)} activé !`,
          description: `Vous bénéficiez maintenant des avantages du forfait ${niveau}.`,
        });
        
        setIsProcessing(null);
        navigate('/dashboard');
      } catch (error) {
        console.error("Error updating subscription:", error);
        setIsProcessing(null);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la mise à jour de votre abonnement.",
          variant: "destructive"
        });
      }
    } else {
      navigate(`/payment?plan=${niveau}`);
    }
  };

  // Afficher les données d'abonnement pour débogage
  useEffect(() => {
    console.log("Abonnement actuel (Offres.tsx):", currentSubscription);
  }, [currentSubscription]);

  return (
    <div className="cyberpunk-bg min-h-screen flex flex-col">
      <header className="bg-[#1e3a5f] shadow-md p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-white">CashBot</h1>
          <Link to="/" className="text-blue-200 hover:underline">← Retour à l'accueil</Link>
        </div>
      </header>
      
      <main className="container mx-auto py-12 px-4 flex-grow">
        <h2 className="text-3xl font-bold text-center text-[#1e3a5f] mb-4">Nos Offres</h2>
        <p className="text-[#486581] text-center mb-6 max-w-2xl mx-auto">
          Choisissez l'abonnement qui vous convient et commencez à générer des revenus avec notre IA d'analyse publicitaire avancée.
        </p>
        
        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2d5f8a] border-r-transparent"></div>
            <p className="mt-4 text-[#486581]">Chargement de votre abonnement...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Object.entries(OFFRES).map(([key, plan]) => (
              <Card key={key} className={`cyber-card ${key === 'alpha' ? 'border-2 border-[#1e3a5f] relative overflow-hidden' : ''}`}>
                {key === 'alpha' && (
                  <div className="absolute top-0 right-0 bg-[#1e3a5f] text-white px-3 py-1 font-bold text-xs">
                    RECOMMANDÉ
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl text-[#1e3a5f]">{key.charAt(0).toUpperCase() + key.slice(1)}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-[#2d5f8a]">{plan.prix}€</span>
                    <span className="text-[#486581] opacity-70"> /mois</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-[#334e68]">
                      <Check className="mr-2 h-4 w-4 text-[#2d5f8a]" />
                      <span>{typeof plan.sessions === 'number' ? `${plan.sessions} session${plan.sessions > 1 ? 's' : ''} manuelle${plan.sessions > 1 ? 's' : ''}/jour` : `Sessions ${plan.sessions}`}</span>
                    </div>
                    <div className="flex items-center text-[#334e68]">
                      <Check className="mr-2 h-4 w-4 text-[#2d5f8a]" />
                      <span>Gain max: {plan.gain_max}€/jour</span>
                    </div>
                    {plan.avantages.map((avantage, i) => (
                      <div key={i} className="flex items-center text-[#334e68]">
                        <Check className="mr-2 h-4 w-4 text-[#2d5f8a]" />
                        <span>{avantage}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    fullWidth 
                    variant={isCurrentPlan(key) ? "secondary" : "primary"}
                    className={isCurrentPlan(key) 
                      ? "bg-[#edf2f7] hover:bg-[#edf2f7] text-[#486581] cursor-default" 
                      : "bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white"}
                    onClick={() => !isCurrentPlan(key) && handleSubscribe(key)}
                    disabled={isCurrentPlan(key) || isProcessing !== null || isLoading}
                    isLoading={isProcessing === key}
                  >
                    {isProcessing === key 
                      ? "Traitement..." 
                      : isCurrentPlan(key) 
                        ? "Abonnement actuel" 
                        : key === 'freemium' 
                          ? "Souscrire gratuitement" 
                          : "Souscrire"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Offres;

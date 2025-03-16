
import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/Button';

// Mock data from the Flask application
const OFFRES = {
  'freemium': { 'prix': 0, 'sessions': 1, 'gain_max': 0.5, 'avantages': ['Tableau de bord basique'] },
  'pro': { 'prix': 19.99, 'sessions': 'illimitées', 'gain_max': 5, 'avantages': ['Analyses premium', 'Support prioritaire'] },
  'visionnaire': { 'prix': 49.99, 'sessions': 'illimitées', 'gain_max': 20, 'avantages': ['Classement VIP', 'Pubs premium'] },
  'alpha': { 'prix': 99.99, 'sessions': 'illimitées', 'gain_max': 50, 'avantages': ['Coaching IA', 'Pubs ultra-premium'] }
};

// Helper to determine if a plan is the current user's plan
const isCurrentPlan = (plan: string) => {
  // In a real app, this would check the logged-in user's subscription
  return plan === 'freemium'; // Default for demo
};

const Offres = () => {
  const handleSubscribe = (niveau: string) => {
    // In a real app, this would call your backend API
    console.log(`Subscribing to ${niveau}`);
    // You would typically redirect to a payment page or process the subscription
    alert(`🔄 Abonnement ${niveau.charAt(0).toUpperCase() + niveau.slice(1)} activé !`);
  };

  return (
    <div className="cyberpunk-bg min-h-screen">
      <header className="bg-[#1e3a5f] shadow-md p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-white">CashBot</h1>
          <Link to="/" className="text-blue-200 hover:underline">← Retour à l'accueil</Link>
        </div>
      </header>
      
      <main className="container mx-auto py-12 px-4">
        <h2 className="text-3xl font-bold text-center text-[#1e3a5f] mb-4">Nos Offres</h2>
        <p className="text-[#486581] text-center mb-12 max-w-2xl mx-auto">
          Choisissez l'abonnement qui vous convient et commencez à générer des revenus avec notre IA de trading avancée.
        </p>
        
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
                    <span>{typeof plan.sessions === 'number' ? `${plan.sessions} sessions/jour` : `Sessions ${plan.sessions}`}</span>
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
                  disabled={isCurrentPlan(key)}
                >
                  {isCurrentPlan(key) ? "Abonnement actuel" : "Souscrire"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Offres;

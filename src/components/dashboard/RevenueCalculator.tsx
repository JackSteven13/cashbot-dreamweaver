
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel 
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';
import { Link } from 'react-router-dom';

interface RevenueCalculatorProps {
  currentSubscription: string;
  isNewUser: boolean;
  isHomePage?: boolean;
}

const subscriptionLabels: Record<string, string> = {
  'freemium': 'Freemium (Actuel)',
  'pro': 'Pro',
  'visionnaire': 'Visionnaire',
  'alpha': 'Alpha'
};

const subscriptionPrices: Record<string, number> = {
  'freemium': 0,
  'pro': 9.99,
  'visionnaire': 29.99,
  'alpha': 99.99
};

interface FormValues {
  sessionsPerDay: number;
  daysPerMonth: number;
}

const RevenueCalculator: React.FC<RevenueCalculatorProps> = ({ 
  currentSubscription, 
  isNewUser,
  isHomePage = false
}) => {
  const [selectedPlan, setSelectedPlan] = useState(currentSubscription === 'freemium' ? 'pro' : currentSubscription);
  const [calculatedRevenue, setCalculatedRevenue] = useState<Record<string, number>>({});
  const [monthlyProfit, setMonthlyProfit] = useState<Record<string, number>>({});

  const form = useForm<FormValues>({
    defaultValues: {
      sessionsPerDay: 2,
      daysPerMonth: 20
    }
  });

  const { watch, control } = form;
  const values = watch();

  useEffect(() => {
    // Calculer les revenus pour chaque abonnement
    const revenues: Record<string, number> = {};
    const profits: Record<string, number> = {};

    Object.keys(SUBSCRIPTION_LIMITS).forEach(plan => {
      const dailyLimit = SUBSCRIPTION_LIMITS[plan as keyof typeof SUBSCRIPTION_LIMITS];
      
      // Pour le mode freemium, on ne peut faire qu'une session par jour
      const effectiveSessions = plan === 'freemium' ? 1 : values.sessionsPerDay;
      
      // Pour les nouveaux utilisateurs, on montre les gains potentiels
      // On suppose qu'une session génère environ 30-50% de la limite quotidienne
      const sessionYield = dailyLimit * 0.4; // 40% de la limite quotidienne en moyenne
      const dailyRevenue = Math.min(sessionYield * effectiveSessions, dailyLimit);
      const monthlyRevenue = dailyRevenue * values.daysPerMonth;
      
      revenues[plan] = parseFloat(monthlyRevenue.toFixed(2));
      
      // Calculer le profit (revenus - coût de l'abonnement)
      profits[plan] = parseFloat((monthlyRevenue - subscriptionPrices[plan]).toFixed(2));
    });

    setCalculatedRevenue(revenues);
    setMonthlyProfit(profits);
  }, [values.sessionsPerDay, values.daysPerMonth]);

  // Adapter les styles selon l'endroit où le composant est affiché
  const cardClassName = isHomePage 
    ? "w-full bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl" 
    : "w-full mt-8 bg-white shadow-md border border-blue-100";

  const headerClassName = isHomePage
    ? "bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-b border-white/10"
    : "bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100";

  const textColorClass = isHomePage ? "text-white" : "text-[#1e3a5f]";
  const descriptionColorClass = isHomePage ? "text-blue-100" : "text-gray-500";

  return (
    <Card className={cardClassName}>
      <CardHeader className={headerClassName}>
        <CardTitle className={`text-xl font-semibold ${textColorClass}`}>
          Simulateur de Revenus
        </CardTitle>
        <CardDescription className={descriptionColorClass}>
          {isNewUser 
            ? "Découvrez votre potentiel de gains avec différents abonnements" 
            : "Comparez vos revenus potentiels selon différents abonnements"}
        </CardDescription>
      </CardHeader>
      <CardContent className={`pt-6 ${isHomePage ? 'text-white' : ''}`}>
        <Form {...form}>
          <div className="space-y-5">
            <FormField
              control={control}
              name="sessionsPerDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={isHomePage ? "text-white font-medium" : "text-[#1e3a5f] font-medium"}>
                    Sessions par jour
                  </FormLabel>
                  <FormDescription className={isHomePage ? "text-blue-200" : ""}>
                    Nombre de sessions de gain que vous souhaitez lancer quotidiennement
                  </FormDescription>
                  <div className="flex items-center space-x-4">
                    <FormControl>
                      <Slider
                        min={1}
                        max={8}
                        step={1}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                        className="flex-1"
                      />
                    </FormControl>
                    <div className={`w-12 text-center font-medium ${isHomePage ? 'text-white' : ''}`}>
                      {field.value}
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="daysPerMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={isHomePage ? "text-white font-medium" : "text-[#1e3a5f] font-medium"}>
                    Jours d'activité par mois
                  </FormLabel>
                  <FormDescription className={isHomePage ? "text-blue-200" : ""}>
                    Combien de jours par mois utiliserez-vous l'application?
                  </FormDescription>
                  <div className="flex items-center space-x-4">
                    <FormControl>
                      <Slider
                        min={1}
                        max={30}
                        step={1}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                        className="flex-1"
                      />
                    </FormControl>
                    <div className={`w-12 text-center font-medium ${isHomePage ? 'text-white' : ''}`}>
                      {field.value}
                    </div>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </Form>

        <div className="mt-8 space-y-3">
          <h3 className={`text-md font-semibold ${isHomePage ? 'text-white' : 'text-[#1e3a5f]'}`}>
            Revenus mensuels estimés
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {Object.keys(SUBSCRIPTION_LIMITS).map((plan) => {
              if (plan === 'freemium' && isHomePage) return null; // Ne pas afficher freemium sur la page d'accueil
              
              const isFreemium = plan === 'freemium';
              const isCurrent = plan === currentSubscription;
              const bgColorClass = isHomePage 
                ? selectedPlan === plan ? 'bg-blue-900/40 border-blue-500' : 'bg-blue-950/40 border-blue-800/50' 
                : selectedPlan === plan ? 'border-blue-500 bg-blue-50' : 'border-gray-200';
              
              return (
                <div 
                  key={plan}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${bgColorClass}`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`font-medium ${
                        isHomePage 
                          ? (isCurrent ? 'text-blue-300' : 'text-white') 
                          : (isCurrent ? 'text-blue-700' : 'text-gray-800')
                      }`}>
                        {subscriptionLabels[plan]}
                        {isFreemium && 
                          <span className="ml-2 text-xs opacity-75">(Limité à 1 session/jour)</span>
                        }
                      </span>
                      <div className={`text-xs ${isHomePage ? 'text-blue-300' : 'text-gray-500'} mt-1`}>
                        {subscriptionPrices[plan] > 0 
                          ? `${subscriptionPrices[plan].toFixed(2)}€/mois` 
                          : 'Gratuit'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${isHomePage ? 'text-green-400' : 'text-green-600'}`}>
                        {calculatedRevenue[plan]?.toFixed(2)}€
                      </div>
                      <div className={`text-xs ${isHomePage ? 'text-blue-300' : 'text-gray-500'}`}>
                        Profit: <span className={
                          monthlyProfit[plan] > 0 
                            ? (isHomePage ? 'text-green-400' : 'text-green-600') 
                            : 'text-red-500'
                        }>
                          {monthlyProfit[plan]?.toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter className={isHomePage ? "bg-blue-950/50 border-t border-white/10 pt-4" : "bg-gray-50 border-t pt-4"}>
        <div className="w-full flex justify-center md:justify-end space-x-2">
          <Link to="/register">
            <Button 
              variant="default"
              className={
                isHomePage 
                  ? "bg-green-500 hover:bg-green-600 text-white w-full md:w-auto" 
                  : "bg-green-600 hover:bg-green-700 text-white"
              }
            >
              {isHomePage 
                ? "Démarrer et gagner avec CashBot" 
                : `Passer à l'offre ${subscriptionLabels[selectedPlan]}`
              }
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RevenueCalculator;

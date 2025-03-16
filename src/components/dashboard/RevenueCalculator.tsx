
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

interface RevenueCalculatorProps {
  currentSubscription: string;
  isNewUser: boolean;
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
  isNewUser 
}) => {
  const [selectedPlan, setSelectedPlan] = useState(currentSubscription);
  const [calculatedRevenue, setCalculatedRevenue] = useState<Record<string, number>>({});
  const [monthlyProfit, setMonthlyProfit] = useState<Record<string, number>>({});

  const form = useForm<FormValues>({
    defaultValues: {
      sessionsPerDay: 1,
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

  return (
    <Card className="w-full mt-8 bg-white shadow-md border border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100">
        <CardTitle className="text-xl font-semibold text-[#1e3a5f]">
          Simulateur de Revenus
        </CardTitle>
        <CardDescription>
          {isNewUser 
            ? "Découvrez votre potentiel de gains avec différents abonnements" 
            : "Comparez vos revenus potentiels selon différents abonnements"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <div className="space-y-5">
            <FormField
              control={control}
              name="sessionsPerDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#1e3a5f] font-medium">
                    Sessions par jour
                  </FormLabel>
                  <FormDescription>
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
                    <div className="w-12 text-center font-medium">
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
                  <FormLabel className="text-[#1e3a5f] font-medium">
                    Jours d'activité par mois
                  </FormLabel>
                  <FormDescription>
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
                    <div className="w-12 text-center font-medium">
                      {field.value}
                    </div>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </Form>

        <div className="mt-8 space-y-3">
          <h3 className="text-md font-semibold text-[#1e3a5f]">Revenus mensuels estimés</h3>
          <div className="grid grid-cols-1 gap-3">
            {Object.keys(SUBSCRIPTION_LIMITS).map((plan) => {
              const isFreemium = plan === 'freemium';
              const isCurrent = plan === currentSubscription;
              
              return (
                <div 
                  key={plan}
                  className={`p-4 rounded-lg border-2 ${
                    selectedPlan === plan 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`font-medium ${isCurrent ? 'text-blue-700' : 'text-gray-800'}`}>
                        {subscriptionLabels[plan]}
                        {isFreemium && 
                          <span className="ml-2 text-xs opacity-75">(Limité à 1 session/jour)</span>
                        }
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {subscriptionPrices[plan] > 0 
                          ? `${subscriptionPrices[plan].toFixed(2)}€/mois` 
                          : 'Gratuit'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {calculatedRevenue[plan]?.toFixed(2)}€
                      </div>
                      <div className="text-xs text-gray-500">
                        Profit: <span className={monthlyProfit[plan] > 0 ? 'text-green-600' : 'text-red-500'}>
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
      <CardFooter className="bg-gray-50 border-t pt-4 flex justify-end space-x-2">
        {selectedPlan !== currentSubscription && (
          <Button 
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => window.location.href = '/offres'}
          >
            Passer à l'offre {subscriptionLabels[selectedPlan]}
          </Button>
        )}
        {selectedPlan === currentSubscription && (
          <Button variant="outline">
            {currentSubscription === 'freemium' ? 'Découvrir les offres' : 'Votre abonnement actuel'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default RevenueCalculator;

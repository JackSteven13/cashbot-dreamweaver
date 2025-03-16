
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';
import { SUBSCRIPTION_LABELS, SUBSCRIPTION_PRICES } from './calculator/constants';
import { calculateRevenueForAllPlans } from './calculator/utils';

// Import des composants refactorisés
import CalculatorControls from './calculator/CalculatorControls';
import SubscriptionPlanCard from './calculator/SubscriptionPlanCard';
import CalculatorFooter from './calculator/CalculatorFooter';

interface RevenueCalculatorProps {
  currentSubscription: string;
  isNewUser: boolean;
  isHomePage?: boolean;
}

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
  const [calculatedResults, setCalculatedResults] = useState<Record<string, { revenue: number, profit: number }>>({});

  const form = useForm<FormValues>({
    defaultValues: {
      sessionsPerDay: 2,
      daysPerMonth: 20
    }
  });

  const { watch, control } = form;
  const values = watch();

  useEffect(() => {
    // Calcul des revenus pour tous les abonnements
    const results = calculateRevenueForAllPlans(values.sessionsPerDay, values.daysPerMonth);
    setCalculatedResults(results);
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
          {/* Contrôles du simulateur */}
          <CalculatorControls control={control} isHomePage={isHomePage} />
        </Form>

        <div className="mt-8 space-y-3">
          <h3 className={`text-md font-semibold ${isHomePage ? 'text-white' : 'text-[#1e3a5f]'}`}>
            Revenus mensuels estimés
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {Object.keys(SUBSCRIPTION_LIMITS).map((plan) => {
              // Ne pas afficher freemium sur la page d'accueil
              if (plan === 'freemium' && isHomePage) return null;
              
              const isFreemium = plan === 'freemium';
              const isCurrent = plan === currentSubscription;
              const results = calculatedResults[plan] || { revenue: 0, profit: 0 };
              
              return (
                <SubscriptionPlanCard
                  key={plan}
                  plan={plan}
                  isSelected={selectedPlan === plan}
                  isHomePage={isHomePage}
                  isCurrent={isCurrent}
                  isFreemium={isFreemium}
                  subscriptionLabel={SUBSCRIPTION_LABELS[plan]}
                  subscriptionPrice={SUBSCRIPTION_PRICES[plan]}
                  revenue={results.revenue}
                  profit={results.profit}
                  onClick={() => setSelectedPlan(plan)}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter className={isHomePage ? "bg-blue-950/50 border-t border-white/10 pt-4" : "bg-gray-50 border-t pt-4"}>
        <CalculatorFooter 
          isHomePage={isHomePage} 
          selectedPlan={selectedPlan}
          subscriptionLabels={SUBSCRIPTION_LABELS}
        />
      </CardFooter>
    </Card>
  );
};

export default RevenueCalculator;

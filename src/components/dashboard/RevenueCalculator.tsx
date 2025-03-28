
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
import { useIsMobile } from '@/hooks/use-mobile';

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

// Sample features for each plan
const SUBSCRIPTION_FEATURES: Record<string, string[]> = {
  'freemium': [
    'Limite de gains de 0,5€ par jour',
    '1 session manuelle par jour',
    '1 session automatique par jour',
    'Support par email'
  ],
  'pro': [
    'Limite de gains de 5€ par jour',
    'Sessions manuelles illimitées',
    'Sessions automatiques illimitées',
    'Support prioritaire'
  ],
  'visionnaire': [
    'Limite de gains de 20€ par jour',
    'Sessions manuelles et automatiques illimitées',
    'Support prioritaire 24/7',
    'Accès à toutes les fonctionnalités'
  ],
  'alpha': [
    'Limite de gains de 50€ par jour',
    'Accès illimité à toutes les fonctionnalités',
    'Support dédié 24/7',
    'Fonctionnalités exclusives'
  ]
};

// Sample descriptions for each plan
const SUBSCRIPTION_DESCRIPTIONS: Record<string, string> = {
  'freemium': 'Pour débuter et explorer la plateforme',
  'pro': 'Pour les utilisateurs sérieux',
  'visionnaire': 'Pour maximiser vos gains',
  'alpha': 'Pour les professionnels et entreprises'
};

const RevenueCalculator: React.FC<RevenueCalculatorProps> = ({ 
  currentSubscription, 
  isNewUser,
  isHomePage = false
}) => {
  const [selectedPlan, setSelectedPlan] = useState('alpha');
  const [calculatedResults, setCalculatedResults] = useState<Record<string, { revenue: number, profit: number }>>({});
  const isMobile = useIsMobile();

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

  // Adapter les styles selon l'endroit où le composant est affiché et le mode sombre
  const cardClassName = isHomePage 
    ? "w-full bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl dark:bg-gray-900/30 dark:border-gray-800/50" 
    : "w-full mt-6 md:mt-8 bg-white shadow-md border border-blue-100 dark:bg-gray-800 dark:border-gray-700";

  const headerClassName = isHomePage
    ? "bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-b border-white/10 dark:from-blue-950/70 dark:to-indigo-950/70 dark:border-gray-800"
    : "bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100 dark:from-blue-900/30 dark:to-indigo-900/30 dark:border-gray-700";

  const textColorClass = isHomePage ? "text-white dark:text-white" : "text-[#1e3a5f] dark:text-white";
  const descriptionColorClass = isHomePage ? "text-blue-100 dark:text-blue-200" : "text-gray-500 dark:text-gray-300";

  return (
    <Card className={cardClassName}>
      <CardHeader className={`py-3 px-4 md:p-6 ${headerClassName}`}>
        <CardTitle className={`text-lg md:text-xl font-semibold ${textColorClass}`}>
          Simulateur de Revenus
        </CardTitle>
        <CardDescription className={`text-xs md:text-sm ${descriptionColorClass}`}>
          {isNewUser 
            ? "Découvrez votre potentiel de gains avec différents abonnements" 
            : "Comparez vos revenus potentiels selon différents abonnements"}
        </CardDescription>
      </CardHeader>
      <CardContent className={`pt-3 px-3 md:pt-4 md:px-6 ${isHomePage ? 'text-white dark:text-white' : 'dark:text-gray-100'}`}>
        <Form {...form}>
          {/* Contrôles du simulateur */}
          <CalculatorControls control={control} isHomePage={isHomePage} />
        </Form>

        <div className="mt-4 md:mt-6 space-y-2 md:space-y-3">
          <h3 className={`text-sm md:text-md font-semibold ${isHomePage ? 'text-white dark:text-white' : 'text-[#1e3a5f] dark:text-gray-100'}`}>
            Revenus mensuels estimés
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 overflow-hidden">
            {Object.keys(SUBSCRIPTION_LIMITS).map((plan) => {
              // Ne pas afficher freemium sur la page d'accueil
              if (plan === 'freemium' && isHomePage) return null;
              
              const isFreemium = plan === 'freemium';
              const isCurrent = plan === currentSubscription;
              const results = calculatedResults[plan] || { revenue: 0, profit: 0 };
              
              return (
                <div key={plan} className="max-h-[350px] md:max-h-[500px] overflow-y-auto">
                  <SubscriptionPlanCard
                    key={plan}
                    title={SUBSCRIPTION_LABELS[plan] || plan}
                    price={SUBSCRIPTION_PRICES[plan] || 0}
                    description={SUBSCRIPTION_DESCRIPTIONS[plan] || ''}
                    features={SUBSCRIPTION_FEATURES[plan] || []}
                    limit={SUBSCRIPTION_LIMITS[plan] || 0}
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
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter className={`py-3 px-4 md:p-6 ${isHomePage ? "bg-blue-950/50 border-t border-white/10 pt-4 dark:bg-gray-900/70 dark:border-gray-800" : "bg-gray-50 border-t pt-4 dark:bg-gray-800 dark:border-gray-700"}`}>
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

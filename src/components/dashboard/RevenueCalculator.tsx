
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRevenueCalculator } from './calculator/hooks/useRevenueCalculator';
import { SUBSCRIPTION_LABELS } from './calculator/constants';
import MobileTabs from './calculator/components/MobileTabs';
import CalculatorBody from './calculator/components/CalculatorBody';
import CalculatorFooter from './calculator/CalculatorFooter';
import { FormProvider } from 'react-hook-form';

interface RevenueCalculatorProps {
  currentSubscription: string;
  isNewUser: boolean;
  isHomePage?: boolean;
}

const RevenueCalculator: React.FC<RevenueCalculatorProps> = ({ 
  currentSubscription, 
  isNewUser,
  isHomePage = false
}) => {
  const isMobile = useIsMobile();
  const { 
    selectedPlan, 
    setSelectedPlan, 
    calculatedResults, 
    activeTab, 
    setActiveTab, 
    form, 
    control 
  } = useRevenueCalculator();

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
        
        {/* Ajouter des onglets de navigation pour mobile */}
        {isMobile && (
          <MobileTabs 
            activeTab={activeTab} 
            onTabChange={(tab) => setActiveTab(tab)} 
          />
        )}
      </CardHeader>
      <CardContent className={`pt-3 px-3 md:pt-4 md:px-6 ${isHomePage ? 'text-white dark:text-white' : 'dark:text-gray-100'}`}>
        <FormProvider {...form.methods}>
          <CalculatorBody 
            control={control}
            isHomePage={isHomePage}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobile={isMobile}
            selectedPlan={selectedPlan}
            currentSubscription={currentSubscription}
            calculatedResults={calculatedResults}
            onSelectPlan={setSelectedPlan}
          />
        </FormProvider>
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

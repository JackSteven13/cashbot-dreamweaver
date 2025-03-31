
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';
import { SUBSCRIPTION_PRICES } from './constants';

/**
 * Calculate revenue for all subscription plans based on user inputs
 * Using a more realistic approach with reduced projections
 */
export const calculateRevenueForAllPlans = (
  sessionsPerDay: number,
  daysPerMonth: number
): Record<string, { revenue: number, profit: number }> => {
  const results: Record<string, { revenue: number, profit: number }> = {};
  
  // Base efficacité pour chaque plan (réduit pour être plus réaliste)
  const efficiencyFactors = {
    'freemium': 0.15, // Très limité
    'starter': 0.35,  // Limité mais viable
    'gold': 0.55,     // Bon rendement
    'elite': 0.70     // Meilleur rendement
  };
  
  // Variation aléatoire mineure (±1%) pour éviter des nombres trop ronds
  const getRandomVariation = () => 1 + ((Math.random() * 2) - 1) / 100;
  
  Object.entries(SUBSCRIPTION_LIMITS).forEach(([plan, dailyLimit]) => {
    try {
      // Limiter les sessions pour le mode freemium
      const effectiveSessions = plan === 'freemium' ? Math.min(1, sessionsPerDay) : sessionsPerDay;
      
      // Efficacité de base pour ce plan
      const planEfficiency = efficiencyFactors[plan as keyof typeof efficiencyFactors] || 0.3;
      
      // Calculer le revenu quotidien avec augmentation progressive pour plus de sessions
      let dailyRevenue = 0;
      
      // Pour chaque session, ajouter du revenu avec un effet multiplicateur pour les sessions consécutives
      for (let i = 0; i < effectiveSessions; i++) {
        // Multiplicateur de session qui augmente légèrement pour les sessions consécutives
        // Les plans supérieurs bénéficient davantage des sessions supplémentaires
        const sessionMultiplier = 1 + (i * 0.01 * (
          plan === 'freemium' ? 0 : 
          plan === 'starter' ? 0.5 : 
          plan === 'gold' ? 0.8 : 
          1.2
        ));
        
        // Contribution de base au revenu en pourcentage de la limite quotidienne
        // Réduit pour des projections de revenus plus conservatrices
        const baseContribution = dailyLimit * (
          plan === 'freemium' ? 0.08 : 
          plan === 'starter' ? 0.07 : 
          plan === 'gold' ? 0.06 : 
          0.055
        );
        
        const sessionContribution = baseContribution * planEfficiency * sessionMultiplier;
        dailyRevenue += sessionContribution;
      }
      
      // Plafond de revenu quotidien pour garantir qu'il reste réaliste par rapport à la limite quotidienne
      // Plafonds réduits pour rendre les projections de gains plus conservatrices
      const maxDailyMultiplier = 
        plan === 'freemium' ? 0.20 :  // Très limité
        plan === 'starter' ? 0.30 :   // Limité mais meilleur
        plan === 'gold' ? 0.40 :      // Bon potentiel
        0.50;                         // Meilleur potentiel
        
      dailyRevenue = Math.min(dailyRevenue, dailyLimit * maxDailyMultiplier);
      
      // Appliquer une variation aléatoire pour éviter des résultats trop uniformes
      let monthlyRevenue = dailyRevenue * daysPerMonth * getRandomVariation();
      
      // Obtenir le prix de l'abonnement
      const subscriptionPrice = SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES] || 0;
      
      // Calculer le profit (revenu - coût de l'abonnement)
      const profit = monthlyRevenue - subscriptionPrice;
      
      // Stocker les résultats avec 2 décimales
      results[plan] = {
        revenue: parseFloat(monthlyRevenue.toFixed(2)),
        profit: parseFloat(profit.toFixed(2))
      };
    } catch (error) {
      console.error(`Error calculating for plan ${plan}:`, error);
      // Valeurs par défaut sécurisées en cas d'erreur
      results[plan] = {
        revenue: 0,
        profit: -(SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES] || 0)
      };
    }
  });
  
  return results;
};

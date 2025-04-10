
import React, { useMemo } from 'react';
import { Crown, Star, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SubscriptionLevelDisplayProps {
  subscription: string;
  referralCount?: number;
  limitPercentage?: number;
  dailyLimit?: number;
  isNewUser?: boolean;
}

const SubscriptionLevelDisplay: React.FC<SubscriptionLevelDisplayProps> = ({
  subscription,
  referralCount = 0,
  limitPercentage = 0,
  dailyLimit = 0,
  isNewUser = false
}) => {
  // Retourner les informations selon le type d'abonnement
  const { icon, title, color, benefits } = useMemo(() => {
    switch (subscription) {
      case 'elite':
        return {
          icon: <Trophy className="h-5 w-5 text-amber-400" />,
          title: 'Elite',
          color: 'text-amber-400',
          benefits: [
            'Limite quotidienne : 10€',
            'Retrait à partir de 50€',
            'Sessions illimitées',
            'Support prioritaire 24/7'
          ]
        };
      case 'gold':
      case 'pro':
        return {
          icon: <Crown className="h-5 w-5 text-amber-400" />,
          title: 'Pro',
          color: 'text-amber-400',
          benefits: [
            'Limite quotidienne : 5€',
            'Retrait à partir de 100€',
            'Sessions illimitées',
            'Support prioritaire'
          ]
        };
      case 'starter':
      case 'alpha':
        return {
          icon: <Star className="h-5 w-5 text-blue-400" />,
          title: 'Starter',
          color: 'text-blue-400',
          benefits: [
            'Limite quotidienne : 2€',
            'Retrait à partir de 150€',
            'Sessions illimitées'
          ]
        };
      default:
        return {
          icon: <Star className="h-5 w-5 text-slate-400" />,
          title: 'Freemium',
          color: 'text-slate-400',
          benefits: [
            'Limite quotidienne : 0.5€',
            'Retrait à partir de 200€',
            '1 session par jour'
          ]
        };
    }
  }, [subscription]);
  
  // Calculer l'impact des parrainages pour freemium
  const referralBonusText = useMemo(() => {
    if (subscription !== 'freemium' || referralCount <= 0) return null;
    
    // Base du texte selon le nombre de parrainages
    let baseText = `${referralCount} parrainage${referralCount > 1 ? 's' : ''} actif${referralCount > 1 ? 's' : ''}`;
    
    return {
      text: baseText,
      impact: referralCount >= 5 
        ? '+100% de gains' 
        : referralCount >= 2 
          ? '+50% de gains'
          : '+20% de gains'
    };
  }, [subscription, referralCount]);

  // Formater le montant limite avec 2 décimales et le symbole €
  const formattedDailyLimit = typeof dailyLimit === 'number' ? `${dailyLimit.toFixed(2)}€` : '0.00€';
  
  // Déterminer la couleur de la barre de progression selon le pourcentage
  const progressColor = useMemo(() => {
    if (limitPercentage >= 90) return 'bg-red-500';
    if (limitPercentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  }, [limitPercentage]);
  
  return (
    <div className="subscription-level-display">
      {/* En-tête avec icône et nom de l'abonnement */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {icon}
          <span className={`ml-2 font-medium ${color}`}>{title}</span>
        </div>
        <span className="text-xs opacity-80">Limite: {formattedDailyLimit}/jour</span>
      </div>
      
      {/* Barre de progression */}
      <div className="mb-3">
        <Progress 
          value={limitPercentage} 
          max={100}
          className={`h-2 bg-slate-700 ${progressColor}`}
        />
        <div className="flex justify-between mt-1 text-xs opacity-70">
          <span>{limitPercentage}%</span>
          <span>Limite quotidienne</span>
        </div>
      </div>
      
      {/* Bonus de parrainage pour freemium */}
      {referralBonusText && (
        <div className="text-center text-xs mt-1 p-1 bg-slate-700/50 rounded-md text-green-300">
          {referralBonusText.text} : {referralBonusText.impact}
        </div>
      )}
    </div>
  );
};

export default SubscriptionLevelDisplay;

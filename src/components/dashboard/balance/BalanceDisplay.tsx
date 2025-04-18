
import React, { useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/utils/balance/limitCalculations';
import { CardContent } from '@/components/ui/card';
import { Coins, TrendingUp, ChevronUp } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface BalanceDisplayProps {
  balance: number;
  currency?: string;
  isLoading?: boolean;
  subscription?: string;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ 
  balance, 
  currency = "EUR", 
  isLoading = false, 
  subscription = "freemium" 
}) => {
  // Use a single source of truth for the balance
  const [displayBalance, setDisplayBalance] = useState<number>(() => {
    const storedBalance = parseFloat(localStorage.getItem('lastKnownBalance') || '0');
    return storedBalance > 0 ? storedBalance : balance || 0;
  });
  
  const [prevBalance, setPrevBalance] = useState<number>(displayBalance);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const balanceRef = useRef<HTMLDivElement>(null);
  const lastUpdateTime = useRef<number>(Date.now());
  const updateDebounceTime = 2000; // 2 secondes minimum entre les mises à jour d'affichage
  
  const { formattedValue } = useAnimatedCounter({
    value: displayBalance,
    duration: 1200,
    decimals: 2,
    formatOptions: { style: 'currency', currency: 'EUR' }
  });
  
  // Synchroniser avec le balance prop, mais avec debounce pour éviter les fluctuations rapides
  useEffect(() => {
    const now = Date.now();
    // Seulement mettre à jour si assez de temps s'est écoulé depuis la dernière mise à jour
    if (now - lastUpdateTime.current > updateDebounceTime && Math.abs(balance - displayBalance) > 0.01) {
      // Utiliser une transition
      setPrevBalance(displayBalance);
      setDisplayBalance(balance);
      setIsAnimating(true);
      
      // Enregistrer les valeurs dans le localStorage
      localStorage.setItem('currentBalance', balance.toString());
      localStorage.setItem('lastKnownBalance', balance.toString());
      
      // Enregistrer le moment de la mise à jour
      lastUpdateTime.current = now;
      
      // Réinitialiser l'animation après un délai
      setTimeout(() => setIsAnimating(false), 2000);
    }
  }, [balance, displayBalance]);
  
  // Gestionnaire unifié pour les événements de mise à jour du solde
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const now = Date.now();
      // Vérifier si assez de temps s'est écoulé depuis la dernière mise à jour
      if (now - lastUpdateTime.current < updateDebounceTime) {
        return; // Ignorer les mises à jour trop rapprochées
      }
      
      const newBalance = event.detail?.newBalance || event.detail?.currentBalance;
      const gain = event.detail?.gain || event.detail?.amount;
      const shouldAnimate = event.detail?.animate === true;
      
      if (typeof newBalance === 'number' && newBalance > 0 && 
          Math.abs(newBalance - displayBalance) > 0.01) {
        
        // Mettre à jour le solde avec animation
        setPrevBalance(displayBalance);
        setDisplayBalance(newBalance);
        setIsAnimating(shouldAnimate);
        
        // Enregistrer les valeurs
        localStorage.setItem('currentBalance', newBalance.toString());
        localStorage.setItem('lastKnownBalance', newBalance.toString());
        
        // Mettre à jour le timestamp
        lastUpdateTime.current = now;
        
        // Réinitialiser l'animation après un délai
        if (shouldAnimate) {
          setTimeout(() => setIsAnimating(false), 2000);
        }
      }
    };
    
    // Écouter tous les types d'événements liés au solde
    window.addEventListener('balance:update', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:force-update', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:force-sync', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:daily-growth', handleBalanceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:force-update', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:force-sync', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:daily-growth', handleBalanceUpdate as EventListener);
    };
  }, [displayBalance]);
  
  // Sauvegarder le solde avant déchargement de la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('currentBalance', displayBalance.toString());
      localStorage.setItem('lastKnownBalance', displayBalance.toString());
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [displayBalance]);
  
  // Déterminer le style premium en fonction de l'abonnement
  const isPremium = subscription !== 'freemium';
  
  return (
    <CardContent className={`p-6 transition-all duration-300 ${isAnimating ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/30 dark:from-blue-800/40 dark:to-indigo-800/30' : ''}`}>
      <div className="flex items-center">
        <div className={`${isAnimating ? 'bg-blue-700 dark:bg-blue-600' : 'bg-blue-100 dark:bg-blue-900'} p-3 rounded-lg mr-4 transition-colors duration-300`}>
          <Coins className={`h-8 w-8 ${isAnimating ? 'text-yellow-300 animate-bounce' : 'text-blue-600 dark:text-blue-400'}`} />
        </div>
        <div className="relative">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            Solde disponible
            {isPremium && (
              <span className="ml-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-1.5 py-0.5 rounded">
                {subscription.toUpperCase()}
              </span>
            )}
          </p>
          <div 
            ref={balanceRef}
            className={`balance-display text-2xl md:text-3xl font-bold ${
              isAnimating ? 'text-green-400 dark:text-green-300' : ''
            } relative`}
          >
            {isLoading ? (
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            ) : (
              <>
                {formattedValue}
                {isAnimating && (prevBalance !== displayBalance) && (
                  <span className="absolute -top-4 right-0 text-sm text-green-500 flex items-center animate-fade-in">
                    <ChevronUp className="h-3 w-3 mr-0.5" />
                    +{(displayBalance - prevBalance).toFixed(2)}€
                  </span>
                )}
              </>
            )}
          </div>
          <div className={`text-xs flex items-center mt-1 ${isAnimating ? 'text-green-500 dark:text-green-400' : 'text-blue-500 dark:text-blue-400'}`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>{subscription === 'freemium' ? 'Limite: 0,50€/jour' : 'Robot actif'}</span>
          </div>
        </div>
      </div>
    </CardContent>
  );
};

export default BalanceDisplay;

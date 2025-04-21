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
  // Garantir que balance est toujours une valeur numérique valide
  const safeBalance = !isNaN(balance) ? balance : 0;
  
  // Use a single source of truth for the balance with fallbacks
  const [displayBalance, setDisplayBalance] = useState<number>(() => {
    // Collecter toutes les sources potentielles de solde
    const sources = [
      safeBalance,
      parseFloat(localStorage.getItem('lastKnownBalance') || '0'),
      parseFloat(localStorage.getItem('currentBalance') || '0'),
      parseFloat(localStorage.getItem('lastUpdatedBalance') || '0'),
      parseFloat(sessionStorage.getItem('currentBalance') || '0')
    ];
    
    // Filtrer les valeurs NaN et trouver le maximum
    const maxBalance = Math.max(...sources.filter(val => !isNaN(val) && val > 0));
    return maxBalance > 0 ? maxBalance : safeBalance;
  });
  
  const [prevBalance, setPrevBalance] = useState<number>(displayBalance);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [gainAmount, setGainAmount] = useState<number | null>(null);
  const balanceRef = useRef<HTMLDivElement>(null);
  const lastUpdateTime = useRef<number>(Date.now());
  const updateDebounceTime = 2000; // 2 secondes minimum entre les mises à jour d'affichage
  const lastGainTimeRef = useRef<number>(Date.now() - 60000);
  const consecutiveUpdatesRef = useRef<number>(0);
  
  const { formattedValue, setTargetValue } = useAnimatedCounter({
    value: displayBalance,
    duration: 1200,
    decimals: 2,
    formatOptions: { style: 'currency', currency: 'EUR' }
  });
  
  // Synchroniser avec la balance prop - avec validation et préservation du solde max
  useEffect(() => {
    const now = Date.now();
    const safeCurrentBalance = isNaN(displayBalance) ? 0 : displayBalance;
    
    if (!isNaN(safeBalance) && safeBalance > 0) {
      // Toujours utiliser la valeur de solde la plus élevée
      const newBalance = Math.max(safeBalance, safeCurrentBalance);
      
      // Si le nouveau solde est plus élevé, mettre à jour
      if (newBalance > safeCurrentBalance) {
        console.log(`Updating display balance from ${safeCurrentBalance} to ${newBalance}`);
        setPrevBalance(safeCurrentBalance);
        setDisplayBalance(newBalance);
        setTargetValue(newBalance); // Important pour l'animation
        setIsAnimating(true);
        setGainAmount(newBalance - safeCurrentBalance);
        
        // Persister le nouveau solde dans toutes les sources
        localStorage.setItem('currentBalance', newBalance.toString());
        localStorage.setItem('lastKnownBalance', newBalance.toString());
        localStorage.setItem('lastUpdatedBalance', newBalance.toString());
        sessionStorage.setItem('currentBalance', newBalance.toString());
        
        // Mettre à jour les compteurs de contrôle
        lastUpdateTime.current = now;
        lastGainTimeRef.current = now;
        consecutiveUpdatesRef.current += 1;
        
        // Réinitialiser l'animation après un délai
        setTimeout(() => {
          setIsAnimating(false);
          setGainAmount(null);
        }, 2000);
      } else {
        // Vérifier s'il existe des soldes stockés plus élevés que celui affiché actuellement
        const storedSources = [
          parseFloat(localStorage.getItem('lastKnownBalance') || '0'),
          parseFloat(localStorage.getItem('currentBalance') || '0'),
          parseFloat(localStorage.getItem('lastUpdatedBalance') || '0'),
          parseFloat(sessionStorage.getItem('currentBalance') || '0')
        ];
        
        const maxStoredBalance = Math.max(...storedSources.filter(val => !isNaN(val) && val > 0));
        
        // Si un solde stocké est significativement plus élevé, l'utiliser
        if (maxStoredBalance > safeCurrentBalance + 0.1) {
          console.log(`Using higher stored balance: ${maxStoredBalance}`);
          setPrevBalance(safeCurrentBalance);
          setDisplayBalance(maxStoredBalance);
          setTargetValue(maxStoredBalance);
        }
      }
    }
  }, [balance, displayBalance, safeBalance, setTargetValue]);
  
  // Gestionnaire unifié pour les événements de mise à jour du solde avec anti-spam
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      console.log("Balance display received event:", event.type, event.detail);
      
      const now = Date.now();
      
      // ANTI-SPAM: Vérifier le temps écoulé depuis la dernière mise à jour
      if (now - lastUpdateTime.current < updateDebounceTime) {
        console.log("Mise à jour trop rapide, ignorée");
        return;
      }
      
      const newBalance = event.detail?.newBalance || event.detail?.currentBalance;
      const gain = event.detail?.gain || event.detail?.amount;
      const oldBalance = event.detail?.oldBalance || displayBalance;
      const shouldAnimate = event.detail?.animate !== false;
      
      // Contrôle anti-spam pour les gains
      if (typeof gain === 'number' && gain > 0) {
        // Si le gain est trop important ou trop fréquent, ignorer
        if (gain > 0.5 && now - lastGainTimeRef.current < 60000) {
          console.log(`Gain trop important (${gain}€) trop rapidement, ignoré`);
          return;
        }
        
        if (consecutiveUpdatesRef.current > 3 && now - lastGainTimeRef.current < 180000) {
          console.log("Trop de gains consécutifs, ignoré");
          return;
        }
      }
      
      // Si nous avons un nouveau solde explicite
      if (typeof newBalance === 'number' && newBalance > 0) {
        // Éviter les sauts trop grands
        if (newBalance - displayBalance > 1.0 && now - lastGainTimeRef.current < 300000) {
          console.log("Augmentation trop importante du solde, limitée");
          // Limiter l'augmentation
          const limitedNewBalance = displayBalance + 0.25;
          setPrevBalance(displayBalance);
          setDisplayBalance(limitedNewBalance);
          setTargetValue(limitedNewBalance);
          setIsAnimating(shouldAnimate);
          setGainAmount(0.25);
        } else if (Math.abs(newBalance - displayBalance) > 0.01) {
          // Mise à jour normale
          setPrevBalance(displayBalance);
          setDisplayBalance(newBalance);
          setTargetValue(newBalance);
          setIsAnimating(shouldAnimate);
          
          // Calculer et afficher le gain
          const calculatedGain = newBalance - displayBalance;
          if (calculatedGain > 0) {
            setGainAmount(calculatedGain);
          } else if (typeof gain === 'number' && gain > 0) {
            setGainAmount(gain);
          }
        }
      }
      // Si nous avons seulement un gain
      else if (typeof gain === 'number' && gain > 0) {
        // Limiter la taille du gain
        const safeGain = Math.min(gain, 0.25);
        
        const calculatedNewBalance = displayBalance + safeGain;
        
        // Mise à jour normale
        setPrevBalance(displayBalance);
        setDisplayBalance(calculatedNewBalance);
        setTargetValue(calculatedNewBalance);
        setIsAnimating(shouldAnimate);
        setGainAmount(safeGain);
      }
      
      // Mise à jour des compteurs de contrôle
      if ((typeof newBalance === 'number' && newBalance > displayBalance) || 
          (typeof gain === 'number' && gain > 0)) {
        lastUpdateTime.current = now;
        lastGainTimeRef.current = now;
        consecutiveUpdatesRef.current += 1;
        
        // Enregistrer les valeurs
        localStorage.setItem('currentBalance', displayBalance.toString());
        localStorage.setItem('lastKnownBalance', displayBalance.toString());
        
        // Déclencher une mise à jour des transactions si nécessaire
        if (Math.random() < 0.3) {
          window.dispatchEvent(new CustomEvent('transactions:refresh'));
        }
        
        // Réinitialiser l'animation après un délai
        if (shouldAnimate) {
          setTimeout(() => {
            setIsAnimating(false);
            setGainAmount(null);
          }, 3000);
        }
        
        // Réinitialiser le compteur de mises à jour consécutives après un délai
        setTimeout(() => {
          consecutiveUpdatesRef.current = 0;
        }, 180000);
      }
    };
    
    // Écouter tous les types d'événements liés au solde
    window.addEventListener('balance:update', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:force-update', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:force-sync', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:daily-growth', handleBalanceUpdate as EventListener);
    window.addEventListener('dashboard:micro-gain', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:animation', handleBalanceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:force-update', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:force-sync', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:daily-growth', handleBalanceUpdate as EventListener);
      window.removeEventListener('dashboard:micro-gain', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:animation', handleBalanceUpdate as EventListener);
    };
  }, [displayBalance, setTargetValue, updateDebounceTime]);
  
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

  // Fix the responsive display for gain notifications
  const gainNotificationClasses = "absolute -top-4 md:top-4 right-0 text-sm text-green-500 flex items-center animate-bounce z-20";
  
  return (
    <CardContent className={`p-6 transition-all duration-300 ${isAnimating ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/30 dark:from-blue-800/40 dark:to-indigo-800/30' : ''}`}>
      <div className="flex items-center">
        <div className={`${isAnimating ? 'bg-blue-700 dark:bg-blue-600' : 'bg-blue-100 dark:bg-blue-900'} p-3 rounded-lg mr-4 transition-colors duration-300`}>
          <Coins className={`h-8 w-8 ${isAnimating ? 'text-yellow-300 animate-bounce' : 'text-blue-600 dark:text-blue-400'}`} />
        </div>
        <div className="relative w-full">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            Solde disponible
            {subscription !== 'freemium' && (
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
                {isAnimating && gainAmount !== null && (
                  <span className={gainNotificationClasses}>
                    <ChevronUp className="h-3 w-3 mr-0.5" />
                    +{gainAmount.toFixed(2)}€
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

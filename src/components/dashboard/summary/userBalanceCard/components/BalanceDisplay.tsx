import React, { useEffect, useRef, useState } from 'react';
import { Bot, BotOff } from 'lucide-react';
import balanceManager, { getHighestBalance } from '@/utils/balance/balanceManager';
import { animateBalanceUpdate } from '@/utils/animations/animateBalanceUpdate';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { createMoneyParticles } from '@/utils/animations';

interface BalanceDisplayProps {
  displayBalance: number;
  balanceAnimating: boolean;
  animatedBalance: number;
  previousBalance: number;
  referralBonus?: number;
  totalGeneratedBalance?: number;
  isBotActive?: boolean;
  subscription?: string; 
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  displayBalance,
  balanceAnimating,
  animatedBalance,
  previousBalance,
  referralBonus = 0,
  totalGeneratedBalance = 0,
  isBotActive = true,
  subscription = 'freemium'
}) => {
  // S'assurer d'avoir des nombres valides pour l'affichage
  const safeReferralBonus = referralBonus ?? 0;
  const safeTotalGeneratedBalance = totalGeneratedBalance ?? (displayBalance * 1.2);
  
  // Gestion de l'état local du solde pour les animations
  const [localDisplayBalance, setLocalDisplayBalance] = useState(displayBalance);
  const [localBotActive, setLocalBotActive] = useState(isBotActive);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Ref pour la fonction d'animation et la valeur initiale
  const balanceRef = useRef<HTMLDivElement>(null);
  const initialBalanceValue = useRef(displayBalance);
  const minimumDisplayBalance = useRef(displayBalance);
  const highestBalanceValue = useRef(displayBalance);
  
  // Obtenir l'ID utilisateur actuel
  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
    };
    
    getUserId();
  }, []);
  
  // Au montage, synchroniser avec le gestionnaire de solde et l'historique
  useEffect(() => {
    if (!userId) return;
    
    // Initialiser les références avec la valeur maximale disponible
    const highestBalance = getHighestBalance();
    highestBalanceValue.current = Math.max(highestBalance, displayBalance);
    minimumDisplayBalance.current = Math.max(highestBalance, displayBalance);
    initialBalanceValue.current = Math.max(highestBalance, displayBalance);
    
    // Si la valeur affichée est inférieure au maximum historique, corriger immédiatement
    if (displayBalance < highestBalance) {
      console.log(`[BalanceDisplay] Correcting display balance from ${displayBalance} to ${highestBalance}`);
      setLocalDisplayBalance(highestBalance);
    }
    
    // S'abonner aux mises à jour du gestionnaire de solde
    const unsubscribe = balanceManager.subscribe((state) => {
      // Ne mettre à jour que si le solde est différent et que c'est pour cet utilisateur
      if (state.userId && state.userId !== userId) {
        return;
      }
      
      const newBalance = state.lastKnownBalance;
      const currentMax = Math.max(newBalance, highestBalanceValue.current);
      
      if (currentMax !== localDisplayBalance) {
        console.log(`[BalanceDisplay] Updating from subscription: ${localDisplayBalance} -> ${currentMax}`);
        
        // Animer doucement vers la nouvelle valeur
        setIsAnimating(true);
        animateBalanceUpdate(
          localDisplayBalance, 
          currentMax, 
          800, 
          (value) => {
            setLocalDisplayBalance(value);
            if (value === currentMax) {
              setIsAnimating(false);
            }
          }
        );
        
        // Mettre à jour notre référence du maximum
        highestBalanceValue.current = currentMax;
      }
    });
    
    // Initialiser le gestionnaire avec la valeur maximale et l'ID utilisateur
    if (highestBalanceValue.current > 0) {
      balanceManager.initialize(highestBalanceValue.current, userId);
    }
    
    return () => {
      unsubscribe(); // Se désabonner à la destruction du composant
    };
  }, [userId]);

  // N'accepter les mises à jour de props displayBalance que si supérieures à notre maximum
  useEffect(() => {
    if (!userId) return;
    
    // PROTECTION CRITIQUE: Ne jamais accepter une valeur inférieure à notre maximum
    const currentMax = Math.max(displayBalance, highestBalanceValue.current);
    
    if (currentMax > localDisplayBalance) {
      console.log(`[BalanceDisplay] Updating display from props: ${localDisplayBalance} -> ${currentMax}`);
      
      // Mettre à jour la valeur minimale
      minimumDisplayBalance.current = currentMax;
      highestBalanceValue.current = currentMax;
      
      animateBalanceUpdate(
        localDisplayBalance, 
        currentMax, 
        800, 
        (value) => setLocalDisplayBalance(value)
      );
    } else if (displayBalance < localDisplayBalance) {
      // Si on tente de nous donner une valeur plus basse, forcer la synchronisation
      console.log(`[BalanceDisplay] Rejecting lower balance: ${displayBalance} < ${localDisplayBalance}`);
      window.dispatchEvent(new CustomEvent('balance:force-sync', { 
        detail: { balance: localDisplayBalance, userId }
      }));
    }
  }, [displayBalance, userId]);
  
  // Écouteur d'événement pour la session:start qui protège contre les réinitialisations
  useEffect(() => {
    if (!userId) return;
    
    const handleSessionStart = (event: CustomEvent) => {
      const eventUserId = event.detail?.userId;
      
      // Si l'événement contient un ID utilisateur différent, ignorer
      if (eventUserId && eventUserId !== userId) {
        return;
      }
      
      // Protéger la valeur actuelle pour éviter toute régression visuelle
      minimumDisplayBalance.current = Math.max(minimumDisplayBalance.current, localDisplayBalance);
      console.log("[BalanceDisplay] Protected minimum balance value:", minimumDisplayBalance.current);
    };
    
    window.addEventListener('session:start' as any, handleSessionStart);
    return () => window.removeEventListener('session:start' as any, handleSessionStart);
  }, [localDisplayBalance, userId]);
  
  // Vérifier si la limite est atteinte
  const isLimitReached = () => {
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    return localDisplayBalance >= dailyLimit;
  };
  
  // Écouter les événements de changement d'état du bot et de solde
  useEffect(() => {
    if (!userId) return;
    
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      const eventUserId = event.detail?.userId;
      
      // Ne traiter que les événements pour cet utilisateur
      if (eventUserId && eventUserId !== userId) {
        return;
      }
      
      if (typeof isActive === 'boolean') {
        setLocalBotActive(isActive);
      }
    };
    
    // AMÉLIORATION: Améliorer la gestion des mises à jour de solde pour assurer l'animation
    const handleBalanceUpdate = (event: CustomEvent) => {
      const amount = event.detail?.amount;
      const currentBalance = event.detail?.currentBalance;
      const eventUserId = event.detail?.userId;
      const shouldAnimate = event.detail?.animate !== false; // Activer l'animation par défaut
      
      // Ne traiter que les événements pour cet utilisateur
      if (eventUserId && eventUserId !== userId) {
        return;
      }
      
      if (typeof currentBalance === 'number' && currentBalance >= 0) {
        // Si un solde complet est fourni, l'utiliser
        console.log(`[BalanceDisplay] Update balance for user ${userId} with full value: ${currentBalance}`);
        
        // Déterminer si nous devons animer
        if (shouldAnimate && currentBalance > localDisplayBalance) {
          // Activer l'animation
          setIsAnimating(true);
          
          // Créer des particules d'argent si nous avons une référence à l'élément
          if (balanceRef.current && amount > 0) {
            createMoneyParticles(balanceRef.current, 8);
          }
          
          // Animer doucement vers la nouvelle valeur
          animateBalanceUpdate(
            localDisplayBalance,
            currentBalance,
            1200, // Animation un peu plus longue pour une meilleure visibilité
            (value) => {
              setLocalDisplayBalance(value);
              if (value === currentBalance) {
                setIsAnimating(false);
              }
            }
          );
          
          // Ajouter la classe pulse pour l'effet visuel
          if (balanceRef.current) {
            balanceRef.current.classList.add('pulse-balance');
            setTimeout(() => {
              if (balanceRef.current) {
                balanceRef.current.classList.remove('pulse-balance');
              }
            }, 1500);
          }
        } else {
          // Mise à jour sans animation
          setLocalDisplayBalance(currentBalance);
        }
        
        // Persister immédiatement
        const userBalanceKey = `user_balance_${userId}`;
        const userHighestBalanceKey = `highest_balance_${userId}`;
        const userLastKnownBalanceKey = `last_balance_${userId}`;
        
        localStorage.setItem(userBalanceKey, currentBalance.toString());
        localStorage.setItem(userHighestBalanceKey, currentBalance.toString());
        localStorage.setItem(userLastKnownBalanceKey, currentBalance.toString());
        
      } else if (typeof amount === 'number' && amount > 0) {
        // Sinon ajouter le montant au solde actuel
        console.log(`[BalanceDisplay] Update balance for user ${userId} with increment: +${amount}`);
        
        // Créer des particules d'argent pour l'effet visuel
        if (balanceRef.current && shouldAnimate) {
          createMoneyParticles(balanceRef.current, 8);
        }
        
        // Calculer le nouveau solde
        const newBalance = parseFloat((localDisplayBalance + amount).toFixed(2));
        
        if (shouldAnimate) {
          // Activer l'animation
          setIsAnimating(true);
          
          // Ajouter la classe pulse pour l'effet visuel
          if (balanceRef.current) {
            balanceRef.current.classList.add('pulse-balance');
            setTimeout(() => {
              if (balanceRef.current) {
                balanceRef.current.classList.remove('pulse-balance');
              }
            }, 1500);
          }
          
          // Animer doucement vers la nouvelle valeur
          animateBalanceUpdate(
            localDisplayBalance,
            newBalance,
            1200, // Animation un peu plus longue pour une meilleure visibilité
            (value) => {
              setLocalDisplayBalance(value);
              if (value === newBalance) {
                setIsAnimating(false);
              }
            }
          );
        } else {
          setLocalDisplayBalance(newBalance);
        }
        
        // Persister immédiatement
        const userBalanceKey = `user_balance_${userId}`;
        const userHighestBalanceKey = `highest_balance_${userId}`;
        const userLastKnownBalanceKey = `last_balance_${userId}`;
        
        localStorage.setItem(userBalanceKey, newBalance.toString());
        localStorage.setItem(userHighestBalanceKey, newBalance.toString());
        localStorage.setItem(userLastKnownBalanceKey, newBalance.toString());
      }
    };
    
    // Écouter les événements de forçage de synchronisation
    const handleForceSyncBalance = (event: CustomEvent) => {
      const syncedBalance = event.detail?.balance;
      const eventUserId = event.detail?.userId;
      
      // Ne traiter que les événements pour cet utilisateur
      if (eventUserId && eventUserId !== userId) {
        return;
      }
      
      if (typeof syncedBalance === 'number' && !isNaN(syncedBalance) && syncedBalance > 0) {
        // N'accepter que les valeurs supérieures à notre maximum
        const validTarget = Math.max(syncedBalance, highestBalanceValue.current);
        
        if (validTarget > localDisplayBalance) {
          console.log(`[BalanceDisplay] Force sync: ${localDisplayBalance} -> ${validTarget}`);
          
          highestBalanceValue.current = validTarget;
          minimumDisplayBalance.current = Math.max(minimumDisplayBalance.current, validTarget);
          
          animateBalanceUpdate(
            localDisplayBalance, 
            validTarget, 
            800, 
            (value) => setLocalDisplayBalance(value)
          );
        }
      }
    };
    
    // Écouter les événements de début de session pour protéger contre les réinitialisations
    const handleSessionStart = (event: CustomEvent) => {
      const eventUserId = event.detail?.userId;
      
      // Ne traiter que les événements pour cet utilisateur
      if (eventUserId && eventUserId !== userId) {
        return;
      }
      
      // Sauvegarder l'affichage actuel pendant la session
      minimumDisplayBalance.current = Math.max(
        minimumDisplayBalance.current, 
        localDisplayBalance,
        highestBalanceValue.current
      );
    };
    
    // Écouter les réinitialisations explicites du solde (retraits)
    const handleBalanceReset = (event: CustomEvent) => {
      const eventUserId = event.detail?.userId;
      
      // Ne traiter que les événements pour cet utilisateur
      if (eventUserId && eventUserId !== userId) {
        return;
      }
      
      console.log("[BalanceDisplay] Explicit balance reset detected");
      setLocalDisplayBalance(0);
      highestBalanceValue.current = 0;
      minimumDisplayBalance.current = 0;
    };
    
    // S'assurer d'écouter tous les types d'événements de mise à jour du solde
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    window.addEventListener('balance:local-update' as any, handleBalanceUpdate);
    window.addEventListener('balance:consistent-update' as any, handleBalanceUpdate);
    window.addEventListener('balance:force-update' as any, handleBalanceUpdate);
    window.addEventListener('balance:force-sync' as any, handleForceSyncBalance);
    window.addEventListener('session:start' as any, handleBalanceUpdate);
    window.addEventListener('balance:reset-complete' as any, handleBalanceReset);
    
    // Synchroniser avec la prop isBotActive
    setLocalBotActive(isBotActive);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:local-update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:consistent-update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-sync' as any, handleForceSyncBalance);
      window.removeEventListener('session:start' as any, handleBalanceUpdate);
      window.removeEventListener('balance:reset-complete' as any, handleBalanceReset);
    };
  }, [isBotActive, localDisplayBalance, userId]);

  // Function to toggle bot status manually
  const handleBotToggle = () => {
    if (!userId) return;
    
    // Vérifier d'abord si la limite est atteinte
    const limitReached = isLimitReached();
    
    // Si la limite est atteinte et qu'on essaie d'activer le bot, bloquer et afficher un toast
    if (limitReached && !localBotActive) {
      toast({
        title: "Impossible d'activer l'analyse",
        description: "Vous avez atteint votre limite journalière de gains. Revenez demain ou passez à un forfait supérieur.",
        variant: "destructive",
        duration: 5000
      });
      return;
    }
    
    const newStatus = !localBotActive;
    setLocalBotActive(newStatus);
    
    // Dispatch global event to sync state across components with limit checking
    window.dispatchEvent(new CustomEvent('bot:external-status-change', {
      detail: { 
        active: newStatus,
        checkLimit: true,
        subscription: subscription,
        balance: localDisplayBalance,
        userId: userId
      }
    }));
  };
  
  // Format numbers safely
  const formattedBalance = localDisplayBalance.toFixed(2);
  const formattedAnimatedBalance = animatedBalance.toFixed(2);
  const formattedPreviousBalance = previousBalance.toFixed(2);
  const formattedTotalGenerated = safeTotalGeneratedBalance.toFixed(2);
  const formattedReferralBonus = safeReferralBonus.toFixed(2);
  
  // Calculate if gain happened
  const isGain = animatedBalance > previousBalance;
  
  return (
    <div className={`pt-4 pb-6 text-center balance-display ${isAnimating ? 'glow-effect' : ''}`} ref={balanceRef}>
      <div className="relative">
        <h3 className="text-md opacity-80 mb-1">Solde actuel</h3>
        <div className="flex items-center justify-center">
          <div className={`text-5xl font-bold ${isAnimating ? 'text-green-300' : 'text-white'} transition-colors duration-300`}>
            <span>
              {formattedBalance}
            </span>
            <span className="text-2xl ml-0.5">€</span>
          </div>
        </div>
        
        <div className="text-xs text-green-300 mt-2">
          <div className="flex flex-wrap justify-center gap-1 px-2">
            <span>Bonus parrainage: {formattedReferralBonus}€</span>
            <span className="hidden sm:inline">|</span>
            <span>Total généré: {formattedTotalGenerated}€</span>
          </div>
        </div>
        
        {/* Indicateur de l'état du bot avec option de clic pour basculer */}
        <div 
          className="mt-3 flex items-center justify-center gap-1 cursor-pointer" 
          onClick={handleBotToggle}
          title="Cliquez pour activer/désactiver le bot"
        >
          {localBotActive ? (
            <>
              <Bot size={14} className="text-blue-500" />
              <span className="text-xs text-blue-400 blink-activity">
                Analyse en cours
              </span>
            </>
          ) : (
            <>
              <BotOff size={14} className="text-red-500" />
              <span className="text-xs text-red-300">
                Analyse inactive
                {isLimitReached() ? " (limite atteinte)" : ""}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceDisplay;

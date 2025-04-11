
import React, { useEffect, useRef, useState } from 'react';
import { Bot, BotOff } from 'lucide-react';
import { balanceManager, getHighestBalance } from '@/utils/balance/balanceManager';
import { animateBalanceUpdate } from '@/utils/animations/animateBalanceUpdate';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

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
  
  // Ref pour la fonction d'animation et la valeur initiale
  const balanceRef = useRef<HTMLDivElement>(null);
  const initialBalanceValue = useRef(displayBalance);
  const minimumDisplayBalance = useRef(displayBalance);
  const highestBalanceValue = useRef(getHighestBalance() || displayBalance);
  
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
        animateBalanceUpdate(
          localDisplayBalance, 
          currentMax, 
          800, 
          (value) => setLocalDisplayBalance(value)
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
    
    // Écouter les mises à jour cohérentes provenant du gestionnaire de solde
    const handleConsistentBalanceUpdate = (event: CustomEvent) => {
      const currentBalance = event.detail?.currentBalance;
      const highestBalance = event.detail?.highestBalance;
      const eventUserId = event.detail?.userId;
      
      // Ne traiter que les événements pour cet utilisateur
      if (eventUserId && eventUserId !== userId) {
        return;
      }
      
      // Toujours utiliser la valeur la plus élevée disponible
      const maxBalance = Math.max(
        currentBalance || 0,
        highestBalance || 0,
        highestBalanceValue.current || 0
      );
      
      if (maxBalance > localDisplayBalance) {
        console.log(`[BalanceDisplay] Consistent update: ${localDisplayBalance} -> ${maxBalance}`);
        
        // Mettre à jour nos références en premier
        highestBalanceValue.current = maxBalance;
        minimumDisplayBalance.current = Math.max(minimumDisplayBalance.current, maxBalance);
        
        // Animer vers la nouvelle valeur
        animateBalanceUpdate(
          localDisplayBalance, 
          maxBalance, 
          800, 
          (value) => setLocalDisplayBalance(value)
        );
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
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('balance:consistent-update' as any, handleConsistentBalanceUpdate);
    window.addEventListener('balance:force-sync' as any, handleForceSyncBalance);
    window.addEventListener('session:start' as any, handleSessionStart);
    window.addEventListener('balance:reset-complete' as any, handleBalanceReset);
    
    // Synchroniser avec la prop isBotActive
    setLocalBotActive(isBotActive);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('balance:consistent-update' as any, handleConsistentBalanceUpdate);
      window.removeEventListener('balance:force-sync' as any, handleForceSyncBalance);
      window.removeEventListener('session:start' as any, handleSessionStart);
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
    <div className="pt-4 pb-6 text-center" ref={balanceRef}>
      <div className="relative">
        <h3 className="text-md opacity-80 mb-1">Solde actuel</h3>
        <div className="flex items-center justify-center">
          <div className="text-5xl font-bold">
            <span className={`transition-colors duration-300 ${balanceAnimating ? (isGain ? 'text-green-300' : 'text-white') : 'text-white'}`}>
              {balanceAnimating ? formattedAnimatedBalance : formattedBalance}
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

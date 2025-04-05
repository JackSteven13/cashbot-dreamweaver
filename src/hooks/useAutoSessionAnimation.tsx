
import { useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { animateBalanceUpdate } from '@/utils/animations';

export const useAutoSessionAnimation = () => {
  const balanceElementRef = useRef<HTMLElement | null>(null);
  const [highestBalance, setHighestBalance] = useState<number>(0);
  
  // Initialiser avec la valeur localStorage au montage
  useEffect(() => {
    try {
      const storedHighestBalance = localStorage.getItem('highestBalance');
      const storedBalance = localStorage.getItem('currentBalance');
      
      if (storedHighestBalance) {
        setHighestBalance(parseFloat(storedHighestBalance));
      } else if (storedBalance) {
        const parsedBalance = parseFloat(storedBalance);
        if (!isNaN(parsedBalance)) {
          setHighestBalance(parsedBalance);
          localStorage.setItem('highestBalance', parsedBalance.toString());
        }
      }
    } catch (e) {
      console.error("Failed to read persisted balance:", e);
    }
  }, []);
  
  useEffect(() => {
    // Trouver et stocker la référence à l'élément du solde
    const findBalanceElement = () => {
      const element = document.querySelector('.balance-display') as HTMLElement;
      if (element) {
        balanceElementRef.current = element;
      }
    };
    
    // Observer les mutations du DOM pour trouver l'élément du solde quand il est monté
    const observer = new MutationObserver(() => {
      if (!balanceElementRef.current) {
        findBalanceElement();
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    findBalanceElement();
    
    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    // Gérer les événements de mise à jour du solde
    const handleBalanceUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const amount = customEvent.detail?.amount || 0;
      const currentBalance = customEvent.detail?.currentBalance || 0;
      
      // Assurer que nous n'avons que des augmentations de solde
      if (balanceElementRef.current && amount > 0) {
        // Vérifier le solde actuel pour garantir qu'il ne diminue jamais
        const displayElement = balanceElementRef.current.querySelector('.text-5xl span:first-child');
        const currentDisplayBalance = displayElement ? parseFloat(displayElement.textContent || '0') : 0;
        
        // Utiliser toujours la valeur la plus élevée entre:
        // - Le solde affiché actuellement
        // - Le nouveau solde calculé
        // - Le solde le plus élevé jamais atteint (stocké dans state)
        const newBalance = Math.max(currentDisplayBalance, currentBalance, highestBalance);
        
        // Mettre à jour notre référence du solde le plus élevé
        if (newBalance > highestBalance) {
          setHighestBalance(newBalance);
          localStorage.setItem('highestBalance', newBalance.toString());
        }
        
        // Animer l'élément de solde, mais seulement vers le haut
        animateBalanceUpdate(
          currentDisplayBalance, 
          newBalance,
          1000,
          (value) => {
            if (balanceElementRef.current) {
              const displayElement = balanceElementRef.current.querySelector('.text-5xl span:first-child');
              if (displayElement) {
                displayElement.textContent = `${value.toFixed(2)}`;
                
                // Persister immédiatement la valeur dans localStorage
                try {
                  localStorage.setItem('currentBalance', value.toFixed(2));
                  localStorage.setItem('lastKnownBalance', value.toFixed(2));
                } catch (e) {
                  console.error("Failed to persist balance in localStorage:", e);
                }
              }
            }
          }
        );
        
        // Appliquer seulement un effet de surbrillance subtil, pas de particules
        if (balanceElementRef.current) {
          balanceElementRef.current.classList.add('glow-effect');
          setTimeout(() => {
            if (balanceElementRef.current) {
              balanceElementRef.current.classList.remove('glow-effect');
            }
          }, 3000);
        }
        
        // Afficher une notification sobre et technique
        toast({
          title: "Revenus générés",
          description: `Analyse de données vidéo terminée. Revenus comptabilisés: ${amount.toFixed(2)}€`,
          duration: 4000,
          className: "mobile-toast"
        });
      }
    };
    
    // Gérer les événements d'animation du dashboard
    const handleDashboardAnimation = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, noEffects } = customEvent.detail || {};
      
      // Si noEffects est activé, ne pas ajouter d'effets visuels
      if (noEffects) {
        return;
      }
      
      if (type === 'income' && balanceElementRef.current) {
        // Ajouter une classe pour l'effet de lueur subtil
        balanceElementRef.current.classList.add('glow-effect');
        
        // Supprimer la classe après un délai
        setTimeout(() => {
          if (balanceElementRef.current) {
            balanceElementRef.current.classList.remove('glow-effect');
          }
        }, 3000);
      }
    };
    
    // Gérer les événements de limite atteinte
    const handleLimitReached = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { subscription } = customEvent.detail || {};
      
      toast({
        title: "Limite journalière atteinte",
        description: `Vous avez atteint votre limite quotidienne avec votre abonnement ${subscription}.`,
        duration: 5000,
        className: "mobile-toast"
      });
    };
    
    // Nouveau gestionnaire pour synchroniser le solde entre composants
    const handleBalanceSync = () => {
      // Envoyer le solde actuel le plus élevé à tous les composants
      window.dispatchEvent(new CustomEvent('balance:force-sync', { 
        detail: { balance: highestBalance }
      }));
    };
    
    window.addEventListener('balance:update', handleBalanceUpdate);
    window.addEventListener('dashboard:animation', handleDashboardAnimation);
    window.addEventListener('dashboard:limit-reached', handleLimitReached);
    window.addEventListener('balance:sync-request', handleBalanceSync);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate);
      window.removeEventListener('dashboard:animation', handleDashboardAnimation);
      window.removeEventListener('dashboard:limit-reached', handleLimitReached);
      window.removeEventListener('balance:sync-request', handleBalanceSync);
    };
  }, [highestBalance]);
  
  return { balanceElementRef };
};

export default useAutoSessionAnimation;

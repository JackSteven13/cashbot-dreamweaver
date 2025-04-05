
import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { createMoneyParticles, animateBalanceUpdate } from '@/utils/animations';

export const useAutoSessionAnimation = () => {
  const balanceElementRef = useRef<HTMLElement | null>(null);
  
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
      const isBotActive = customEvent.detail?.isBotActive !== false;
      
      if (balanceElementRef.current && amount > 0) {
        // Animer l'élément de solde
        animateBalanceUpdate(
          currentBalance - amount, 
          currentBalance,
          1000,
          (value) => {
            if (balanceElementRef.current) {
              const displayElement = balanceElementRef.current.querySelector('.text-5xl span:first-child');
              if (displayElement) {
                displayElement.textContent = `${value.toFixed(2)}`;
              }
            }
          }
        );
        
        // Créer des particules d'argent avec une intensité proportionnelle au montant
        const particleCount = Math.min(Math.max(Math.floor(amount * 10), 5), 30);
        createMoneyParticles(balanceElementRef.current, particleCount);
        
        // Afficher une notification adaptative
        toast({
          title: "Gain automatique",
          description: `CashBot a généré ${amount.toFixed(2)}€ pour vous!`,
          duration: 3000
        });
      }
    };
    
    // Gérer les événements d'animation du dashboard
    const handleDashboardAnimation = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, amount } = customEvent.detail || {};
      
      if (type === 'income' && balanceElementRef.current) {
        // Ajouter une classe pour l'effet de lueur
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
        duration: 5000
      });
    };
    
    window.addEventListener('balance:update', handleBalanceUpdate);
    window.addEventListener('dashboard:animation', handleDashboardAnimation);
    window.addEventListener('dashboard:limit-reached', handleLimitReached);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate);
      window.removeEventListener('dashboard:animation', handleDashboardAnimation);
      window.removeEventListener('dashboard:limit-reached', handleLimitReached);
    };
  }, []);
  
  return { balanceElementRef };
};

export default useAutoSessionAnimation;

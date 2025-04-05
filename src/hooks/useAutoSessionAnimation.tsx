
import { useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
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
      
      if (balanceElementRef.current && amount > 0) {
        // Animer l'élément de solde avec les 4 arguments requis
        // 1. startValue (current balance - amount)
        // 2. endValue (current balance)
        // 3. duration (1000ms default)
        // 4. updateCallback function to update the UI
        animateBalanceUpdate(
          currentBalance - amount, 
          currentBalance,
          1000,
          (value) => {
            if (balanceElementRef.current) {
              balanceElementRef.current.textContent = `${value.toFixed(2)}€`;
            }
          }
        );
        
        // Créer des particules d'argent avec une intensité proportionnelle au montant
        const particleCount = Math.min(Math.max(Math.floor(amount * 10), 5), 30);
        createMoneyParticles(balanceElementRef.current, particleCount);
        
        // Afficher une notification interactive sans bouton pour améliorer
        toast({
          title: "Gain automatique!",
          description: `Le système a généré ${amount.toFixed(2)}€ pour vous.`
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
    
    window.addEventListener('balance:update', handleBalanceUpdate);
    window.addEventListener('dashboard:animation', handleDashboardAnimation);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate);
      window.removeEventListener('dashboard:animation', handleDashboardAnimation);
    };
  }, []);
  
  return { balanceElementRef };
};

export default useAutoSessionAnimation;

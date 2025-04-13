
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

export const useBotActivation = () => {
  const { user } = useAuth();
  const [isBotActive, setIsBotActive] = useState(true);
  
  // Load bot status from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const storedBotStatus = localStorage.getItem(`botActive_${user.id}`);
      // Default to true if not explicitly set to false
      const isActive = storedBotStatus !== null ? storedBotStatus === 'true' : true;
      setIsBotActive(isActive);
    }
  }, [user?.id]);
  
  // Listen for user data loaded events
  useEffect(() => {
    const handleUserDataLoaded = (event: CustomEvent) => {
      const { userId, isNewUser } = event.detail;
      
      if (isNewUser) {
        // Always activate the bot for new users
        setIsBotActive(true);
        localStorage.setItem(`botActive_${userId}`, 'true');
        
        // Show welcome message for new users
        toast({
          title: "Assistant d'analyse activé",
          description: "Votre assistant d'analyse est maintenant actif et génère des revenus automatiquement.",
          duration: 5000
        });
      } else {
        // For existing users, load their saved preference
        const storedBotStatus = localStorage.getItem(`botActive_${userId}`);
        const savedStatus = storedBotStatus !== null ? storedBotStatus === 'true' : true;
        setIsBotActive(savedStatus);
      }
    };
    
    // Listen for bot status change events
    const handleBotStatusChange = (event: CustomEvent) => {
      const { active, userId } = event.detail;
      setIsBotActive(active);
    };
    
    // Add event listeners with proper type casting
    window.addEventListener('user:data-loaded', handleUserDataLoaded as EventListener);
    window.addEventListener('bot:status-change', handleBotStatusChange as EventListener);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('user:data-loaded', handleUserDataLoaded as EventListener);
      window.removeEventListener('bot:status-change', handleBotStatusChange as EventListener);
    };
  }, []);
  
  return { isBotActive, setIsBotActive };
};

export default useBotActivation;

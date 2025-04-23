
import { useCallback } from 'react';
import { toast } from "@/components/ui/use-toast";

interface UseSessionIncrementProps {
  incrementSessionCount: () => Promise<void>;
}

export const useSessionIncrement = ({ incrementSessionCount }: UseSessionIncrementProps) => {
  const handleIncrementSession = useCallback(async () => {
    try {
      await incrementSessionCount();
    } catch (error) {
      console.error("Failed to increment session:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'incrémenter le compteur de sessions.",
        variant: "destructive"
      });
    }
  }, [incrementSessionCount]);

  return { handleIncrementSession };
};

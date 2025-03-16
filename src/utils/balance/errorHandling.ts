
import { toast } from "@/components/ui/use-toast";

// Utility function to handle errors and display toast messages
export const handleError = (error: any, errorMessage: string) => {
  console.error(errorMessage, error);
  
  // Avoid duplicating toasts by implementing a simple toast throttling
  const now = Date.now();
  const lastToastTime = window.localStorage.getItem('lastErrorToast');
  
  if (!lastToastTime || now - parseInt(lastToastTime) > 3000) {
    window.localStorage.setItem('lastErrorToast', now.toString());
    
    toast({
      title: "Erreur",
      description: "Une erreur est survenue. Veuillez réessayer.",
      variant: "destructive"
    });
  }
  
  return false;
};

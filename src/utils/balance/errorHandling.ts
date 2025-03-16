
import { toast } from "@/components/ui/use-toast";

// Utility function to handle errors and display toast messages
export const handleError = (error: any, errorMessage: string) => {
  console.error(errorMessage, error);
  toast({
    title: "Erreur",
    description: "Une erreur est survenue. Veuillez réessayer.",
    variant: "destructive"
  });
  return false;
};

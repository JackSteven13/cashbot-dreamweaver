
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Réinitialise les données des comptes utilisateurs spécifiés
 * pour les utiliser à des fins marketing
 */
export const resetUserAccounts = async () => {
  try {
    const { data, error } = await supabase.functions.invoke("reset-users", {
      method: "POST",
    });

    if (error) {
      console.error("Erreur lors de la réinitialisation des utilisateurs:", error);
      toast({
        title: "Erreur",
        description: "Impossible de réinitialiser les comptes utilisateurs.",
        variant: "destructive",
      });
      return false;
    }

    if (data.success) {
      toast({
        title: "Succès",
        description: data.message,
        variant: "default",
      });
      return true;
    } else {
      toast({
        title: "Attention",
        description: data.message,
        variant: "destructive",
      });
      return false;
    }
  } catch (error) {
    console.error("Erreur lors de l'appel à reset-users:", error);
    toast({
      title: "Erreur",
      description: "Une erreur s'est produite. Veuillez réessayer.",
      variant: "destructive",
    });
    return false;
  }
};

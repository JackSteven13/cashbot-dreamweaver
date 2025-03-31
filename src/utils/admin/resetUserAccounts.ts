
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React from "react";

/**
 * Réinitialise les données des comptes utilisateurs spécifiés
 * pour les utiliser à des fins marketing
 */
export const resetUserAccounts = async () => {
  try {
    // Afficher un toast de chargement
    toast({
      title: "Réinitialisation en cours",
      description: "Veuillez patienter pendant la réinitialisation des comptes...",
    });
    
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
      
      // Pour s'assurer que les changements sont visibles dans l'interface
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
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

/**
 * Composant pour afficher un bouton de réinitialisation avec tooltip
 */
export const ResetUserAccountsButton = ({ children }: { children: React.ReactNode }) => {
  const handleReset = async () => {
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir réinitialiser ces comptes utilisateurs? Cette action supprimera toutes les transactions et remettra les soldes à zéro."
    );
    
    if (confirmed) {
      await resetUserAccounts();
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild onClick={handleReset}>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          <p>Réinitialise les comptes marketing</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

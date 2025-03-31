
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React from "react";

// Fonction pour réinitialiser le compte d'un utilisateur
export const resetUserAccount = async (userId: string) => {
  try {
    // Mise à jour du solde de l'utilisateur
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: 0 })
      .eq('id', userId);
      
    if (updateError) throw updateError;
    
    // Suppression des transactions de l'utilisateur
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) throw deleteError;
    
    toast({
      title: "Compte réinitialisé",
      description: "Le compte a été réinitialisé avec succès",
    });
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du compte:", error);
    toast({
      title: "Erreur",
      description: "Une erreur est survenue lors de la réinitialisation du compte",
      variant: "destructive",
    });
    return false;
  }
};

// Composant pour le bouton de réinitialisation avec confirmation
export const ResetAccountButton = ({ userId, onSuccess }: { userId: string, onSuccess?: () => void }) => {
  const handleReset = async () => {
    const confirmed = window.confirm("Êtes-vous sûr de vouloir réinitialiser ce compte ? Cette action est irréversible.");
    if (confirmed) {
      const success = await resetUserAccount(userId);
      if (success && onSuccess) {
        onSuccess();
      }
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleReset}
            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
          >
            Réinitialiser
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Réinitialiser le solde et supprimer les transactions</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};


/**
 * Utilitaires de sécurité pour l'authentification
 * Implémentation côté client alternative à la fonctionnalité premium de Supabase
 */
import { supabase } from "@/integrations/supabase/client";
import { isPasswordSecure } from "./passwordValidator";
import { toast } from "sonner";

// Vérifie si l'utilisateur doit être encouragé à renforcer son mot de passe
export const checkPasswordSecurity = async (user: { id: string, email?: string | null }) => {
  try {
    // Si l'utilisateur change de mot de passe, nous pouvons l'encourager à respecter
    // nos règles de sécurité, même si nous ne pouvons pas voir son mot de passe actuel
    const metadata = await getPasswordMetadata(user.id);
    
    if (metadata && !metadata.password_checked) {
      // Enregistrer que nous avons effectué la vérification
      await updatePasswordMetadata(user.id, true);
      
      // Afficher une notification pour encourager un mot de passe fort
      setTimeout(() => {
        toast.info(
          "Sécurisez votre compte", 
          { 
            description: "Pour votre sécurité, assurez-vous d'avoir un mot de passe fort et unique.",
            duration: 8000,
            action: {
              label: "En savoir plus",
              onClick: () => window.open("https://haveibeenpwned.com/Passwords", "_blank")
            }
          }
        );
      }, 2000);
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de sécurité du mot de passe:", error);
  }
};

// Obtenir les métadonnées du mot de passe de l'utilisateur
const getPasswordMetadata = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('password_checked')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des métadonnées du mot de passe:", error);
    return null;
  }
};

// Mettre à jour les métadonnées du mot de passe de l'utilisateur
const updatePasswordMetadata = async (userId: string, checked: boolean) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ password_checked: checked })
      .eq('id', userId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour des métadonnées du mot de passe:", error);
    return false;
  }
};

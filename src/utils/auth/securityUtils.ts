
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
    // Stocker en local storage qu'on a déjà montré le message pour ne pas répéter
    const securityCheckShown = localStorage.getItem(`password_security_shown_${user.id}`);
    
    if (!securityCheckShown) {
      // Marquer que nous avons affiché la notification
      localStorage.setItem(`password_security_shown_${user.id}`, 'true');
      
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

// Version adaptée qui utilise localStorage au lieu de la base de données
// pour éviter de modifier la structure de la table profiles
const getPasswordMetadata = async (userId: string) => {
  try {
    const isChecked = localStorage.getItem(`password_checked_${userId}`) === 'true';
    return { password_checked: isChecked };
  } catch (error) {
    console.error("Erreur lors de la récupération des métadonnées du mot de passe:", error);
    return null;
  }
};

// Version adaptée qui utilise localStorage au lieu de la base de données
const updatePasswordMetadata = async (userId: string, checked: boolean) => {
  try {
    localStorage.setItem(`password_checked_${userId}`, checked ? 'true' : 'false');
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour des métadonnées du mot de passe:", error);
    return false;
  }
};

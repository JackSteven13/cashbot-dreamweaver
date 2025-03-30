
/**
 * Manages the opening and handling of Stripe checkout windows
 */

import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

/**
 * Opens a Stripe checkout URL in a new window or fallbacks to current window
 * Using the most direct and forceful approach possible for maximum compatibility
 */
export const openStripeWindow = (url: string): void => {
  if (!url) {
    console.error("Attempted to open Stripe window with empty URL");
    return;
  }
  
  console.log("Opening Stripe URL:", url);
  
  // Show toast FIRST, before any redirection attempts
  showStripeManualOpenToast(url);
  
  // DIRECT APPROACH - no delays, no fancy methods
  // This is the most reliable method across devices
  try {
    console.log("Executing direct navigation to:", url);
    window.location.href = url;
  } catch (error) {
    console.error("Direct navigation failed:", error);
    
    // Fallback options if direct method fails
    try {
      console.log("Trying fallback method 1");
      window.open(url, "_self");
    } catch (fallbackError) {
      console.error("Fallback method 1 failed:", fallbackError);
      
      try {
        console.log("Trying fallback method 2");
        window.location.assign(url);
      } catch (finalError) {
        console.error("All automatic methods failed:", finalError);
        
        // Force the user to use the manual button in the toast
        toast({
          title: "Problème d'ouverture automatique",
          description: "Veuillez cliquer sur le bouton ci-dessous pour continuer vers le paiement.",
          variant: "destructive",
          duration: 60000, // Show for a full minute
        });
      }
    }
  }
};

/**
 * Shows a toast with a button to manually open the Stripe checkout
 * Enhanced with more visible styling and longer duration
 */
export const showStripeManualOpenToast = (url: string): void => {
  if (!url) {
    console.error("Attempted to show toast with empty Stripe URL");
    return;
  }
  
  toast({
    title: "Paiement en attente",
    description: "Si la page de paiement ne s'ouvre pas automatiquement, cliquez sur le bouton ci-dessous.",
    action: (
      <ToastAction 
        onClick={() => {
          // Direct and forceful approach for manual click
          console.log("Manual redirect button clicked for URL:", url);
          try {
            window.location.href = url;
          } catch (error) {
            console.error("Manual navigation failed, trying alternate method:", error);
            window.open(url, "_self");
          }
        }}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md cursor-pointer text-sm font-bold shadow-md"
        altText="Ouvrir la page de paiement"
      >
        Ouvrir le paiement
      </ToastAction>
    ),
    duration: 60000, // Show for a full minute to give plenty of time
  });
};

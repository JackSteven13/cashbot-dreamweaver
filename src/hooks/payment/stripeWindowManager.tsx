
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
  
  // Use a try-catch block to ensure we have multiple fallbacks
  try {
    console.log("Attempting primary redirect method");
    
    // Delay to ensure toast is visible
    setTimeout(() => {
      try {
        // Most direct method - guaranteed to work across all platforms
        window.location.href = url;
        console.log("Primary redirect method executed");
      } catch (error) {
        console.error("Primary redirect failed, trying alternative:", error);
        window.open(url, "_self");
      }
    }, 800); // Longer delay to ensure toast is visible
  } catch (error) {
    console.error("Could not set up delayed redirect:", error);
    
    // Immediate fallback if the timeout somehow fails
    try {
      window.location.href = url;
    } catch (finalError) {
      console.error("All redirect methods failed:", finalError);
      
      // Last resort - update toast with stronger message
      toast({
        title: "Problème de redirection",
        description: "Veuillez cliquer sur le bouton pour ouvrir la page de paiement manuellement.",
        variant: "destructive",
        duration: 60000, // Show for a full minute
      });
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
          console.log("Manual redirect button clicked");
          window.location.href = url;
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

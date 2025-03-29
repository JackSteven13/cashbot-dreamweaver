
/**
 * Manages the opening and handling of Stripe checkout windows
 */

import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

/**
 * Opens a Stripe checkout URL in a new window or fallbacks to current window
 */
export const openStripeWindow = (url: string): void => {
  if (!url) {
    console.error("Attempted to open Stripe window with empty URL");
    return;
  }
  
  console.log("Opening Stripe URL:", url);
  
  // Simplify for maximum reliability - direct navigation always works
  try {
    // Use direct window.location for reliability
    window.location.href = url;
  } catch (error) {
    console.error("Error during redirection:", error);
    // Fallback if somehow the direct navigation fails
    setTimeout(() => {
      window.location.replace(url);
    }, 100);
  }
};

/**
 * Shows a toast with a button to manually open the Stripe checkout
 */
export const showStripeManualOpenToast = (url: string): void => {
  if (!url) {
    console.error("Attempted to show toast with empty Stripe URL");
    return;
  }
  
  toast({
    title: "Paiement en attente",
    description: "Si la page de paiement ne s'est pas ouverte, cliquez sur le bouton ci-dessous.",
    action: (
      <ToastAction 
        onClick={() => window.location.href = url}
        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md cursor-pointer text-sm"
        altText="Ouvrir la page de paiement"
      >
        Ouvrir le paiement
      </ToastAction>
    ),
    duration: 30000, // Increased duration to give user more time
  });
};

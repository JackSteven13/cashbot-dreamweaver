
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
  
  // Force direct navigation for maximum compatibility, especially on mobile
  try {
    console.log("Redirecting to:", url);
    // First show toast before navigation
    showStripeManualOpenToast(url);
    
    // Short timeout to ensure the toast is visible
    setTimeout(() => {
      // Use location.assign for most reliable cross-browser behavior
      window.location.assign(url);
    }, 300);
  } catch (error) {
    console.error("Error during redirection:", error);
    // Fallback if somehow the direct navigation fails
    window.location.href = url;
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
        onClick={() => window.location.assign(url)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md cursor-pointer text-sm"
        altText="Ouvrir la page de paiement"
      >
        Ouvrir le paiement
      </ToastAction>
    ),
    duration: 30000, // Increased duration to give user more time
  });
};

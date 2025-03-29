
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
  
  // Force direct redirect for all mobile devices and small screens
  if (window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    console.log("Mobile device detected, using direct navigation");
    window.location.href = url;
    return;
  }
  
  // Force direct redirect if on Safari (mobile or desktop)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari) {
    console.log("Safari browser detected, using direct navigation");
    window.location.href = url;
    return;
  }
  
  // For desktop browsers other than Safari, try opening in new window
  try {
    // First attempt - direct navigation for simplicity and reliability
    window.location.href = url;
  } catch (error) {
    console.error("Error opening window:", error);
    // Final fallback to direct navigation
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

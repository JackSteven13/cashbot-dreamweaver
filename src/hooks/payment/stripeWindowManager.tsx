
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
  
  // On mobile devices, use direct navigation
  if (window.innerWidth < 768) {
    console.log("Mobile device detected, using direct navigation");
    window.location.href = url;
    return;
  }
  
  // Try to open in a new tab first - with specific focus on popup allowance
  try {
    // Force direct redirect if on Safari mobile
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isSafari && isMobile) {
      console.log("Safari mobile detected, using direct navigation");
      window.location.href = url;
      return;
    }
    
    // Try opening in new window with more permissive options
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    // Check if popup was blocked and redirect current window if needed
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.log("Failed to open in new tab, redirecting current window");
      window.location.href = url;
    } else {
      // Try to focus the new window
      try {
        newWindow.focus();
      } catch (focusError) {
        console.log("Could not focus new window:", focusError);
      }
    }
  } catch (error) {
    console.error("Error opening window:", error);
    // Fallback to direct navigation
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
    description: "Utilisez le bouton ci-dessous si la page de paiement ne s'est pas ouverte automatiquement.",
    action: (
      <ToastAction 
        onClick={() => openStripeWindow(url)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md cursor-pointer text-sm"
        altText="Ouvrir la page de paiement"
      >
        Ouvrir le paiement
      </ToastAction>
    ),
    duration: 15000, // Increase duration to give user more time to click
  });
};

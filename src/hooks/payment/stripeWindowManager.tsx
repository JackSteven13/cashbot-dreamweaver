
/**
 * Manages the opening and handling of Stripe checkout windows
 */

import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

/**
 * Opens a Stripe checkout URL in a new window or fallbacks to current window
 */
export const openStripeWindow = (url: string): void => {
  if (!url) return;
  
  console.log("Opening Stripe URL:", url);
  
  // On mobile devices, use direct navigation
  if (window.innerWidth < 768) {
    console.log("Mobile device detected, using direct navigation");
    window.location.href = url;
    return;
  }
  
  // Try to open in a new tab first
  try {
    const newWindow = window.open(url, '_blank');
    
    // If that fails, redirect the current window
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.log("Failed to open in new tab, redirecting current window");
      window.location.href = url;
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
  if (!url) return;
  
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
  });
};

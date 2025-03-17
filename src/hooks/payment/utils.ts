import { toast } from "@/components/ui/use-toast";

export const validateCardPayment = (cardNumber: string, expiry: string, cvc: string) => {
  // Basic form validation
  if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
    toast({
      title: "Erreur",
      description: "Numéro de carte invalide",
      variant: "destructive"
    });
    return false;
  }

  if (!expiry || expiry.length !== 5) {
    toast({
      title: "Erreur",
      description: "Date d'expiration invalide",
      variant: "destructive"
    });
    return false;
  }

  if (!cvc || cvc.length !== 3) {
    toast({
      title: "Erreur",
      description: "Code CVC invalide",
      variant: "destructive"
    });
    return false;
  }

  return true;
};

export const getReferralCodeFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref');
};

export const formatErrorMessage = (error: any): string => {
  // Create a more user-friendly error message
  let errorMessage;
  
  // Check for specific error patterns
  if (error.message?.includes('No such price')) {
    errorMessage = "La configuration des prix n'est pas encore terminée. Veuillez réessayer ultérieurement.";
  } else if (error.message?.includes('Invalid API Key')) {
    errorMessage = "Configuration de paiement incorrecte. Veuillez contacter le support.";
  } else if (error.message?.includes('Edge Function returned a non-2xx status code')) {
    errorMessage = "Le service de paiement est temporairement indisponible. Veuillez réessayer dans quelques instants.";
  } else if (error.message?.includes('product exists in live mode, but a test mode key was used')) {
    errorMessage = "Système en cours de migration vers la production. Merci de réessayer dans quelques minutes.";
  } else if (error.message?.includes('Converting circular structure to JSON')) {
    errorMessage = "Erreur technique dans le format de la requête. Veuillez réessayer.";
  } else if (error.message?.includes('Invalid integer')) {
    errorMessage = "Erreur de formatage du prix. Notre équipe a été informée et résoudra ce problème rapidement.";
  } else {
    // Use the original error message or a generic one
    errorMessage = error.message || "Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.";
  }
  
  return errorMessage;
};

// Ensure prices are always precise integers when converted to cents
export const priceToCents = (price: number): number => {
  // First multiply by 100 then round to ensure we get a precise integer
  return Math.round(price * 100);
};

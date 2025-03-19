
export const getReferralCodeFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref');
};

export const formatErrorMessage = (error: any) => {
  // Check for specific error patterns
  if (error.message?.includes('No such price')) {
    return "La configuration des prix n'est pas encore terminée. Veuillez réessayer ultérieurement.";
  } else if (error.message?.includes('Invalid API Key')) {
    return "Configuration de paiement incorrecte. Veuillez contacter le support.";
  } else if (error.message?.includes('Edge Function returned a non-2xx status code')) {
    return "Le service de paiement est temporairement indisponible. Veuillez réessayer dans quelques instants.";
  } else if (error.message?.includes('product exists in live mode, but a test mode key was used')) {
    return "Système en cours de migration vers la production. Merci de réessayer dans quelques minutes.";
  } else if (error.message?.includes('Converting circular structure to JSON')) {
    return "Erreur technique dans le format de la requête. Veuillez réessayer.";
  } else if (error.message?.includes('Invalid integer')) {
    return "Erreur de formatage du prix. Notre équipe a été informée et résoudra ce problème rapidement.";
  } else {
    // Use the original error message or a generic one
    return error.message || "Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.";
  }
};

export const validateCardPayment = (cardNumber: string, expiry: string, cvc: string): boolean => {
  // Basic form validation
  if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
    return false;
  }

  if (!expiry || expiry.length !== 5) {
    return false;
  }

  if (!cvc || cvc.length !== 3) {
    return false;
  }

  return true;
};

export const updateLocalSubscription = async (plan: string) => {
  localStorage.setItem('subscription', plan);
  return true;
};

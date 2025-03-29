// Basic card validation
export const validateCardPayment = (cardNumber: string, expiry: string, cvc: string) => {
  // Remove spaces from card number
  const cleanCardNumber = cardNumber.replace(/\s/g, '');

  if (!cleanCardNumber || cleanCardNumber.length < 15 || cleanCardNumber.length > 16 || !/^\d+$/.test(cleanCardNumber)) {
    return false;
  }

  if (!expiry || !/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(expiry)) {
    return false;
  }

  if (!cvc || cvc.length < 3 || cvc.length > 4 || !/^\d+$/.test(cvc)) {
    return false;
  }

  return true;
};

// Format an error message for display
export const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error) {
    return typeof error.error === 'string' 
      ? error.error 
      : error.error.message || 'Une erreur inconnue est survenue';
  }
  
  return 'Une erreur inconnue est survenue lors du traitement du paiement';
};

// Get referral code from URL parameters
export const getReferralCodeFromURL = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref');
};

// Update local subscription info
export const updateLocalSubscription = (subscription: string): void => {
  localStorage.setItem('subscription', subscription);
  localStorage.setItem('forceRefreshBalance', 'true');
};

// Helper to safely open a URL
export const safelyOpenURL = (url: string): void => {
  try {
    window.location.href = url;
  } catch (error) {
    console.error('Error redirecting to URL:', error);
    
    // Fallback - create a link and click it
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

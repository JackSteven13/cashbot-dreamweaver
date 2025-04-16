
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { openStripeWindow } from '@/hooks/payment/stripeWindowManager';
import { isMobileDevice } from '@/utils/stripe-helper';

interface CheckoutTransitionProps {
  isStarted: boolean;
  stripeUrl: string | null;
  onComplete: () => void;
}

const CheckoutTransition: React.FC<CheckoutTransitionProps> = ({ 
  isStarted, 
  stripeUrl, 
  onComplete 
}) => {
  const [step, setStep] = useState<number>(0);
  const [readyForStripe, setReadyForStripe] = useState(false);
  const isMobile = isMobileDevice();
  
  useEffect(() => {
    if (!isStarted) return;
    
    // Étape 1: Initialiser la transition
    setStep(1);
    
    // Sur mobile, accélérer la transition pour éviter les délais
    const timing = isMobile ? {
      step2: 400, // Plus rapide sur mobile
      step3: 800  // Plus rapide sur mobile
    } : {
      step2: 800,
      step3: 1800
    };
    
    // Étape 2: Préparer le paiement
    const timer1 = setTimeout(() => setStep(2), timing.step2);
    
    // Étape 3: Prêt pour la redirection
    const timer2 = setTimeout(() => {
      setStep(3);
      // Notifier que la transition est terminée
      onComplete();
      
      // Délai supplémentaire avant d'ouvrir Stripe
      // Sur mobile, rendre ce délai beaucoup plus court
      const timer3 = setTimeout(() => {
        setReadyForStripe(true);
      }, isMobile ? 100 : 800); // Beaucoup plus court sur mobile
      
      return () => clearTimeout(timer3);
    }, timing.step3);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isStarted, onComplete, isMobile]);

  // Ouvrir la page Stripe dès que nous sommes prêts
  useEffect(() => {
    if (readyForStripe && stripeUrl) {
      // Ouvrir dans un nouvel onglet ou rediriger selon le device
      openStripeWindow(stripeUrl);
    }
  }, [readyForStripe, stripeUrl]);

  if (!isStarted) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm"
    >
      <div className="text-center bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-xl max-w-md w-full mx-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="mb-5"
        >
          {step < 3 ? (
            <div className="mx-auto w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              {step === 1 && <Loader2 className="w-7 h-7 md:w-8 md:h-8 text-blue-600 dark:text-blue-400 animate-spin" />}
              {step === 2 && <CreditCard className="w-7 h-7 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />}
            </div>
          ) : (
            <div className="mx-auto w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-7 h-7 md:w-8 md:h-8 text-green-600 dark:text-green-400" />
            </div>
          )}
        </motion.div>
        
        <h2 className="text-lg md:text-xl font-semibold mb-2">
          {step === 1 && "Préparation de votre paiement..."}
          {step === 2 && "Connexion à Stripe..."}
          {step === 3 && "Redirection vers le paiement"}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm md:text-base">
          {step === 1 && "Nous préparons votre session de paiement sécurisée."}
          {step === 2 && "Connexion au système de paiement sécurisé Stripe."}
          {step === 3 && isMobile ? 
            "Vous allez être redirigé maintenant." : 
            "Vous allez être redirigé vers la page de paiement Stripe dans un instant."
          }
        </p>
        
        <div className="mt-3">
          <motion.div 
            className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            initial={{ width: "100%" }}
          >
            <motion.div 
              className="h-full bg-blue-600 dark:bg-blue-500"
              initial={{ width: "0%" }}
              animate={{ width: `${step * 33.33}%` }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        </div>
        
        {isMobile && step === 3 && (
          <p className="text-xs text-amber-600 mt-3">
            Si la redirection ne fonctionne pas automatiquement, veuillez cliquer sur le bouton ci-dessous.
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default CheckoutTransition;

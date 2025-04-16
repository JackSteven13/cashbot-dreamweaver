
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { openStripeWindow } from '@/hooks/payment/stripeWindowManager';

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
  
  useEffect(() => {
    if (!isStarted) return;
    
    // Étape 1: Initialiser la transition
    setStep(1);
    
    // Étape 2: Préparer le paiement
    const timer1 = setTimeout(() => setStep(2), 800);
    
    // Étape 3: Prêt pour la redirection
    const timer2 = setTimeout(() => {
      setStep(3);
      // Notifier que la transition est terminée
      onComplete();
      
      // Délai supplémentaire avant d'ouvrir Stripe pour une meilleure expérience utilisateur
      const timer3 = setTimeout(() => {
        setReadyForStripe(true);
      }, 600);
      
      return () => clearTimeout(timer3);
    }, 1800);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isStarted, onComplete]);

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
      <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl max-w-md w-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="mb-6"
        >
          {step < 3 ? (
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              {step === 1 && <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />}
              {step === 2 && <CreditCard className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          )}
        </motion.div>
        
        <h2 className="text-xl font-semibold mb-2">
          {step === 1 && "Préparation de votre paiement..."}
          {step === 2 && "Connexion à Stripe..."}
          {step === 3 && "Redirection vers le paiement"}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {step === 1 && "Nous préparons votre session de paiement sécurisée."}
          {step === 2 && "Connexion au système de paiement sécurisé Stripe."}
          {step === 3 && "Vous allez être redirigé vers la page de paiement Stripe dans un instant."}
        </p>
        
        <div className="mt-4">
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
      </div>
    </motion.div>
  );
};

export default CheckoutTransition;

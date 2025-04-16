import React from 'react';
import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { openStripeWindow } from '@/hooks/payment/stripeWindowManager';
import { isMobileDevice } from '@/utils/stripe-helper';
import { Button } from '@/components/ui/button';

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
  const [animationComplete, setAnimationComplete] = useState(false);
  const isMobile = isMobileDevice();
  
  useEffect(() => {
    if (!isStarted) return;
    
    // Étape 1: Initialiser la transition
    setStep(1);
    
    // Sur mobile, accélérer la transition
    const timing = isMobile ? {
      step2: 400, // Plus rapide mais pas trop sur mobile
      step3: 800  // Plus rapide mais pas trop sur mobile
    } : {
      step2: 800,
      step3: 1600
    };
    
    // Étape 2: Préparer le paiement
    const timer1 = setTimeout(() => setStep(2), timing.step2);
    
    // Étape 3: Fin d'animation
    const timer2 = setTimeout(() => {
      setStep(3);
      setAnimationComplete(true);
      // Notifier que la transition est terminée
      onComplete();
      
      // Ne pas ouvrir automatiquement, attendre l'action de l'utilisateur
      setReadyForStripe(true);
    }, timing.step3);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isStarted, onComplete, isMobile]);

  // Fonction pour ouvrir manuellement Stripe lorsque l'utilisateur clique
  const handleOpenStripe = () => {
    if (readyForStripe && stripeUrl) {
      openStripeWindow(stripeUrl);
    }
  };

  if (!isStarted) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm"
    >
      <div className="text-center bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-xl max-w-md w-full mx-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="mb-5"
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
        
        <h2 className="text-xl md:text-2xl font-semibold mb-3">
          {step === 1 && "Préparation de votre paiement..."}
          {step === 2 && "Connexion à Stripe..."}
          {step === 3 && "Prêt pour le paiement"}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-base">
          {step === 1 && "Nous préparons votre session de paiement sécurisée."}
          {step === 2 && "Connexion au système de paiement sécurisé Stripe."}
          {step === 3 && "Votre session de paiement est prête. Cliquez sur le bouton ci-dessous pour continuer."}
        </p>
        
        {/* Barre de progression animée */}
        <div className="mt-3 mb-6">
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
        
        {/* Bouton pour continuer vers Stripe - visible uniquement quand l'animation est terminée */}
        {animationComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button 
              onClick={handleOpenStripe} 
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium shadow-md w-full"
              disabled={!readyForStripe || !stripeUrl}
            >
              <span className="flex items-center justify-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Continuer vers la page de paiement
              </span>
            </Button>
            
            {isMobile && (
              <p className="text-xs text-gray-500 mt-3">
                Vous allez être redirigé vers une page sécurisée pour finaliser votre paiement.
              </p>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CheckoutTransition;

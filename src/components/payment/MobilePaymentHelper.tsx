
import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import Button from '@/components/Button';
import { toast } from '@/components/ui/use-toast';

interface MobilePaymentHelperProps {
  isVisible: boolean;
  onHelp: () => void;
  stripeUrl?: string | null;
}

const MobilePaymentHelper: React.FC<MobilePaymentHelperProps> = ({ 
  isVisible, 
  onHelp,
  stripeUrl 
}) => {
  if (!isVisible) return null;

  const handleOpenDirectly = () => {
    // Notifier l'utilisateur
    toast({
      title: "Redirection en cours",
      description: "Vous allez être redirigé vers la page de paiement...",
      duration: 3000,
    });
    
    // Déclencher la fonction de callback
    onHelp();
    
    // Si l'URL est disponible, tenter une redirection directe après un court délai
    if (stripeUrl) {
      setTimeout(() => {
        try {
          console.log("Redirection directe via le helper:", stripeUrl);
          window.location.href = stripeUrl;
        } catch (e) {
          console.error("Erreur lors de la redirection directe:", e);
        }
      }, 500);
    }
  };

  return (
    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
      <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-300">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="font-medium">Problème d'ouverture du paiement</h3>
      </div>
      <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
        Si la page de paiement ne s'ouvre pas automatiquement, veuillez cliquer sur le bouton ci-dessous.
      </p>
      <div className="mt-3 flex space-x-2">
        <Button 
          onClick={handleOpenDirectly}
          className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Ouvrir la page de paiement
        </Button>
      </div>
    </div>
  );
};

export default MobilePaymentHelper;


import React from 'react';
import { AlertTriangle, ExternalLink, Link2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  if (!isVisible || !stripeUrl) return null;

  const handleOpenDirectly = () => {
    // Notifier l'utilisateur
    toast({
      title: "Redirection en cours",
      description: "Vous allez être redirigé vers la page de paiement...",
      duration: 3000,
    });
    
    // Déclencher la fonction de callback
    onHelp();
  };
  
  const copyToClipboard = () => {
    if (!stripeUrl) return;
    
    try {
      navigator.clipboard.writeText(stripeUrl);
      toast({
        title: "Lien copié",
        description: "L'URL de paiement a été copiée dans votre presse-papier",
        duration: 3000,
      });
    } catch (e) {
      console.error("Erreur lors de la copie:", e);
    }
  };

  return (
    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
      <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-300">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="font-medium">Problème d'ouverture du paiement</h3>
      </div>
      <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
        Si la page de paiement ne s'ouvre pas automatiquement, essayez l'une des options ci-dessous.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <Button 
          onClick={handleOpenDirectly}
          className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Ouvrir la page de paiement
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={copyToClipboard}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Copy className="h-3 w-3" />
            Copier l'URL
          </Button>
          
          <a 
            href={stripeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <Link2 className="h-3 w-3" />
            Ouvrir dans un nouvel onglet
          </a>
        </div>
      </div>
    </div>
  );
};

export default MobilePaymentHelper;

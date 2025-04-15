
import React from 'react';
import { ExternalLink, Link2, Copy } from 'lucide-react';
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
    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
      <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-300">
        <h3 className="font-medium text-sm">Pages de paiement sécurisées</h3>
      </div>
      <p className="mt-2 text-xs text-blue-700 dark:text-blue-400">
        Si la page de paiement ne s'ouvre pas automatiquement, utilisez l'une des options ci-dessous:
      </p>
      <div className="mt-2 space-y-2">
        <Button 
          onClick={handleOpenDirectly}
          className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-2 h-auto text-sm"
          size="sm"
        >
          <ExternalLink className="h-4 w-4" />
          Accéder au paiement sécurisé
        </Button>
        
        <div className="flex items-center justify-center gap-2 text-xs">
          <Button 
            onClick={copyToClipboard}
            variant="outline"
            size="sm"
            className="h-8 text-xs flex items-center gap-1"
          >
            <Copy className="h-3 w-3" />
            Copier l'URL
          </Button>
          
          <a 
            href={stripeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-2 flex items-center justify-center gap-1 text-xs text-blue-600 hover:underline border border-blue-200 dark:border-blue-800 rounded-md bg-white dark:bg-blue-900/20"
          >
            <Link2 className="h-3 w-3" />
            Ouvrir manuellement
          </a>
        </div>
      </div>
    </div>
  );
};

export default MobilePaymentHelper;

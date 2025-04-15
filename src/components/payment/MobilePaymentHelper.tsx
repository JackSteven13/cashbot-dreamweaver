
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
    if (!stripeUrl) return;
    
    // Notifier l'utilisateur
    toast({
      title: "Redirection en cours",
      description: "Vous allez être redirigé vers la page de paiement...",
      duration: 3000,
    });
    
    // Ouvrir directement l'URL
    window.location.href = stripeUrl;
    
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
      // Méthode alternative de copie
      const textarea = document.createElement('textarea');
      textarea.value = stripeUrl;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      try {
        document.execCommand('copy');
        toast({
          title: "Lien copié",
          description: "L'URL de paiement a été copiée dans votre presse-papier",
          duration: 3000,
        });
      } catch (err) {
        console.error("La copie a échoué:", err);
        toast({
          title: "Échec de la copie",
          description: "Impossible de copier l'URL. Veuillez réessayer.",
          variant: "destructive",
          duration: 3000,
        });
      }
      
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
      <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-300 mb-3">
        <h3 className="font-medium text-sm md:text-base">Accéder au paiement sécurisé</h3>
      </div>
      <p className="mb-3 text-xs md:text-sm text-blue-700 dark:text-blue-400">
        Si la page de paiement ne s'ouvre pas automatiquement, cliquez sur le bouton ci-dessous:
      </p>
      <div className="space-y-3">
        <Button 
          onClick={handleOpenDirectly}
          className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-3 h-auto text-sm md:text-base"
          size="sm"
        >
          <ExternalLink className="h-4 w-4" />
          Payer maintenant
        </Button>
        
        <div className="flex items-center justify-center gap-2">
          <Button 
            onClick={copyToClipboard}
            variant="outline"
            size="sm"
            className="flex-1 h-9 text-xs md:text-sm flex items-center gap-1"
          >
            <Copy className="h-3 w-3 md:h-4 md:w-4" />
            Copier le lien
          </Button>
          
          <a 
            href={stripeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-9 px-2 flex items-center justify-center gap-1 text-xs md:text-sm text-blue-600 hover:underline border border-blue-200 dark:border-blue-800 rounded-md bg-white dark:bg-blue-900/20"
          >
            <Link2 className="h-3 w-3 md:h-4 md:w-4" />
            Ouvrir manuellement
          </a>
        </div>
      </div>
    </div>
  );
};

export default MobilePaymentHelper;

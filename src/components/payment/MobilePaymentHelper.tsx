
import React from 'react';
import { ExternalLink, RefreshCw, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { hasPendingStripePayment } from '@/utils/stripe-helper';

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
  const effectiveUrl = stripeUrl || localStorage.getItem('lastStripeUrl');
  
  if (!isVisible) return null;

  const handleOpenDirectly = () => {
    if (!effectiveUrl) {
      toast({
        title: "Erreur",
        description: "Aucune URL de paiement disponible. Veuillez réessayer le processus.",
        variant: "destructive"
      });
      return;
    }
    
    // Notification visuelle à l'utilisateur
    toast({
      title: "Redirection en cours",
      description: "Vous allez être redirigé vers la page de paiement sécurisée...",
      duration: 3000,
    });
    
    // Ouvrir directement l'URL
    window.location.href = effectiveUrl;
    
    // Déclencher la fonction de callback
    onHelp();
  };
  
  const copyToClipboard = () => {
    if (!effectiveUrl) return;
    
    try {
      // Méthode moderne de copie
      navigator.clipboard.writeText(effectiveUrl)
        .then(() => {
          toast({
            title: "Lien copié",
            description: "L'URL de paiement a été copiée dans votre presse-papier",
            duration: 3000,
          });
        })
        .catch(err => {
          console.error("Erreur lors de la copie:", err);
          // Méthode alternative
          useAlternativeCopyMethod();
        });
    } catch (e) {
      useAlternativeCopyMethod();
    }
  };
  
  const useAlternativeCopyMethod = () => {
    // Méthode alternative pour les navigateurs plus anciens
    const textArea = document.createElement('textarea');
    textArea.value = effectiveUrl || '';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      toast({
        title: "Lien copié",
        description: "L'URL de paiement a été copiée dans votre presse-papier",
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "Échec de la copie",
        description: "Impossible de copier l'URL. Veuillez utiliser le bouton d'ouverture directe.",
        variant: "destructive"
      });
    }
    
    document.body.removeChild(textArea);
  };

  return (
    <Alert className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <AlertTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2 mb-2">
        <RefreshCw className="h-4 w-4" />
        Problème d'affichage du paiement?
      </AlertTitle>
      
      <AlertDescription className="text-blue-600 dark:text-blue-400 text-sm">
        <p className="mb-3">
          La page de paiement ne s'affiche pas correctement? Utilisez l'une des options ci-dessous:
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={handleOpenDirectly}
            className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-3 h-auto"
          >
            <ExternalLink className="h-4 w-4" />
            Ouvrir la page de paiement
          </Button>
          
          <div className="flex items-center justify-between gap-2">
            <Button 
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-9 flex-1"
            >
              <Copy className="h-4 w-4" />
              Copier le lien
            </Button>
            
            {effectiveUrl && (
              <a 
                href={effectiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-9 px-3 flex items-center justify-center gap-1 text-blue-600 hover:underline border border-blue-200 dark:border-blue-800 rounded-md bg-white dark:bg-blue-900/20"
              >
                <ExternalLink className="h-4 w-4" />
                Nouvel onglet
              </a>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default MobilePaymentHelper;

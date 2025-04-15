
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
    
    // Notification visuelle à l'utilisateur
    toast({
      title: "Redirection en cours",
      description: "Vous allez être redirigé vers la page de paiement sécurisée...",
      duration: 3000,
    });
    
    // Ouvrir directement l'URL avec priorité maximale
    window.location.href = stripeUrl;
    
    // Déclencher la fonction de callback
    onHelp();
  };
  
  const copyToClipboard = () => {
    if (!stripeUrl) return;
    
    try {
      // Méthode moderne de copie
      navigator.clipboard.writeText(stripeUrl)
        .then(() => {
          toast({
            title: "Lien copié",
            description: "L'URL de paiement a été copiée dans votre presse-papier",
            duration: 3000,
          });
        })
        .catch((err) => {
          console.error("Erreur de copie moderne:", err);
          useAlternativeCopyMethod();
        });
    } catch (e) {
      console.error("Erreur lors de la copie:", e);
      useAlternativeCopyMethod();
    }
  };
  
  const useAlternativeCopyMethod = () => {
    // Méthode alternative de copie pour compatibilité maximale
    const textarea = document.createElement('textarea');
    textarea.value = stripeUrl || '';
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        toast({
          title: "Lien copié",
          description: "L'URL de paiement a été copiée dans votre presse-papier",
          duration: 3000,
        });
      } else {
        throw new Error("Copie échouée");
      }
    } catch (err) {
      console.error("La copie alternative a échoué:", err);
      toast({
        title: "Échec de la copie",
        description: "Impossible de copier l'URL. Veuillez utiliser le bouton d'ouverture directe.",
        variant: "destructive",
        duration: 4000,
      });
    }
    
    document.body.removeChild(textarea);
  };

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md shadow-sm">
      <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-300 mb-3">
        <h3 className="font-medium text-sm md:text-base">Problème d'affichage du paiement?</h3>
      </div>
      <p className="mb-4 text-xs md:text-sm text-blue-700 dark:text-blue-400">
        Si la page de paiement ne s'affiche pas correctement, utilisez l'une des options ci-dessous:
      </p>
      <div className="space-y-3">
        <Button 
          onClick={handleOpenDirectly}
          className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-3 h-auto text-sm md:text-base"
          size="sm"
        >
          <ExternalLink className="h-4 w-4" />
          Payer maintenant (méthode directe)
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
            Ouvrir dans un nouvel onglet
          </a>
        </div>
      </div>
    </div>
  );
};

export default MobilePaymentHelper;

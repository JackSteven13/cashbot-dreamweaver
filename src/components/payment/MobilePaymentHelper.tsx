
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface MobilePaymentHelperProps {
  isVisible: boolean;
  onHelp: () => void;
}

/**
 * Composant d'aide pour le paiement sur mobile
 * Affiche des instructions si l'utilisateur rencontre des difficultés
 */
const MobilePaymentHelper: React.FC<MobilePaymentHelperProps> = ({ 
  isVisible, 
  onHelp 
}) => {
  if (!isVisible) return null;
  
  return (
    <Alert className="mt-4 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-sm font-medium">
        Problème avec la redirection ?
      </AlertTitle>
      <AlertDescription className="text-xs mt-1">
        <p>Certains navigateurs mobiles peuvent bloquer les fenêtres popup.</p>
        <ul className="mt-2 ml-4 list-disc space-y-1">
          <li>Assurez-vous que les popups sont autorisés</li>
          <li>Si la page ne s'ouvre pas, cliquez sur le bouton ci-dessous</li>
          <li>Vous pouvez également essayer avec un autre navigateur</li>
        </ul>
        <Button 
          size="sm" 
          variant="outline" 
          className="mt-3 w-full bg-amber-100 dark:bg-amber-800/40 border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-700/60 text-amber-800 dark:text-amber-200"
          onClick={onHelp}
        >
          Ouvrir la page de paiement
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default MobilePaymentHelper;

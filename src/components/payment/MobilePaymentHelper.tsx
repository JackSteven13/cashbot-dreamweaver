
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/Button';

interface MobilePaymentHelperProps {
  isVisible: boolean;
  onHelp: () => void;
}

const MobilePaymentHelper: React.FC<MobilePaymentHelperProps> = ({ isVisible, onHelp }) => {
  if (!isVisible) return null;

  return (
    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
      <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-300">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="font-medium">Problème d'ouverture du paiement</h3>
      </div>
      <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
        Si la page de paiement ne s'ouvre pas automatiquement, veuillez cliquer sur le bouton ci-dessous.
      </p>
      <div className="mt-3">
        <Button 
          onClick={onHelp}
          className="bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          Ouvrir la page de paiement
        </Button>
      </div>
    </div>
  );
};

export default MobilePaymentHelper;

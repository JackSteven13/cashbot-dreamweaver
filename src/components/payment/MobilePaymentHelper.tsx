
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';

interface MobilePaymentHelperProps {
  isVisible: boolean;
  onHelp?: () => void;
}

/**
 * Composant d'aide contextuelle pour les paiements sur mobile
 * S'affiche automatiquement en cas de problème détecté
 */
const MobilePaymentHelper: React.FC<MobilePaymentHelperProps> = ({ 
  isVisible,
  onHelp
}) => {
  const isMobile = useIsMobile();
  
  if (!isVisible || !isMobile) return null;
  
  const showHelp = () => {
    toast({
      title: "Conseils pour le paiement mobile",
      description: "Assurez-vous que les popups sont autorisés dans votre navigateur. Si le paiement ne s'ouvre pas, essayez d'utiliser le bouton bleu pour réessayer ou changez de navigateur.",
      duration: 8000
    });
    
    if (onHelp) onHelp();
  };
  
  return (
    <button 
      onClick={showHelp}
      className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-200 hover:bg-amber-100 transition-colors mt-2"
    >
      <AlertCircle size={16} />
      <span>Besoin d'aide pour le paiement sur mobile ?</span>
    </button>
  );
};

export default MobilePaymentHelper;


import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink } from 'lucide-react';

interface StripeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const StripeConfirmationModal: React.FC<StripeConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Continuer vers le paiement sécurisé
          </DialogTitle>
          <DialogDescription>
            Vous allez être redirigé vers Stripe, notre partenaire de paiement sécurisé.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            En cliquant sur "Continuer", vous serez redirigé vers la plateforme de paiement Stripe pour finaliser votre abonnement en toute sécurité.
          </p>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3 mb-4">
            <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
              Vos données bancaires sont cryptées et sécurisées par Stripe.
            </p>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700 gap-2">
            <ExternalLink className="h-4 w-4" />
            Continuer vers le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StripeConfirmationModal;

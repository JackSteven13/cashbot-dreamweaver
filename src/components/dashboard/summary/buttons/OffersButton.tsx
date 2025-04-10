
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export interface OffersButtonProps {
  subscription: string;
}

export const OffersButton: React.FC<OffersButtonProps> = ({ subscription }) => {
  // Déterminer si le bouton doit être affiché différemment selon l'abonnement
  const isPremium = subscription !== 'freemium';
  
  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => window.location.href = '/offers'}
      className={`w-full ${
        isPremium ? 'border-indigo-600/20 text-indigo-400' : 'border-amber-500/20 text-amber-400'
      }`}
    >
      <Sparkles className="mr-2" size={16} />
      <span>{isPremium ? 'Gérer mon abonnement' : 'Découvrir nos offres'}</span>
    </Button>
  );
};

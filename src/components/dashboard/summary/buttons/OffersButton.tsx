
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface OffersButtonProps {
  subscription: string;
}

export const OffersButton: React.FC<OffersButtonProps> = ({ subscription }) => {
  const navigate = useNavigate();
  const isPremium = subscription !== 'freemium';
  
  const handleClick = () => {
    navigate('/offres');
  };
  
  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleClick}
      className={`w-full ${
        isPremium ? 'border-indigo-600/20 text-indigo-400' : 'border-cyan-500/20 text-cyan-400'
      }`}
    >
      <Sparkles className="mr-2" size={16} />
      <span>{isPremium ? 'Gérer mon abonnement' : 'Découvrir nos offres'}</span>
    </Button>
  );
};

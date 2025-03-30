
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface OffersButtonProps {
  limitReached: boolean;
}

export const OffersButton: React.FC<OffersButtonProps> = ({
  limitReached
}) => {
  return (
    <Link to="/offres" className="w-full block">
      <Button 
        size="lg" 
        className="w-full bg-gradient-to-r from-[#1A1F2C] to-[#1e3a5f] hover:from-[#1e3a5f] hover:to-[#1A1F2C] text-white shadow-md transition-all duration-300 transform hover:scale-105"
      >
        {limitReached ? "Augmenter votre limite" : "Voir les offres disponibles"}
      </Button>
    </Link>
  );
};

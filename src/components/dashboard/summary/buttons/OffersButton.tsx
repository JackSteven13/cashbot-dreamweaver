
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface OffersButtonProps {
  limitReached: boolean;
}

export const OffersButton: React.FC<OffersButtonProps> = ({
  limitReached
}) => {
  const isMobile = useIsMobile();
  
  return (
    <Link to="/offres" className="w-full block">
      <Button 
        className="w-full bg-gradient-to-r from-[#1A1F2C] to-[#1e3a5f] hover:from-[#1e3a5f] hover:to-[#1A1F2C] text-white shadow-md transition-all duration-300 py-1.5"
        size={isMobile ? "sm" : "default"}
      >
        {limitReached ? "Augmenter limite" : "Voir offres"}
      </Button>
    </Link>
  );
};

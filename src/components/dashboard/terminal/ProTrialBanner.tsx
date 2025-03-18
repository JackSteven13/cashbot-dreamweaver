
import React from 'react';

interface ProTrialBannerProps {
  onClick: () => void;
}

export const ProTrialBanner: React.FC<ProTrialBannerProps> = ({ onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer mb-4">
      <div className="bg-gradient-to-r from-blue-900/40 to-blue-700/20 p-3 rounded-lg border border-blue-700/50 hover:bg-blue-800/30 transition-colors">
        <p className="text-blue-300 text-xs font-medium text-center">
          ✨ CLIQUEZ ICI pour activer 48h d'accès Pro GRATUIT ✨
        </p>
      </div>
    </div>
  );
};

const ProTrialActive: React.FC = () => {
  // Function to display the remaining time of the Pro trial
  const displayRemainingProTime = () => {
    const expiryTime = parseInt(localStorage.getItem('proTrialExpires') || '0', 10);
    const now = Date.now();
    const remainingMs = expiryTime - now;
    
    if (remainingMs <= 0) return "Expiré";
    
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-900/40 to-blue-700/20 p-3 rounded-lg border border-blue-700/50 mb-4">
      <p className="text-blue-300 text-xs font-medium text-center">
        ✅ Accès Pro activé pour {displayRemainingProTime()} ! Profitez des fonctionnalités Pro
      </p>
    </div>
  );
};

// Attach the Active component to ProTrialBanner
ProTrialBanner.Active = ProTrialActive;


import React, { useEffect, useState } from 'react';

interface ProTrialBannerProps {
  onClick: () => void;
}

export const ProTrialBanner: React.FC<ProTrialBannerProps> = ({ onClick }) => {
  const [hasUsedProTrial, setHasUsedProTrial] = useState(false);
  
  useEffect(() => {
    // Vérifier si l'utilisateur a déjà utilisé l'offre Pro gratuite
    const proTrialUsed = localStorage.getItem('proTrialUsed');
    if (proTrialUsed === 'true') {
      setHasUsedProTrial(true);
    }
  }, []);
  
  // Ne pas afficher la bannière si l'utilisateur a déjà utilisé l'offre
  if (hasUsedProTrial) {
    return null;
  }

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

export const ProTrialActive: React.FC = () => {
  const [remainingTime, setRemainingTime] = useState<string>("");
  
  // Function to calculate and display the remaining time of the Pro trial
  const calculateRemainingProTime = () => {
    const expiryTime = parseInt(localStorage.getItem('proTrialExpires') || '0', 10);
    const now = Date.now();
    const remainingMs = expiryTime - now;
    
    if (remainingMs <= 0) return "Expiré";
    
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };
  
  useEffect(() => {
    // Set initial value
    setRemainingTime(calculateRemainingProTime());
    
    // Update every minute
    const intervalId = setInterval(() => {
      const newTime = calculateRemainingProTime();
      setRemainingTime(newTime);
      
      // If expired, remove the Pro trial status and reload
      if (newTime === "Expiré") {
        localStorage.removeItem('proTrialActive');
        localStorage.setItem('proTrialUsed', 'true');
        window.location.reload();
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-900/40 to-blue-700/20 p-3 rounded-lg border border-blue-700/50 mb-4">
      <p className="text-blue-300 text-xs font-medium text-center">
        ✅ Accès Pro activé pour {remainingTime} ! Profitez des fonctionnalités Pro
      </p>
    </div>
  );
};

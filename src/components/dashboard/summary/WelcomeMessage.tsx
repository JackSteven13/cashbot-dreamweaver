
import React, { useState, useEffect } from 'react';

interface WelcomeMessageProps {
  isNewUser: boolean;
  subscription?: string;
  dailySessionCount?: number;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ 
  isNewUser, 
  subscription,
  dailySessionCount 
}) => {
  // Utiliser localStorage pour garantir que le message n'apparaît qu'une seule fois
  const [shouldDisplay, setShouldDisplay] = useState(false);
  
  useEffect(() => {
    // Vérifie si c'est un nouvel utilisateur ET si on n'a pas déjà montré le message
    const welcomeShown = localStorage.getItem('welcomeMessageShown');
    if (isNewUser && !welcomeShown) {
      setShouldDisplay(true);
      // Marquer que le message a été affiché
      localStorage.setItem('welcomeMessageShown', 'true');
    } else {
      setShouldDisplay(false);
    }
  }, [isNewUser]);
  
  if (!shouldDisplay) return null;
  
  return (
    <div className="bg-green-50 text-green-800 p-4 mb-6 rounded-md border border-green-200">
      <h3 className="font-medium">🎉 Bienvenue sur Stream Genius !</h3>
      <p className="text-sm mt-1">Votre compte a été créé avec succès. Notre technologie avancée va maintenant travailler pour vous.</p>
    </div>
  );
};

export default WelcomeMessage;

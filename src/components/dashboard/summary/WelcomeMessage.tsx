
import React from 'react';

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
  if (!isNewUser) return null;
  
  return (
    <div className="bg-green-50 text-green-800 p-4 mb-6 rounded-md border border-green-200">
      <h3 className="font-medium">🎉 Bienvenue sur Stream Genius !</h3>
      <p className="text-sm mt-1">Votre compte a été créé avec succès. Notre technologie avancée va maintenant travailler pour vous.</p>
    </div>
  );
};

export default WelcomeMessage;

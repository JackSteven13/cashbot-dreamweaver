
import React from 'react';
import { NewUserGuide } from './NewUserGuide';

interface GuideProps {
  isNewUser?: boolean;
  subscription?: string;
  remainingSessions?: number;
  referralCount?: number;
}

export const Guide: React.FC<GuideProps> = ({ 
  isNewUser = false,
  subscription,
  remainingSessions,
  referralCount
}) => {
  // Vérifier si l'utilisateur est réellement nouveau (en consultant également localStorage)
  const welcomeShown = localStorage.getItem('welcomeMessageShown') === 'true';
  
  // Afficher le guide spécial uniquement pour les nouveaux utilisateurs qui n'ont pas déjà vu le message
  if (isNewUser && !welcomeShown) {
    return <NewUserGuide />;
  }

  // Pour les utilisateurs existants, ne pas afficher de guide spécial
  return null;
};

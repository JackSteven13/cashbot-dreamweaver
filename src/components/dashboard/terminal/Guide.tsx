
import React from 'react';
import { NewUserGuide } from './NewUserGuide';

interface GuideProps {
  isNewUser?: boolean;
}

export const Guide: React.FC<GuideProps> = ({ isNewUser = false }) => {
  // Afficher le guide spécial uniquement pour les nouveaux utilisateurs
  if (isNewUser) {
    return <NewUserGuide />;
  }

  // Pour les utilisateurs existants, ne pas afficher de guide spécial
  return null;
};

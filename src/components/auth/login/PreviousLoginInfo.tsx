
import React from 'react';

interface PreviousLoginInfoProps {
  lastLoggedInEmail: string | null;
}

const PreviousLoginInfo = ({ lastLoggedInEmail }: PreviousLoginInfoProps) => {
  if (!lastLoggedInEmail) {
    return null;
  }
  
  return (
    <div className="mb-4 p-3 bg-blue-900/20 rounded-lg">
      <p className="text-sm text-blue-300">
        Dernière connexion avec: <strong>{lastLoggedInEmail}</strong>
      </p>
      <p className="text-xs text-blue-300/80 mt-1">
        Veuillez saisir vos identifiants pour vous connecter.
      </p>
    </div>
  );
};

export default PreviousLoginInfo;

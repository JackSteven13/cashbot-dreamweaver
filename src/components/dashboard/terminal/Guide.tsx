
import React from 'react';

interface GuideProps {
  isNewUser?: boolean;
}

export const Guide: React.FC<GuideProps> = ({ isNewUser = false }) => {
  return (
    <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-800/40">
      <h3 className="text-blue-300 mb-2 font-medium flex items-center">
        <span role="img" aria-label="fire" className="mr-2">🔥</span> 
        Guide rapide pour démarrer :
      </h3>
      <ol className="list-decimal pl-6 space-y-2 text-blue-200">
        <li>Lancez votre premier boost manuel gratuit</li>
        <li>
          Partagez votre lien de parrainage pour commencer à gagner des commissions
        </li>
      </ol>
    </div>
  );
};

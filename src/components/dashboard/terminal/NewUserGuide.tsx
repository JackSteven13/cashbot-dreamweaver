
import React from 'react';

export const NewUserGuide: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-green-900/30 to-green-800/20 p-3 rounded-lg border border-green-800/50 mb-4">
      <p className="text-green-300 text-xs font-medium">
        🔥 Guide rapide pour démarrer :
      </p>
      <ol className="list-decimal ml-4 mt-1 text-green-200 text-xs space-y-1">
        <li>Lancez votre premier boost manuel gratuit</li>
        <li>Partagez votre lien de parrainage pour commencer à gagner des commissions</li>
        <li>Consultez les offres premium pour augmenter vos limites de gains</li>
      </ol>
    </div>
  );
};

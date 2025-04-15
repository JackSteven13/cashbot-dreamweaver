
import React from 'react';
import { Loader2 } from 'lucide-react';

const PaymentLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23] px-4">
      <div className="relative glass-panel p-6 sm:p-8 rounded-xl shadow-lg text-center max-w-md w-full">
        {/* Effet de lueur amélioré */}
        <div className="absolute inset-0 rounded-xl bg-blue-500/10 blur-xl animate-pulse"></div>
        <div className="absolute inset-0 rounded-xl bg-indigo-400/5 blur-lg animate-pulse" style={{animationDelay: '0.5s'}}></div>
        
        <div className="relative z-10">
          <Loader2 className="h-12 w-12 sm:h-14 sm:w-14 animate-spin mx-auto text-primary" />
          
          <h2 className="mt-5 sm:mt-6 text-lg sm:text-xl font-semibold text-white">Préparation de votre paiement</h2>
          
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-300 max-w-sm mx-auto">
            Nous sécurisons votre transaction. Vous serez redirigé vers la page de paiement dans quelques instants...
          </p>
          
          <div className="mt-5 sm:mt-6 h-2 w-36 sm:w-48 mx-auto bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary animate-pulse rounded-full relative overflow-hidden"
              style={{width: '60%'}}
            >
              {/* Animation de progression */}
              <div className="absolute inset-0 bg-white/20 animate-move-lr"></div>
            </div>
          </div>
          
          <p className="mt-2 text-xs text-gray-400">
            Si vous n'êtes pas redirigé automatiquement, des options supplémentaires apparaîtront.
          </p>
        </div>
      </div>
      
      {/* Styles globaux pour les animations */}
      <style jsx global>{`
        @keyframes move-lr {
          0% { transform: translateX(-100%); }
          50%, 100% { transform: translateX(100%); }
        }
        
        .animate-move-lr {
          animation: move-lr 2s infinite;
        }
        
        .glass-panel {
          background: rgba(24, 24, 47, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default PaymentLoading;

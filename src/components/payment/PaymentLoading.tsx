
import React from 'react';
import { Loader2 } from 'lucide-react';

const PaymentLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0f0f23]">
      <div className="relative glass-panel p-8 rounded-xl shadow-lg text-center">
        {/* Effet de lueur */}
        <div className="absolute inset-0 rounded-xl bg-blue-500/10 blur-xl"></div>
        
        <div className="relative z-10">
          <Loader2 className="h-14 w-14 animate-spin mx-auto text-primary" />
          
          <h2 className="mt-6 text-xl font-semibold">Préparation de votre paiement</h2>
          
          <p className="mt-3 text-muted-foreground max-w-sm">
            Nous sécurisons votre transaction. Vous serez redirigé vers la page de paiement dans quelques instants...
          </p>
          
          <div className="mt-6 h-2 w-48 mx-auto bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary animate-pulse rounded-full" 
              style={{width: '60%'}}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentLoading;

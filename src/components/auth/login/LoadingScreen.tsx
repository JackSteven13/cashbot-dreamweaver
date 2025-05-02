
import React from 'react';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

const LoadingScreen = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f23]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center glass-panel p-8 rounded-xl shadow-lg">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-lg">Vérification de votre session...</p>
          <p className="mt-2 text-sm text-muted-foreground">Veuillez patienter un instant</p>
        </div>
      </main>
    </div>
  );
};

export default LoadingScreen;

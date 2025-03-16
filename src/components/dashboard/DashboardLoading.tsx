
import { FC } from 'react';
import { Loader2 } from 'lucide-react';

const DashboardLoading: FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23]">
      <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
      <div className="text-center">
        <p className="text-blue-300 mb-2">Chargement de votre tableau de bord...</p>
        <p className="text-xs text-blue-200">Veuillez patienter...</p>
      </div>
    </div>
  );
};

export default DashboardLoading;


import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface DashboardErrorProps {
  errorType: 'auth' | 'data';
  onRefresh?: () => void;
}

const DashboardError: FC<DashboardErrorProps> = ({ errorType, onRefresh }) => {
  const navigate = useNavigate();

  if (errorType === 'auth') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23] text-white">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-4">Problème d'authentification</h2>
          <p className="mb-6">Nous n'arrivons pas à vérifier votre session.</p>
          <Button 
            onClick={() => navigate('/login', { replace: true })}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Retourner à la page de connexion
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23] text-white">
      <div className="text-center">
        <p className="mb-2">Chargement des données utilisateur...</p>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 justify-center">
          {onRefresh && (
            <Button 
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Rafraîchir les données
            </Button>
          )}
          <Button 
            onClick={() => navigate('/login', { replace: true })}
            className="px-4 py-2 bg-transparent border border-blue-600 rounded hover:bg-blue-900/20 transition-colors"
          >
            Retourner à la page de connexion
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardError;

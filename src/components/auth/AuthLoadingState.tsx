
import { Loader2 } from 'lucide-react';

interface AuthLoadingStateProps {
  loadingMessage?: string;
}

const AuthLoadingState = ({ 
  loadingMessage = "Vérification de session..." 
}: AuthLoadingStateProps) => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">{loadingMessage}</p>
      </div>
    </div>
  );
};

export default AuthLoadingState;

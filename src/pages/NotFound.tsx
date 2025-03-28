
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f23] text-white">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-4xl font-bold mb-4">Page non trouvée</h1>
        <p className="text-xl text-gray-300 mb-6">
          La page que vous recherchez n'existe pas ou une erreur s'est produite.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="default" 
            onClick={handleBackToHome}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft size={16} />
            Retour à l'accueil
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="flex items-center gap-2 border-blue-600 text-blue-300 hover:bg-blue-900/20"
          >
            <RefreshCw size={16} />
            Rafraîchir la page
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

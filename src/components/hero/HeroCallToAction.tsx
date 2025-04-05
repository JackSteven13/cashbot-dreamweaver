
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const HeroCallToAction = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="w-full max-w-xl glass-panel p-4 rounded-xl animate-scale-in">
      <Link to="/register" className="block w-full">
        <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors">
          <span className={isMobile ? "text-base" : "text-lg"}>Démarrer maintenant</span>
          <ArrowRight size={isMobile ? 16 : 18} className="ml-2" />
        </button>
      </Link>
    </div>
  );
};

export default HeroCallToAction;

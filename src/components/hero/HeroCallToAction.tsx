
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

const HeroCallToAction = () => {
  return (
    <div className="w-full max-w-lg glass-panel p-4 sm:p-6 rounded-xl animate-scale-in">
      <Link 
        to="/login" 
        className="block w-full transition-transform duration-300 hover:scale-110"
      >
        <Button 
          variant="default" 
          size="lg" 
          className="w-full group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center">
            Démarrer maintenant
            <ArrowRight size={18} className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
          <span className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300"></span>
        </Button>
      </Link>
    </div>
  );
};

export default HeroCallToAction;

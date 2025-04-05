
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../Button';

const HeroCallToAction = () => {
  return (
    <div className="w-full max-w-lg glass-panel p-4 sm:p-6 rounded-xl animate-scale-in">
      <Link to="/login" className="block w-full transition-transform duration-300 hover:scale-105">
        <Button 
          type="button" 
          size="lg" 
          fullWidth 
          className="group bg-green-500 hover:bg-green-600 text-white font-semibold text-lg"
        >
          Démarrer maintenant
          <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </Link>
    </div>
  );
};

export default HeroCallToAction;

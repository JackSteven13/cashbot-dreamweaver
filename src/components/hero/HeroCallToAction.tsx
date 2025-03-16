
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../Button';

const HeroCallToAction = () => {
  return (
    <div className="w-full max-w-lg glass-panel p-4 sm:p-6 rounded-xl animate-scale-in">
      <Link to="/login" className="block w-full">
        <Button type="button" size="lg" fullWidth className="group">
          Démarrer maintenant
          <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </Link>
    </div>
  );
};

export default HeroCallToAction;


import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackToHomeLink = () => {
  return (
    <div className="mt-8 text-center">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
        <ArrowLeft size={14} className="mr-1" />
        Retour à l'accueil
      </Link>
    </div>
  );
};

export default BackToHomeLink;

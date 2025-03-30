
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsHeader = () => {
  return (
    <>
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'accueil
        </Link>
      </div>
      
      <div className="mb-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">CONDITIONS GÉNÉRALES D'UTILISATION</h1>
        <p className="text-sm text-muted-foreground mb-6">Dernière mise à jour: 1 Juillet 2023</p>
      </div>
    </>
  );
};

export default TermsHeader;

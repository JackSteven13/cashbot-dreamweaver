
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border/30 bg-gradient-to-b from-slate-900 to-black text-white py-8 md:py-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo et copyright */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <Link to="/" className="text-2xl font-semibold tracking-tight hover:opacity-90 transition-opacity">
              Stream genius
            </Link>
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Tous droits réservés</p>
          </div>
          
          {/* Liens importants */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <h3 className="text-lg font-medium mb-1">Liens utiles</h3>
            <div className="flex flex-col space-y-2">
              <Link to="/terms" className="text-sm text-gray-300 hover:text-white transition-colors">
                Conditions d'utilisation
              </Link>
              {/* Suppression du lien de politique de confidentialité */}
            </div>
          </div>
          
          {/* Contact et réseaux sociaux */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <h3 className="text-lg font-medium mb-1">Contact</h3>
            <Link to="/contact" className="text-sm text-gray-300 hover:text-white transition-colors">
              Nous contacter
            </Link>
            <div className="flex space-x-4 mt-2">
              {/* Icônes de réseaux sociaux peuvent être ajoutées ici */}
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-800">
          <p className="text-xs text-center text-gray-500">
            Stream genius - Plateforme d'intelligence artificielle pour l'analyse publicitaire
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

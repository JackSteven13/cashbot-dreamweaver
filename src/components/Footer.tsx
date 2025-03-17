
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="text-xl font-semibold">
              CashBot
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              © {currentYear} CashBot. Tous droits réservés.
            </p>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-primary">
              Accueil
            </Link>
            <Link to="/offres" className="text-gray-600 dark:text-gray-300 hover:text-primary">
              Offres
            </Link>
            <Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-primary">
              À propos
            </Link>
            <Link to="/cgu" className="text-gray-600 dark:text-gray-300 hover:text-primary">
              CGU
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Button from './Button';
import DarkModeToggle from './DarkModeToggle';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center">
          <Link 
            to="/" 
            className="text-2xl font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            CashBot
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex space-x-6">
              <Link 
                to="/" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === '/' ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                Accueil
              </Link>
              <Link 
                to="/offres" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === '/offres' ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                Offres
              </Link>
              <Link 
                to="/features" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === '/features' ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                Fonctionnalités
              </Link>
              <Link 
                to="/pricing" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === '/pricing' ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                Tarifs
              </Link>
              <Link 
                to="/about" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === '/about' ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                À propos
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <DarkModeToggle />
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Connexion
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">
                  S'inscrire
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <DarkModeToggle />
            <button
              className="text-foreground p-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Full Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-background z-40 pt-20 pb-6 px-4 overflow-y-auto">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className="px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Accueil
              </Link>
              <Link
                to="/offres"
                className="px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Offres
              </Link>
              <Link
                to="/features"
                className="px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Fonctionnalités
              </Link>
              <Link
                to="/pricing"
                className="px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tarifs
              </Link>
              <Link
                to="/about"
                className="px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                À propos
              </Link>
              <div className="pt-4 flex flex-col space-y-3 border-t border-border mt-2">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" fullWidth>
                    Connexion
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button fullWidth>
                    S'inscrire
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;


import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Button from './Button';
import DarkModeToggle from './DarkModeToggle';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm'
          : 'py-8 md:py-10 bg-transparent'
      }`}
      style={{ zIndex: 100 }}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center">
          <Link 
            to="/" 
            className="text-2xl font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            Stream genius
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

          {/* Mobile Menu using Sheet component from shadcn/ui - Fixed styling issues */}
          <div className="md:hidden flex items-center gap-2">
            <DarkModeToggle />
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="text-foreground p-2 rounded-lg hover:bg-secondary transition-colors focus:outline-none"
                  aria-label="Ouvrir le menu"
                  onClick={() => setIsMenuOpen(true)}
                >
                  <Menu size={24} />
                </button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[85%] sm:w-[350px] pt-10 z-[150] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-lg"
              >
                <SheetHeader>
                  <SheetTitle className="text-left text-xl font-bold mb-6">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4">
                  <SheetClose asChild>
                    <Link
                      to="/"
                      className="px-4 py-3 text-base font-medium rounded-lg hover:bg-secondary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Accueil
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/offres"
                      className="px-4 py-3 text-base font-medium rounded-lg hover:bg-secondary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Offres
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/about"
                      className="px-4 py-3 text-base font-medium rounded-lg hover:bg-secondary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      À propos
                    </Link>
                  </SheetClose>
                  <div className="pt-6 flex flex-col space-y-4 border-t border-gray-200 dark:border-gray-700 mt-2">
                    <SheetClose asChild>
                      <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" fullWidth className="py-2.5">
                          Connexion
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                        <Button fullWidth className="py-2.5">
                          S'inscrire
                        </Button>
                      </Link>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

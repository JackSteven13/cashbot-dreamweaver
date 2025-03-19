
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import Button from './Button';
import DarkModeToggle from './DarkModeToggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { logoutUser } from '@/utils/auth/index';
import { toast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    toast({
      title: "Déconnexion en cours",
      description: "Veuillez patienter...",
    });
    
    const success = await logoutUser();
    
    if (success) {
      // Redirect to home page after logout
      navigate('/', { replace: true });
    }
  };

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
              {isLoggedIn ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm">
                      Tableau de bord
                    </Button>
                  </Link>
                  <Button size="sm" onClick={handleLogout}>
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu using Sheet component from shadcn/ui */}
          <div className="md:hidden flex items-center gap-2">
            <DarkModeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="text-foreground p-2 rounded-lg hover:bg-secondary transition-colors"
                  aria-label="Ouvrir le menu"
                >
                  <Menu size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85%] sm:w-[350px] pt-16">
                <SheetHeader>
                  <SheetTitle className="text-left text-xl font-bold mb-4">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4">
                  <SheetClose asChild>
                    <Link
                      to="/"
                      className="px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary"
                    >
                      Accueil
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/offres"
                      className="px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary"
                    >
                      Offres
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/about"
                      className="px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary"
                    >
                      À propos
                    </Link>
                  </SheetClose>
                  <div className="pt-4 flex flex-col space-y-3 border-t border-border mt-2">
                    {isLoggedIn ? (
                      <>
                        <SheetClose asChild>
                          <Link to="/dashboard">
                            <Button variant="outline" fullWidth>
                              Tableau de bord
                            </Button>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button fullWidth onClick={handleLogout}>
                            <LogOut size={18} className="mr-2" />
                            Déconnexion
                          </Button>
                        </SheetClose>
                      </>
                    ) : (
                      <>
                        <SheetClose asChild>
                          <Link to="/login">
                            <Button variant="outline" fullWidth>
                              Connexion
                            </Button>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link to="/register">
                            <Button fullWidth>
                              S'inscrire
                            </Button>
                          </Link>
                        </SheetClose>
                      </>
                    )}
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

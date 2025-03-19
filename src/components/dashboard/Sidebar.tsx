
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  History, 
  LineChart, 
  LogOut, 
  Settings, 
  Share2,
  Home,
  LayoutDashboard
} from 'lucide-react';
import Button from '@/components/Button';
import { logoutUser } from '@/utils/auth/index';
import { toast } from '@/components/ui/use-toast';

interface SidebarProps {
  selectedNavItem: string;
  setSelectedNavItem: (item: string) => void;
}

const Sidebar = ({ selectedNavItem, setSelectedNavItem }: SidebarProps) => {
  const navigate = useNavigate();
  
  // Updated function to handle logout properly
  const handleLogout = async () => {
    // Show loading toast
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
  
  // Function to handle both setting the selected item and navigation
  const handleNavigation = (id: string, path: string = '') => {
    setSelectedNavItem(id);
    if (path) {
      navigate(path);
    }
  };
  
  return (
    <div className="hidden md:flex w-64 flex-col bg-gradient-to-b from-blue-900 to-indigo-950 border-r border-indigo-800/30">
      <div className="p-6 flex items-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mr-3">
          <span className="text-white font-bold text-xl">C</span>
        </div>
        <Link to="/" className="text-2xl font-bold tracking-tight text-white">
          CashBot
        </Link>
      </div>
      
      <div className="flex-1 px-3 py-4 space-y-2">
        <NavItem 
          icon={<LayoutDashboard size={18} className="mr-3" />}
          label="Tableau de bord"
          id="dashboard"
          selectedNavItem={selectedNavItem}
          onClick={() => handleNavigation("dashboard")}
        />
        <NavItem 
          icon={<History size={18} className="mr-3" />}
          label="Historique"
          id="transactions"
          selectedNavItem={selectedNavItem}
          onClick={() => handleNavigation("transactions")}
        />
        <NavItem 
          icon={<LineChart size={18} className="mr-3" />}
          label="Analyses"
          id="analytics"
          selectedNavItem={selectedNavItem}
          onClick={() => handleNavigation("analytics")}
        />
        <NavItem 
          icon={<CreditCard size={18} className="mr-3" />}
          label="Portefeuille"
          id="wallet"
          selectedNavItem={selectedNavItem}
          onClick={() => handleNavigation("wallet")}
        />
        <NavItem 
          icon={<Share2 size={18} className="mr-3" />}
          label="Parrainage"
          id="referrals"
          selectedNavItem={selectedNavItem}
          onClick={() => handleNavigation("referrals")}
        />
        <NavItem 
          icon={<Settings size={18} className="mr-3" />}
          label="Paramètres"
          id="settings"
          selectedNavItem={selectedNavItem}
          onClick={() => handleNavigation("settings")}
        />
      </div>
      
      <div className="p-4 mt-auto space-y-2">
        <Button 
          variant="outline" 
          fullWidth 
          className="justify-start border-indigo-600/50 text-white hover:bg-indigo-800/50"
          onClick={() => {
            // Navigate to the home page
            navigate('/');
          }}
        >
          <Home size={18} className="mr-3" />
          Retour à l'accueil
        </Button>
        <Button 
          variant="outline" 
          fullWidth 
          className="justify-start border-indigo-600/50 text-white hover:bg-indigo-800/50"
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-3" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  id: string;
  selectedNavItem: string;
  onClick: () => void;
}

const NavItem = ({ icon, label, id, selectedNavItem, onClick }: NavItemProps) => (
  <button
    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
      selectedNavItem === id 
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
        : 'hover:bg-blue-800/40 text-blue-100'
    }`}
    onClick={onClick}
  >
    {icon}
    {label}
  </button>
);

export default Sidebar;

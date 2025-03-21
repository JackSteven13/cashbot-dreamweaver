import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  History, 
  LineChart, 
  LogOut, 
  Settings, 
  Share2,
  Home
} from 'lucide-react';
import Button from '@/components/Button';

interface SidebarProps {
  selectedNavItem: string;
  setSelectedNavItem: (item: string) => void;
}

const Sidebar = ({ selectedNavItem, setSelectedNavItem }: SidebarProps) => {
  const navigate = useNavigate();
  
  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('user_registered');
    localStorage.removeItem('username');
    localStorage.removeItem('user_balance');
    localStorage.removeItem('daily_session_count');
    localStorage.removeItem('subscription');
    navigate('/');
  };
  
  // Function to handle both setting the selected item and navigation
  const handleNavigation = (id: string, path: string) => {
    setSelectedNavItem(id);
    navigate(path);
  };
  
  return (
    <div className="hidden md:flex w-64 flex-col bg-[#1e3a5f] border-r border-[#2d5f8a]/30">
      <div className="p-6">
        <Link to="/" className="text-2xl font-semibold tracking-tight text-white">
          CashBot
        </Link>
      </div>
      
      <div className="flex-1 px-3 py-4 space-y-1">
        
      </div>
      
      <div className="p-4 mt-auto space-y-2">
        <Button 
          variant="outline" 
          fullWidth 
          className="justify-start border-[#486581] text-white hover:bg-[#334e68]/50"
          onClick={() => {
            navigate('/');
          }}
        >
          <Home size={18} className="mr-3" />
          Retour à l'accueil
        </Button>
        <Button 
          variant="outline" 
          fullWidth 
          className="justify-start border-[#486581] text-white hover:bg-[#334e68]/50"
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-3" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;

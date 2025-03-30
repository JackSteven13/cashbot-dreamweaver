
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Home
} from 'lucide-react';
import Button from '@/components/Button';
import { forceSignOut } from "@/utils/auth/sessionUtils";

interface SidebarProps {
  selectedNavItem: string;
  setSelectedNavItem: (item: string) => void;
}

const Sidebar = ({ selectedNavItem, setSelectedNavItem }: SidebarProps) => {
  const navigate = useNavigate();
  
  // Function to handle logout with proper cleanup
  const handleLogout = async () => {
    try {
      // Use forceSignOut to completely clear all auth data
      await forceSignOut();
      
      // Clear any additional stored user data
      localStorage.removeItem('user_registered');
      localStorage.removeItem('username');
      localStorage.removeItem('user_balance');
      localStorage.removeItem('daily_session_count');
      localStorage.removeItem('subscription');
      
      // Navigate to login page instead of home page
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Error during logout:", error);
      // If error during logout, still try to navigate away
      navigate('/login', { replace: true });
    }
  };
  
  return (
    <div className="hidden md:flex w-64 flex-col bg-[#1e3a5f] border-r border-[#2d5f8a]/30">
      <div className="p-6 flex items-center">
        <img 
          src="/lovable-uploads/b9f26934-070a-463e-bfe8-438fa9773cf7.png" 
          alt="Stream Genius Logo"
          className="h-10 mr-2" 
        />
        <Link to="/" className="text-2xl font-semibold tracking-tight text-white">
          Stream genius
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


import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Home,
  BarChart3,
  Users,
} from 'lucide-react';
import Button from '@/components/Button';
import { forceSignOut } from "@/utils/auth/sessionUtils";
import { cn } from '@/lib/utils';

interface SidebarProps {
  selectedNavItem: string;
  setSelectedNavItem: (item: string) => void;
}

const Sidebar = ({ selectedNavItem, setSelectedNavItem }: SidebarProps) => {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState('');
  
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

  // Ajout d'un élément de menu pour les parrainages
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3, path: '/dashboard' },
    { id: 'referrals', label: 'Parrainages', icon: Users, path: '/dashboard/referrals' },
  ];
  
  return (
    <div className="hidden md:flex w-64 flex-col bg-gradient-to-b from-[#1A1F2C] to-[#1e3a5f] border-r border-[#2d5f8a]/30">
      <div className="p-6 flex items-center justify-center">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/logo.png" alt="Stream Genius" className="h-8 w-8" />
          <span className="text-2xl font-semibold tracking-tight text-white">Stream genius</span>
        </Link>
      </div>
      
      <div className="flex-1 px-3 py-6 space-y-2">
        {menuItems.map(item => (
          <Button 
            key={item.id}
            variant="ghost" 
            fullWidth 
            className={cn(
              "justify-start border-transparent text-white py-3 mb-1 relative overflow-hidden group transition-all duration-300",
              selectedNavItem === item.id ? 
                "bg-[#9b87f5]/20 text-white font-medium" : 
                "hover:bg-[#9b87f5]/10 text-white/80"
            )}
            onClick={() => {
              setSelectedNavItem(item.id);
              navigate(item.path);
            }}
            onMouseEnter={() => setIsHovering(item.id)}
            onMouseLeave={() => setIsHovering('')}
          >
            <item.icon 
              size={18} 
              className={cn(
                "mr-3 transition-all duration-300",
                isHovering === item.id && "text-[#9b87f5] animate-pulse"
              )} 
            />
            {item.label}
            {selectedNavItem === item.id && (
              <span className="absolute inset-y-0 left-0 w-1 bg-[#9b87f5] rounded-tr-md rounded-br-md animate-pulse" />
            )}
          </Button>
        ))}
      </div>
      
      <div className="p-4 mt-auto space-y-2">
        <Button 
          variant="ghost" 
          fullWidth 
          className="justify-start border-transparent text-white hover:bg-[#9b87f5]/10 group transition-colors"
          onClick={() => {
            navigate('/');
          }}
        >
          <Home size={18} className="mr-3 group-hover:text-[#9b87f5] transition-colors" />
          Retour à l'accueil
        </Button>
        <Button 
          variant="ghost" 
          fullWidth 
          className="justify-start border-transparent text-white hover:bg-[#9b87f5]/10 group transition-colors"
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-3 group-hover:text-[#9b87f5] transition-colors" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;


import React from 'react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Home,
  Settings,
  BarChart,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  username: string;
  selectedNavItem: string;
  setSelectedNavItem: (item: string) => void;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  username,
  selectedNavItem,
  setSelectedNavItem,
  onLogout,
}) => {
  const isMobile = useIsMobile();

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home, path: '/dashboard' },
    { id: 'analytics', label: 'Statistiques', icon: BarChart, path: '/analytics' },
    { id: 'settings', label: 'Paramètres', icon: Settings, path: '/settings' },
    { id: 'help', label: 'Aide', icon: HelpCircle, path: '/help' },
  ];

  return (
    <div className="hidden md:flex flex-col bg-gray-900 text-gray-100 w-64 p-3 h-full">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Xavier</h2>
          {isMobile && (
            <button className="p-2">
              <ChevronRight size={24} />
            </button>
          )}
        </div>
        <div className="flex flex-col space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "flex items-center space-x-3 rounded-md px-3 py-2 transition-colors",
                selectedNavItem === item.id
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              )}
              onClick={() => setSelectedNavItem(item.id)}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-auto space-y-3">
        <div className="flex items-center space-x-3 rounded-md px-3 py-2 text-gray-300">
          <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-xl font-semibold">
            {username ? username[0]?.toUpperCase() : "U"}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{username}</span>
            <span className="text-xs text-gray-500">Connecté</span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-gray-100"
        >
          <LogOut className="h-5 w-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

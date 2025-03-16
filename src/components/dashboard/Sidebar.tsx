
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  GaugeCircle, 
  History, 
  Home,
  LineChart, 
  LogOut, 
  Package, 
  Settings, 
  Share2
} from 'lucide-react';
import Button from '@/components/Button';

interface SidebarProps {
  selectedNavItem: string;
  setSelectedNavItem: (item: string) => void;
}

const Sidebar = ({ selectedNavItem, setSelectedNavItem }: SidebarProps) => {
  return (
    <div className="hidden md:flex w-64 flex-col bg-[#1e3a5f] border-r border-[#2d5f8a]/30">
      <div className="p-6">
        <Link to="/" className="text-2xl font-semibold tracking-tight text-white">
          CashBot
        </Link>
      </div>
      
      <div className="flex-1 px-3 py-4 space-y-1">
        <NavItem 
          icon={<GaugeCircle size={18} className="mr-3" />}
          label="Tableau de bord"
          id="dashboard"
          selectedNavItem={selectedNavItem}
          setSelectedNavItem={setSelectedNavItem}
        />
        <NavItem 
          icon={<History size={18} className="mr-3" />}
          label="Historique"
          id="transactions"
          selectedNavItem={selectedNavItem}
          setSelectedNavItem={setSelectedNavItem}
        />
        <NavItem 
          icon={<LineChart size={18} className="mr-3" />}
          label="Analyses"
          id="analytics"
          selectedNavItem={selectedNavItem}
          setSelectedNavItem={setSelectedNavItem}
        />
        <NavItem 
          icon={<CreditCard size={18} className="mr-3" />}
          label="Portefeuille"
          id="wallet"
          selectedNavItem={selectedNavItem}
          setSelectedNavItem={setSelectedNavItem}
        />
        <NavItem 
          icon={<Share2 size={18} className="mr-3" />}
          label="Parrainage"
          id="referrals"
          selectedNavItem={selectedNavItem}
          setSelectedNavItem={setSelectedNavItem}
        />
        <NavItem 
          icon={<Settings size={18} className="mr-3" />}
          label="Paramètres"
          id="settings"
          selectedNavItem={selectedNavItem}
          setSelectedNavItem={setSelectedNavItem}
        />
        
        <div className="pt-6 mt-4 border-t border-[#2d5f8a]/30">
          <h3 className="px-3 mb-2 text-xs font-semibold text-blue-100/70 uppercase">Navigation</h3>
          <Link to="/" className="flex items-center px-3 py-2 text-sm rounded-lg text-blue-100 hover:bg-[#334e68]/50 transition-colors">
            <Home size={18} className="mr-3" />
            Page d'accueil
          </Link>
          <Link to="/offres" className="flex items-center px-3 py-2 text-sm rounded-lg text-blue-100 hover:bg-[#334e68]/50 transition-colors">
            <Package size={18} className="mr-3" />
            Nos offres
          </Link>
        </div>
      </div>
      
      <div className="p-4 mt-auto">
        <Link to="/logout">
          <Button variant="outline" fullWidth className="justify-start border-[#486581] text-white hover:bg-[#334e68]/50">
            <LogOut size={18} className="mr-3" />
            Déconnexion
          </Button>
        </Link>
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  id: string;
  selectedNavItem: string;
  setSelectedNavItem: (item: string) => void;
}

const NavItem = ({ icon, label, id, selectedNavItem, setSelectedNavItem }: NavItemProps) => (
  <button
    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
      selectedNavItem === id 
        ? 'bg-[#2d5f8a] text-white' 
        : 'hover:bg-[#334e68]/50 text-blue-100'
    }`}
    onClick={() => setSelectedNavItem(id)}
  >
    {icon}
    {label}
  </button>
);

export default Sidebar;

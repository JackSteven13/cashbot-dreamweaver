
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  GaugeCircle, 
  History, 
  LineChart, 
  LogOut, 
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
    <div className="hidden md:flex w-64 flex-col bg-[#1a1a2f] border-r border-[#4CAF50]">
      <div className="p-6">
        <Link to="/" className="text-2xl font-semibold tracking-tight text-[#4CAF50]">
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
      </div>
      
      <div className="p-4 mt-auto">
        <Link to="/logout">
          <Button variant="outline" fullWidth className="justify-start border-[#4CAF50] text-[#00ff00] hover:bg-[#2a2a4f]">
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
        ? 'bg-[#4CAF50] text-black' 
        : 'hover:bg-[#2a2a4f] text-[#00ff00]'
    }`}
    onClick={() => setSelectedNavItem(id)}
  >
    {icon}
    {label}
  </button>
);

export default Sidebar;

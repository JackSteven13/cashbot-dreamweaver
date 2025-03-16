
import React from 'react';
import { UserCircle } from 'lucide-react';

interface DashboardHeaderProps {
  username: string;
  subscription: string;
}

const DashboardHeader = ({ username, subscription }: DashboardHeaderProps) => {
  return (
    <header className="sticky top-0 z-10 bg-[#1e3a5f] border-b border-[#2d5f8a]/30">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-semibold text-white">Tableau de bord</h1>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-right hidden sm:block">
            <p className="font-medium text-white">Bonjour, {username}</p>
            <p className="text-blue-200">Abonnement {subscription}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#334e68] flex items-center justify-center text-white">
            <UserCircle size={24} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

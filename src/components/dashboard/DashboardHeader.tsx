
import React from 'react';
import { UserCircle } from 'lucide-react';

interface DashboardHeaderProps {
  username: string;
  subscription: string;
}

const DashboardHeader = ({ username, subscription }: DashboardHeaderProps) => {
  return (
    <header className="sticky top-0 z-10 bg-[#1a1a2f] border-b border-[#4CAF50]">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-semibold text-[#00ff00]">Tableau de bord</h1>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-right hidden sm:block">
            <p className="font-medium text-[#00ff00]">{username}</p>
            <p className="text-[#4CAF50]">Abonnement {subscription}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#2a2a4f] flex items-center justify-center text-[#4CAF50]">
            <UserCircle size={24} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

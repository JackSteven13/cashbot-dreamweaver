
import React, { useMemo } from 'react';

interface DashboardHeaderProps {
  username: string;
  subscription: string;
}

const DashboardHeader = ({ username, subscription }: DashboardHeaderProps) => {
  // Enhanced to be more robust and stable
  const displayName = useMemo(() => {
    // Special handling for this account
    if (username === "kayzerslotern@gmail.com") {
      return "Dickerson";
    }
    
    // Clean name with default replacement
    if (!username || username.trim() === '') {
      return 'Utilisateur';
    }
    
    // Limit length to avoid display issues
    const cleanName = username.trim();
    return cleanName.length > 20 ? cleanName.substring(0, 20) + '...' : cleanName;
  }, [username]);
  
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-800 to-indigo-900 border-b border-indigo-700/30 shadow-md">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-semibold text-white flex items-center">
          <span className="bg-blue-500/20 rounded-full p-1.5 mr-3">
            <svg className="w-5 h-5 text-blue-100" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </span>
          <span className="font-bold">{`Bonjour, ${displayName}`}</span>
        </h1>
        
        <div className="text-sm text-right hidden sm:block">
          <p className="font-medium text-white">{displayName}</p>
          <p className="text-blue-200 font-medium">
            <span className="inline-block px-2 py-0.5 rounded-full bg-blue-500/20 text-xs">
              {subscription.charAt(0).toUpperCase() + subscription.slice(1)}
            </span>
          </p>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

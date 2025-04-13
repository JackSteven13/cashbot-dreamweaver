
import React from 'react';

interface DashboardHeaderProps {
  username: string;
  subscription?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ username, subscription = 'freemium' }) => {
  return (
    <div className="glass-panel p-6 rounded-xl">
      <h1 className="text-2xl md:text-3xl font-bold">
        Bonjour, {username}
      </h1>
      
      <p className="text-muted-foreground mt-1">
        Abonnement actif: <span className="font-medium text-foreground">{subscription}</span>
      </p>
    </div>
  );
};

export default DashboardHeader;

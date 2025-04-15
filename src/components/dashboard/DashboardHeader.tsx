
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { User, LogOut, Settings } from 'lucide-react';
import { useProfileData } from '@/hooks/auth/useProfileData';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';

interface DashboardHeaderProps {
  username: string;
  subscription: string;
}

const DashboardHeader = ({ username, subscription }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  
  // Format subscription name for display
  const formatSubscription = (sub: string) => {
    switch (sub) {
      case 'premium':
        return 'Premium';
      case 'pro':
        return 'Pro';
      case 'business':
        return 'Business';
      default:
        return 'Freemium';
    }
  };
  
  // Set badge color based on subscription level
  const getBadgeVariant = (sub: string) => {
    switch (sub) {
      case 'premium':
        return 'purple';
      case 'pro':
        return 'blue';
      case 'business':
        return 'gold';
      default:
        return 'secondary';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-6">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            Bienvenue, <span className="text-primary">{username}</span>
          </h2>
          <p className="text-sm text-muted-foreground">Stream Genius Dashboard</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {subscription && (
          <Badge 
            variant={getBadgeVariant(subscription) as any} 
            className="hidden sm:inline-flex"
          >
            {formatSubscription(subscription)}
          </Badge>
        )}
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate('/settings')}
          title="Paramètres du compte"
        >
          <Settings className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate('/profile')}
          title="Profil utilisateur"
        >
          <User className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleSignOut}
          title="Déconnexion"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;

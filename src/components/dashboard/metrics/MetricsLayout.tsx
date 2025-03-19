
import React from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MetricsLayoutProps {
  mainContent: React.ReactNode;
  sideContent: React.ReactNode;
  subscription: string;
  onActivateProTrial: () => void;
}

const MetricsLayout = ({ 
  mainContent, 
  sideContent,
  subscription
}: MetricsLayoutProps) => {
  return (
    <div className="flex flex-col space-y-6">
      {/* Bouton flottant d'accès aux offres sur mobile */}
      <div className="lg:hidden">
        <Link to="/offres">
          <Button 
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white"
            size="lg"
          >
            <Package className="mr-2 h-4 w-4" />
            {subscription === 'freemium' ? "Passer à l'offre Pro" : "Gérer mon abonnement"}
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {mainContent}
        </div>
        <div className="space-y-8">
          {sideContent}
        </div>
      </div>
    </div>
  );
};

export default MetricsLayout;

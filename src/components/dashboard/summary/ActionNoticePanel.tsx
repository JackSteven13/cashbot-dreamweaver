
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BellRing } from 'lucide-react';

interface ActionNoticePanelProps {
  subscription?: string;
}

const ActionNoticePanel: React.FC<ActionNoticePanelProps> = ({ subscription = 'freemium' }) => {
  return (
    <Card className="border-0 shadow-sm dark:bg-card/40">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 md:px-6">
        <CardTitle className="text-lg md:text-xl font-display">
          Notifications
        </CardTitle>
        <BellRing className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-2 md:pt-4">
        <div className="flex flex-col space-y-4">
          {subscription === 'freemium' ? (
            <div className="text-sm">
              <p className="mb-2 text-muted-foreground">
                Découvrez nos offres premium pour accéder à des limites plus élevées et des fonctionnalités exclusives.
              </p>
              <p className="text-muted-foreground">
                Les comptes gratuits sont limités à 1 session par jour.
              </p>
            </div>
          ) : (
            <div className="text-sm">
              <p className="mb-2">
                Votre abonnement {subscription} est actif.
              </p>
              <p className="text-muted-foreground">
                Vous bénéficiez de sessions illimitées et d'une limite de gains quotidiens plus élevée.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionNoticePanel;

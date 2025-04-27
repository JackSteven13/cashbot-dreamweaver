
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ActionNoticePanelProps {
  subscription: string;
}

const ActionNoticePanel: React.FC<ActionNoticePanelProps> = ({ subscription }) => {
  const isFreemium = subscription === 'freemium';

  return (
    <Card className="border border-blue-100 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-blue-800 dark:text-blue-300 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span>Actions recommandées</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="space-y-4 text-sm">
          {isFreemium && (
            <div className="p-3 rounded-md bg-blue-100/70 dark:bg-blue-900/20">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                Augmentez votre potentiel
              </h4>
              <p className="text-blue-700 dark:text-blue-400 mb-2">
                Passez à un abonnement supérieur pour accéder à des revenus plus importants.
              </p>
              <Link to="/offres">
                <Button size="sm" variant="default" className="w-full">
                  Voir les offres
                </Button>
              </Link>
            </div>
          )}
          
          <div className="p-3 rounded-md bg-green-100/70 dark:bg-green-900/20">
            <h4 className="font-medium text-green-800 dark:text-green-300 mb-1">
              Activez vos sessions quotidiennes
            </h4>
            <p className="text-green-700 dark:text-green-400 mb-0">
              N'oubliez pas de lancer régulièrement des sessions pour maximiser vos revenus.
            </p>
          </div>
          
          <div className="p-3 rounded-md bg-amber-100/70 dark:bg-amber-900/20">
            <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-1">
              Parrainez vos amis
            </h4>
            <p className="text-amber-700 dark:text-amber-400 mb-0">
              Chaque parrainage vous rapporte un bonus sur vos gains.
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 text-xs text-slate-500 dark:text-slate-400">
        Mise à jour: {new Date().toLocaleDateString()}
      </CardFooter>
    </Card>
  );
};

export default ActionNoticePanel;

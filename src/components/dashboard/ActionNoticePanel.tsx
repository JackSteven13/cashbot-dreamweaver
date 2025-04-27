
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingUp } from 'lucide-react';

interface ActionNoticePanelProps {
  subscription: string;
}

const ActionNoticePanel: React.FC<ActionNoticePanelProps> = ({ subscription }) => {
  // Déterminer le message en fonction de l'abonnement
  const getActionMessage = () => {
    switch (subscription) {
      case 'elite':
        return "Votre abonnement Elite vous donne accès à toutes les fonctionnalités premium et aux retraits prioritaires.";
      case 'gold':
        return "Votre abonnement Gold vous permet de générer jusqu'à 3x plus de revenus que le plan gratuit.";
      case 'starter':
        return "Votre abonnement Starter vous permet de générer des revenus quotidiens plus élevés.";
      default:
        return "Passez à un abonnement payant pour augmenter vos gains quotidiens et débloquer des fonctionnalités avancées.";
    }
  };

  return (
    <Card className="bg-blue-50/50 dark:bg-blue-900/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Actions recommandées
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
          {getActionMessage()}
        </p>
        
        {subscription === 'freemium' && (
          <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-xs text-yellow-800 dark:text-yellow-300">
              Avec le plan gratuit, vos gains quotidiens sont limités. Passez à un abonnement payant pour augmenter vos revenus.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionNoticePanel;

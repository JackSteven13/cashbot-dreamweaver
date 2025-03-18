
import React, { useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useSessionCountdown } from '@/hooks/useSessionCountdown';

interface SystemTerminalProps {
  isNewUser: boolean;
  dailyLimit: number;
  subscription: string;
  remainingSessions: number | string;
  referralCount: number;
  displayBalance: number;
  referralBonus?: number;
}

const SystemTerminal: React.FC<SystemTerminalProps> = ({
  isNewUser,
  dailyLimit,
  subscription,
  remainingSessions,
  referralCount,
  displayBalance,
  referralBonus = 0
}) => {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showProTrialInfo, setShowProTrialInfo] = useState(isNewUser);
  const [isPromoActivated, setIsPromoActivated] = useState(false);
  
  // Utiliser notre hook pour le compte à rebours
  const { timeRemaining, isCountingDown } = useSessionCountdown(
    typeof remainingSessions === 'number' ? 1 - remainingSessions : 0, 
    subscription
  );
  
  // Calculer le pourcentage de progression vers la limite journalière
  const limitPercentage = Math.min(100, (displayBalance / dailyLimit) * 100);
  
  const activateProTrial = () => {
    if (subscription === 'freemium' && !isPromoActivated) {
      setIsPromoActivated(true);
      toast({
        title: "Accès Pro activé !",
        description: "Vous bénéficiez de 48h d'accès aux fonctionnalités Pro. Profitez-en pour maximiser vos gains !",
      });
    }
  };
  
  const submitFeedback = () => {
    if (feedback.trim()) {
      toast({
        title: "Merci pour votre retour !",
        description: "Votre avis est important pour nous. Nous l'examinerons attentivement.",
      });
      setFeedback('');
      setShowFeedbackDialog(false);
    }
  };

  return (
    <div className="w-full lg:w-1/2">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg border border-slate-700 p-5 text-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <h3 className="text-lg font-medium text-white">
              {isNewUser ? "CashBot • Bienvenue" : "CashBot • Système actif"}
            </h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-gray-300 hover:text-white hover:bg-slate-700/50"
            onClick={() => setShowFeedbackDialog(true)}
          >
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            Feedback
          </Button>
        </div>
        
        {/* Barre de progression */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1">
            <div className="text-xs font-medium text-gray-300">
              Progression de la limite journalière
            </div>
            <div className="text-xs font-medium text-gray-300">
              {displayBalance.toFixed(2)}€ / {dailyLimit}€
            </div>
          </div>
          <Progress value={limitPercentage} className="h-2 bg-slate-700">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
              style={{ width: `${limitPercentage}%` }}
            />
          </Progress>
        </div>
        
        {/* Compte à rebours si nécessaire */}
        {isCountingDown && (
          <div className="mb-5 bg-slate-700/50 p-3 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-blue-400 mr-2" />
                <span className="text-sm font-medium text-gray-200">Prochaine session disponible dans :</span>
              </div>
              <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-800">
                {timeRemaining}
              </Badge>
            </div>
          </div>
        )}
        
        {/* Informations système */}
        <div className="space-y-3 mb-4 font-mono text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/30 p-2 rounded-lg border border-slate-600/50">
              <div className="text-xs text-gray-400">Abonnement</div>
              <div className="text-sm font-medium text-white capitalize">{subscription}</div>
            </div>
            <div className="bg-slate-700/30 p-2 rounded-lg border border-slate-600/50">
              <div className="text-xs text-gray-400">Limite journalière</div>
              <div className="text-sm font-medium text-white">{dailyLimit}€</div>
            </div>
            <div className="bg-slate-700/30 p-2 rounded-lg border border-slate-600/50">
              <div className="text-xs text-gray-400">Sessions</div>
              <div className="text-sm font-medium text-white">
                {subscription === 'freemium' 
                  ? `${remainingSessions} session${remainingSessions !== 1 ? 's' : ''} restante${remainingSessions !== 1 ? 's' : ''}` 
                  : 'Illimitées'}
              </div>
            </div>
            <div className="bg-slate-700/30 p-2 rounded-lg border border-slate-600/50">
              <div className="text-xs text-gray-400">Bonus parrainage</div>
              <div className="text-sm font-medium text-white">
                {referralBonus > 0 ? `+${referralBonus}%` : '0%'}
              </div>
            </div>
          </div>
        </div>
        
        {isNewUser && (
          <div className="bg-gradient-to-r from-green-900/30 to-green-800/20 p-3 rounded-lg border border-green-800/50 mb-4">
            <p className="text-green-300 text-xs font-medium">
              🔥 Guide rapide pour démarrer :
            </p>
            <ol className="list-decimal ml-4 mt-1 text-green-200 text-xs space-y-1">
              <li>Lancez votre premier boost manuel gratuit</li>
              <li>Partagez votre lien de parrainage pour commencer à gagner des commissions</li>
              <li>Activez votre essai gratuit de 48h pour découvrir les fonctionnalités Pro</li>
              <li>Consultez le comparatif des abonnements pour choisir la meilleure option</li>
            </ol>
          </div>
        )}
        
        {subscription === 'freemium' && !isPromoActivated && (
          <div onClick={activateProTrial} className="cursor-pointer mb-4">
            <div className="bg-gradient-to-r from-blue-900/40 to-blue-700/20 p-3 rounded-lg border border-blue-700/50 hover:bg-blue-800/30 transition-colors">
              <p className="text-blue-300 text-xs font-medium text-center">
                ✨ CLIQUEZ ICI pour activer 48h d'accès Pro GRATUIT ✨
              </p>
            </div>
          </div>
        )}
        
        {isPromoActivated && (
          <div className="bg-gradient-to-r from-blue-900/40 to-blue-700/20 p-3 rounded-lg border border-blue-700/50 mb-4">
            <p className="text-blue-300 text-xs font-medium text-center">
              ✅ Accès Pro activé pour 48h ! Profitez-en pour maximiser vos gains
            </p>
          </div>
        )}
        
        {subscription === 'freemium' && (
          <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700 mt-2">
            <div className="flex justify-between items-center">
              <p className="text-blue-300 text-xs font-medium">Comparatif des abonnements :</p>
            </div>
            <table className="w-full text-xs mt-2">
              <thead>
                <tr className="text-gray-300">
                  <th className="text-left px-1 py-1">Plan</th>
                  <th className="text-center px-1 py-1">Limite/jour</th>
                  <th className="text-center px-1 py-1">Sessions</th>
                  <th className="text-center px-1 py-1">Retraits</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-t border-slate-700/50">
                  <td className="py-1 px-1">Freemium</td>
                  <td className="text-center py-1">0.5€</td>
                  <td className="text-center py-1">1/jour</td>
                  <td className="text-center py-1">Non</td>
                </tr>
                <tr className="border-t border-slate-700/50">
                  <td className="py-1 px-1">Pro</td>
                  <td className="text-center py-1">5€</td>
                  <td className="text-center py-1">∞</td>
                  <td className="text-center py-1">Oui</td>
                </tr>
                <tr className="border-t border-slate-700/50">
                  <td className="py-1 px-1">Visionnaire</td>
                  <td className="text-center py-1">20€</td>
                  <td className="text-center py-1">∞</td>
                  <td className="text-center py-1">Oui</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Boîte de dialogue pour le feedback */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Partagez votre expérience</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-gray-500">
              Votre avis nous est précieux pour améliorer CashBot. N'hésitez pas à nous faire part de vos suggestions ou frustrations.
            </p>
            <textarea
              className="min-h-24 rounded-md border border-gray-300 p-2 text-sm"
              placeholder="Partagez vos suggestions ou frustrations..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>Annuler</Button>
            <Button onClick={submitFeedback}>Envoyer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemTerminal;

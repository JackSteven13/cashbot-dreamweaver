
import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useSessionCountdown } from '@/hooks/useSessionCountdown';
import { supabase } from '@/integrations/supabase/client';

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
  const [tempProEnabled, setTempProEnabled] = useState(false);
  
  // Utiliser notre hook pour le compte à rebours
  const { timeRemaining, isCountingDown } = useSessionCountdown(
    typeof remainingSessions === 'number' ? 1 - remainingSessions : 0, 
    subscription
  );
  
  // Calculer le pourcentage de progression vers la limite journalière
  const limitPercentage = Math.min(100, (displayBalance / dailyLimit) * 100);
  
  useEffect(() => {
    // Vérifier si le mode Pro temporaire est activé dans le localStorage
    const proTrialActive = localStorage.getItem('proTrialActive') === 'true';
    const proTrialExpires = localStorage.getItem('proTrialExpires');
    
    if (proTrialActive && proTrialExpires) {
      const expiryTime = parseInt(proTrialExpires, 10);
      const now = Date.now();
      
      if (now < expiryTime) {
        setTempProEnabled(true);
        setIsPromoActivated(true);
      } else {
        // Si expiré, supprimer du localStorage
        localStorage.removeItem('proTrialActive');
        localStorage.removeItem('proTrialExpires');
      }
    }
  }, []);
  
  const activateProTrial = async () => {
    if (subscription === 'freemium' && !isPromoActivated) {
      // Définir l'expiration à 48h à partir de maintenant
      const expiryTime = Date.now() + (48 * 60 * 60 * 1000);
      
      // Stocker dans localStorage
      localStorage.setItem('proTrialActive', 'true');
      localStorage.setItem('proTrialExpires', expiryTime.toString());
      
      // Mettre à jour l'état
      setTempProEnabled(true);
      setIsPromoActivated(true);
      
      // Session utilisateur
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Mise à jour temporaire de la base de données pour indiquer l'essai pro
        // Note: Ceci n'est pas persistant, c'est juste visuel pour l'interface
        localStorage.setItem('tempProDisplay', 'true');
      }
      
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

  // Fonction pour afficher le temps restant de l'essai Pro
  const displayRemainingProTime = () => {
    const expiryTime = parseInt(localStorage.getItem('proTrialExpires') || '0', 10);
    const now = Date.now();
    const remainingMs = expiryTime - now;
    
    if (remainingMs <= 0) return "Expiré";
    
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
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
              <div className="text-sm font-medium text-white capitalize">
                {tempProEnabled ? 'Pro (Essai)' : subscription}
              </div>
            </div>
            <div className="bg-slate-700/30 p-2 rounded-lg border border-slate-600/50">
              <div className="text-xs text-gray-400">Limite journalière</div>
              <div className="text-sm font-medium text-white">
                {tempProEnabled ? '5€' : `${dailyLimit}€`}
              </div>
            </div>
            <div className="bg-slate-700/30 p-2 rounded-lg border border-slate-600/50">
              <div className="text-xs text-gray-400">Sessions</div>
              <div className="text-sm font-medium text-white">
                {tempProEnabled 
                  ? 'Illimitées (Essai)' 
                  : (subscription === 'freemium' 
                    ? `${remainingSessions} session${remainingSessions !== 1 ? 's' : ''} restante${remainingSessions !== 1 ? 's' : ''}` 
                    : 'Illimitées')}
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
              ✅ Accès Pro activé pour {displayRemainingProTime()} ! Profitez des fonctionnalités Pro
            </p>
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

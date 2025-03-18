
import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
  
  const activateProTrial = () => {
    if (subscription === 'freemium' && !isPromoActivated) {
      setIsPromoActivated(true);
      toast({
        title: "Accès Pro activé !",
        description: "Vous bénéficiez de 48h d'accès aux fonctionnalités Pro. Profitez-en pour maximiser vos gains !",
      });
      // Dans un cas réel, on stockerait cette information dans la base de données
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
      // Dans un cas réel, on enverrait ce feedback à la base de données
    }
  };

  return (
    <div className="w-full lg:w-1/2 cyber-terminal">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-[#a0aec0]">📈 {isNewUser ? "CashBot est actif" : "État du système :"}</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-[#a0aec0] hover:text-white hover:bg-[#2d5f8a]/20"
          onClick={() => setShowFeedbackDialog(true)}
        >
          <AlertCircle className="h-3.5 w-3.5 mr-1" />
          Feedback
        </Button>
      </div>
      
      <div className="font-mono text-sm text-[#e2e8f0] space-y-2">
        {isNewUser ? (
          <>
            <p>{"> Système initialisé..."}</p>
            <p>{"> Technologie propriétaire activée"}</p>
            <p>{"> Premier boost gratuit pour démontrer l'efficacité..."}</p>
            <p>{"> Limite journalière : " + dailyLimit + "€"}</p>
            {subscription === 'freemium' && !isPromoActivated && (
              <p className="text-green-400 cursor-pointer" onClick={activateProTrial}>
                {"> CLIQUEZ ICI pour activer 48h d'accès Pro GRATUIT"}
              </p>
            )}
            {isPromoActivated && (
              <p className="text-green-400">
                {"> Accès Pro activé pour 48h ! Profitez-en !"}
              </p>
            )}
            <p>{subscription === 'freemium' ? "> 1 session manuelle par jour" : "> Sessions manuelles illimitées"}</p>
            <p>{referralCount > 0 ? `> Bonus filleuls : +${referralBonus}%` : "> Aucun filleul actif"}</p>
            <p>{"> Programme d'affiliation : Activé (70% de commission)"}</p>
          </>
        ) : (
          <>
            <p>{"> Système en exécution..."}</p>
            <p>{"> Traitement automatique des données"}</p>
            <p>{"> Optimisation du rendement"}</p>
            <p>{"> Potentiel journalier : " + dailyLimit + "€"}</p>
            {subscription === 'freemium' && !isPromoActivated && (
              <p className="text-green-400 cursor-pointer" onClick={activateProTrial}>
                {"> CLIQUEZ ICI pour activer 48h d'accès Pro GRATUIT"}
              </p>
            )}
            {isPromoActivated && (
              <p className="text-green-400">
                {"> Accès Pro activé pour 48h ! Profitez-en !"}
              </p>
            )}
            <p>{subscription === 'freemium' 
              ? `> Sessions restantes : ${remainingSessions}` 
              : "> Sessions illimitées"}</p>
            <p>{referralCount > 0 ? `> Bonus filleuls : +${referralBonus}%` : "> Aucun filleul actif"}</p>
            <p>{`> Solde actuel : ${displayBalance.toFixed(2)}€`}</p>
            <p>{"> Programme d'affiliation : Actif (70% de commission)"}</p>
          </>
        )}
        <p className="blink-cursor">&nbsp;</p>
      </div>
      
      <div className="mt-4 space-y-3">
        <div className="bg-[#1a2234] p-3 rounded border border-[#2c3e50]">
          <p className="text-[#a0aec0] text-xs">
            Une session correspond à un boost manuel où CashBot analyse intensivement des publicités pour générer des revenus immédiats. 
            {subscription === 'freemium' 
              ? ' Avec le forfait Freemium, vous êtes limité à 1 session par jour et 0.5€ de gains maximum.' 
              : ' Votre abonnement vous permet de lancer des sessions manuelles illimitées.'}
            {referralCount > 0 && ' Chaque filleul vous apporte un bonus de gains de 5% (jusqu\'à 25% au total).'}
          </p>
        </div>
        
        {isNewUser && (
          <div className="bg-green-900/20 p-3 rounded border border-green-800">
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
        
        {subscription === 'freemium' && (
          <div className="bg-blue-900/20 p-3 rounded border border-blue-800 mt-2">
            <div className="flex justify-between items-center">
              <p className="text-blue-300 text-xs font-medium">Comparatif des abonnements :</p>
            </div>
            <table className="w-full text-xs mt-2">
              <thead>
                <tr className="text-blue-200">
                  <th className="text-left px-1">Plan</th>
                  <th className="text-center px-1">Limite/jour</th>
                  <th className="text-center px-1">Sessions</th>
                  <th className="text-center px-1">Retraits</th>
                </tr>
              </thead>
              <tbody className="text-blue-100">
                <tr className="border-t border-blue-800/50">
                  <td className="py-1 px-1">Freemium</td>
                  <td className="text-center py-1">0.5€</td>
                  <td className="text-center py-1">1/jour</td>
                  <td className="text-center py-1">Non</td>
                </tr>
                <tr className="border-t border-blue-800/50">
                  <td className="py-1 px-1">Pro</td>
                  <td className="text-center py-1">5€</td>
                  <td className="text-center py-1">∞</td>
                  <td className="text-center py-1">Oui</td>
                </tr>
                <tr className="border-t border-blue-800/50">
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

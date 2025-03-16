import React, { useState } from 'react';
import { Copy, DollarSign, ArrowUpCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import Button from '@/components/Button';

// Plans et leurs limites de gains
const SUBSCRIPTION_LIMITS = {
  'freemium': 0.5,
  'pro': 5,
  'visionnaire': 20,
  'alpha': 50
};

interface SummaryPanelProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  isNewUser?: boolean;
  subscription: string;
  handleWithdrawal?: () => void;
  dailySessionCount?: number;
  canStartSession?: boolean;
  referralCount?: number;
}

const SummaryPanel = ({ 
  balance, 
  referralLink, 
  isStartingSession, 
  handleStartSession,
  isNewUser = false,
  subscription,
  handleWithdrawal,
  dailySessionCount = 0,
  canStartSession = true,
  referralCount = 0
}: SummaryPanelProps) => {
  
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Lien copié !",
      description: "Votre lien de parrainage a été copié dans le presse-papier",
    });
  };
  
  const onWithdraw = () => {
    setIsWithdrawing(true);
    
    // Simulate withdrawal process
    setTimeout(() => {
      setIsWithdrawing(false);
      
      // If subscription is freemium, withdrawal will fail
      if (subscription === 'freemium') {
        toast({
          title: "Demande refusée",
          description: "Les retraits sont disponibles uniquement pour les abonnements payants. Veuillez mettre à niveau votre compte.",
          variant: "destructive"
        });
      } else if (balance < 20) {
        toast({
          title: "Montant insuffisant",
          description: "Le montant minimum de retrait est de 20€. Continuez à gagner plus de revenus.",
          variant: "destructive"
        });
      } else {
        if (handleWithdrawal) handleWithdrawal();
        toast({
          title: "Demande de retrait acceptée",
          description: "Votre retrait a été traité et sera envoyé sur votre compte bancaire sous 2-3 jours ouvrés.",
        });
      }
    }, 2000);
  };

  // Obtenir la limite de gain pour l'abonnement actuel
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calculer les sessions restantes
  const remainingSessions = subscription === 'freemium' ? Math.max(0, 1 - dailySessionCount!) : 'illimitées';
  const sessionsDisplay = subscription === 'freemium' 
    ? `${remainingSessions} session${remainingSessions !== 1 ? 's' : ''} restante${remainingSessions !== 1 ? 's' : ''}`
    : 'Sessions illimitées';

  // Ensure balance is never displayed as negative
  const displayBalance = Math.max(0, balance);

  return (
    <div className="neuro-panel mb-8">
      {isNewUser && (
        <div className="bg-green-50 text-green-800 p-4 mb-6 rounded-md border border-green-200">
          <h3 className="font-medium">🎉 Bienvenue sur CashBot !</h3>
          <p className="text-sm mt-1">Votre compte a été créé avec succès. Notre technologie avancée va maintenant travailler pour vous.</p>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="flex-1">
          <div className="flex items-center mb-4">
            <DollarSign className="text-[#2d5f8a] h-8 w-8 mr-2" />
            <h2 className="text-2xl font-semibold text-[#1e3a5f]">
              Solde : {displayBalance.toFixed(2)}€
            </h2>
          </div>
          
          <div className="mb-3 bg-blue-50 p-3 rounded-md border border-blue-100">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Abonnement actuel :</span> {subscription.charAt(0).toUpperCase() + subscription.slice(1)}
            </p>
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Gain maximum :</span> {dailyLimit}€ par jour
            </p>
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Sessions :</span> {sessionsDisplay}
            </p>
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Filleuls actifs :</span> {referralCount}
              {referralCount > 0 && <span className="ml-1 text-green-600">(+{Math.min(referralCount * 5, 25)}% de bonus)</span>}
            </p>
          </div>
          
          <div className="flex gap-2 mb-6">
            <Button 
              size="lg" 
              className={`flex-1 ${canStartSession ? 'bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white' : 'bg-gray-300 hover:bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              isLoading={isStartingSession} 
              onClick={handleStartSession}
              disabled={!canStartSession}
            >
              {isStartingSession ? "Traitement en cours..." : "▶️ Boost manuel"}
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="flex-1 border-[#2d5f8a] text-[#2d5f8a] hover:bg-[#e2e8f0]"
              isLoading={isWithdrawing}
              onClick={onWithdraw}
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Retirer les fonds
            </Button>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3 text-[#1e3a5f]">🚀 Votre lien magique :</h3>
            <div className="flex">
              <input 
                type="text" 
                value={referralLink} 
                readOnly 
                className="bg-[#f0f4f8] rounded-l-lg px-3 py-2 flex-1 text-sm text-[#334e68] border-[#cbd5e0]"
              />
              <Button variant="outline" onClick={handleCopyReferralLink} className="rounded-l-none border-[#cbd5e0] bg-[#f0f4f8] text-[#334e68]">
                <Copy size={16} />
              </Button>
            </div>
            <p className="text-sm text-[#486581] mt-2">Gagnez 70% sur chaque filleul !</p>
          </div>
        </div>
        
        {/* Right Column - AI Terminal */}
        <div className="w-full lg:w-1/2 cyber-terminal">
          <h3 className="text-lg font-semibold text-[#a0aec0] mb-3">📈 {isNewUser ? "CashBot est actif" : "État du système :"}</h3>
          <div className="font-mono text-sm text-[#e2e8f0] space-y-2">
            {isNewUser ? (
              <>
                <p>{"> Système initialisé..."}</p>
                <p>{"> Technologie propriétaire activée"}</p>
                <p>{"> Processus en cours..."}</p>
                <p>{"> Limite journalière : " + dailyLimit + "€"}</p>
                <p>{subscription === 'freemium' ? "> 1 session manuelle par jour" : "> Sessions manuelles illimitées"}</p>
                <p>{referralCount > 0 ? `> Bonus filleuls : +${Math.min(referralCount * 5, 25)}%` : "> Aucun filleul actif"}</p>
              </>
            ) : (
              <>
                <p>{"> Système en exécution..."}</p>
                <p>{"> Traitement automatique des données"}</p>
                <p>{"> Optimisation du rendement"}</p>
                <p>{"> Potentiel journalier : " + dailyLimit + "€"}</p>
                <p>{subscription === 'freemium' 
                  ? `> Sessions restantes : ${remainingSessions}` 
                  : "> Sessions illimitées"}</p>
                <p>{referralCount > 0 ? `> Bonus filleuls : +${Math.min(referralCount * 5, 25)}%` : "> Aucun filleul actif"}</p>
              </>
            )}
            <p className="blink-cursor">&nbsp;</p>
          </div>
          
          <div className="mt-4 bg-[#1a2234] p-3 rounded border border-[#2c3e50]">
            <p className="text-[#a0aec0] text-xs">
              Une session correspond à un boost manuel où CashBot analyse intensivement des publicités pour générer des revenus immédiats. 
              {subscription === 'freemium' 
                ? ' Avec le forfait Freemium, vous êtes limité à 1 session par jour et 0.5€ de gains maximum.' 
                : ' Votre abonnement vous permet de lancer des sessions manuelles illimitées.'}
              {referralCount > 0 && ' Chaque filleul vous apporte un bonus de gains de 5% (jusqu\'à 25% au total).'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;


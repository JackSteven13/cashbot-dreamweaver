
import React from 'react';
import { Copy, DollarSign } from 'lucide-react';
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
}

const SummaryPanel = ({ 
  balance, 
  referralLink, 
  isStartingSession, 
  handleStartSession,
  isNewUser = false,
  subscription
}: SummaryPanelProps) => {
  
  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Lien copié !",
      description: "Votre lien de parrainage a été copié dans le presse-papier",
    });
  };

  // Obtenir la limite de gain pour l'abonnement actuel
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;

  return (
    <div className="neuro-panel mb-8">
      {isNewUser && (
        <div className="bg-green-50 text-green-800 p-4 mb-6 rounded-md border border-green-200">
          <h3 className="font-medium">🎉 Bienvenue sur CashBot !</h3>
          <p className="text-sm mt-1">Votre compte a été créé avec succès. Notre bot analyse automatiquement les publicités pour gagner de l'argent pour vous !</p>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="flex-1">
          <div className="flex items-center mb-4">
            <DollarSign className="text-[#2d5f8a] h-8 w-8 mr-2" />
            <h2 className="text-2xl font-semibold text-[#1e3a5f]">Solde : {balance.toFixed(2)}€</h2>
          </div>
          
          <div className="mb-3 bg-blue-50 p-3 rounded-md border border-blue-100">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Abonnement actuel :</span> {subscription.charAt(0).toUpperCase() + subscription.slice(1)}
            </p>
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Gain maximum :</span> {dailyLimit}€ par jour
            </p>
          </div>
          
          <Button 
            size="lg" 
            fullWidth 
            className="mb-6 bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white"
            isLoading={isStartingSession} 
            onClick={handleStartSession}
          >
            {isStartingSession ? "Analyse en cours..." : "▶️ Lancer une session d'analyse manuelle"}
          </Button>
          
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
          <h3 className="text-lg font-semibold text-[#a0aec0] mb-3">📈 {isNewUser ? "CashBot est prêt" : "Activité du CashBot :"}</h3>
          <div className="font-mono text-sm text-[#e2e8f0] space-y-2">
            {isNewUser ? (
              <>
                <p>{"> Système initialisé..."}</p>
                <p>{"> CashBot prêt à analyser des publicités"}</p>
                <p>{"> Analyse automatique en cours..."}</p>
                <p>{"> Plafond de gain : " + dailyLimit + "€/jour"}</p>
              </>
            ) : (
              <>
                <p>{"> CashBot en exécution..."}</p>
                <p>{"> Analyse automatique des publicités"}</p>
                <p>{"> Gestion optimisée des campagnes publicitaires"}</p>
                <p>{"> Gain journalier maximum : " + dailyLimit + "€"}</p>
              </>
            )}
            <p className="blink-cursor">&nbsp;</p>
          </div>
          
          <div className="mt-4 bg-[#1a2234] p-3 rounded border border-[#2c3e50]">
            <p className="text-[#a0aec0] text-xs">
              CashBot fonctionne automatiquement et analyse des publicités pour vous. Des sessions sont automatiquement lancées toutes les 5 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;

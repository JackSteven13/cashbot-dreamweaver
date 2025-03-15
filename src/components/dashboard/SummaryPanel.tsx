
import React from 'react';
import { Copy, DollarSign } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import Button from '@/components/Button';

interface SummaryPanelProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
}

const SummaryPanel = ({ 
  balance, 
  referralLink, 
  isStartingSession, 
  handleStartSession 
}: SummaryPanelProps) => {
  
  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Lien copié !",
      description: "Votre lien de parrainage a été copié dans le presse-papier",
    });
  };

  return (
    <div className="neuro-panel mb-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="flex-1">
          <div className="flex items-center mb-6">
            <DollarSign className="text-[#4CAF50] h-8 w-8 mr-2" />
            <h2 className="text-2xl font-semibold text-[#00ff00]">Solde : {balance.toFixed(2)}€</h2>
          </div>
          
          <Button 
            size="lg" 
            fullWidth 
            className="cyber-pulse mb-6 bg-[#4CAF50] text-white"
            isLoading={isStartingSession} 
            onClick={handleStartSession}
          >
            {isStartingSession ? "Analyse en cours..." : "▶️ Lancer une session IA"}
          </Button>
          
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3 text-[#00ff00]">🚀 Votre lien magique :</h3>
            <div className="flex">
              <input 
                type="text" 
                value={referralLink} 
                readOnly 
                className="bg-[#2a2a4f] rounded-l-lg px-3 py-2 flex-1 text-sm text-[#00ff00] border-[#4CAF50]"
              />
              <Button variant="outline" onClick={handleCopyReferralLink} className="rounded-l-none border-[#4CAF50] bg-[#2a2a4f] text-[#00ff00]">
                <Copy size={16} />
              </Button>
            </div>
            <p className="text-sm text-[#4CAF50] mt-2">Gagnez 70% sur chaque filleul !</p>
          </div>
        </div>
        
        {/* Right Column - AI Terminal */}
        <div className="w-full lg:w-1/2 cyber-terminal">
          <h3 className="text-lg font-semibold text-[#4CAF50] mb-3">📈 Dernier rapport IA :</h3>
          <div className="font-mono text-sm text-[#00ff00] space-y-2">
            <p>{"> Analyse de 142 pubs..."}</p>
            <p>{"> Détection tendance haussière crypto"}</p>
            <p>{"> Profit estimé : +47€"}</p>
            <p className="blink-cursor">&nbsp;</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;

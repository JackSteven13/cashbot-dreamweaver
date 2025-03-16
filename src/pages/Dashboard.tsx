
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';

// Mock data - in a real app, this would come from your backend
const mockUser = {
  username: 'admin',
  balance: 1567.82,
  subscription: 'alpha',
  referrals: [],
  referralLink: 'https://cashbot.com?ref=admin',
  transactions: [
    {
      date: '2023-09-15',
      gain: 98.42,
      report: "L'algorithme a identifié une divergence de volatilité sur EUR/USD suite à la publication des données d'inflation. Exploitation d'un arbitrage temporaire avec un ratio risque/rendement de 1:3.2. Transition fluide entre les positions, minimisant l'exposition au risque systémique."
    },
    {
      date: '2023-09-14',
      gain: 76.29,
      report: "Analyse technique révélant une formation en triangle ascendant sur BTC/USD. L'IA a anticipé le franchissement du niveau de résistance et a exécuté un ordre d'achat à 42,850€ avec TP à 43,215€. Clôture avec un gain net après frais de transaction."
    },
    {
      date: '2023-09-13',
      gain: 105.11,
      report: "Corrélation inter-marchés exploitée entre indices boursiers européens et américains. Position initiée sur DAX à l'ouverture européenne avant le gap haussier américain. Optimisation du timing d'entrée basée sur les modèles historiques et les flux institutionnels."
    }
  ]
};

const Dashboard = () => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');

  const handleStartSession = () => {
    setIsStartingSession(true);
    // Simulate a session (in a real app, this would call your backend)
    setTimeout(() => {
      setIsStartingSession(false);
      toast({
        title: "Session démarrée",
        description: "L'IA analyse actuellement le marché pour vous",
      });
      // You would typically update the user data here from your backend
    }, 2000);
  };

  return (
    <DashboardLayout
      username={mockUser.username}
      subscription={mockUser.subscription}
      selectedNavItem={selectedNavItem}
      setSelectedNavItem={setSelectedNavItem}
    >
      <DashboardMetrics
        balance={mockUser.balance}
        referralLink={mockUser.referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        transactions={mockUser.transactions}
      />
    </DashboardLayout>
  );
};

export default Dashboard;

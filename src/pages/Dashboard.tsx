
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
      report: "L'IA a analysé 257 publicités premium et a identifié 42 opportunités à forte rémunération. Ciblage particulièrement efficace sur les campagnes du secteur technologique avec un taux de conversion exceptionnel de 8.3%. Revenus optimisés grâce à la durée d'engagement maintenue au-dessus de la moyenne."
    },
    {
      date: '2023-09-14',
      gain: 76.29,
      report: "Session concentrée sur 189 publicités du secteur e-commerce. L'algorithme a priorisé les publicités à haut rendement et ignoré celles à faible rémunération. Stratégie d'engagement optimisée avec une orientation vers les vidéos publicitaires complètes, générant un revenu moyen de 0.40€ par publicité."
    },
    {
      date: '2023-09-13',
      gain: 105.11,
      report: "Performance exceptionnelle avec 312 publicités analysées en moins de 2 heures. Concentration sur les campagnes internationales à haute valeur. L'IA a détecté une opportunité rare dans les publicités du secteur financier, générant à elle seule 23% des revenus totaux de la session."
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
        description: "L'IA analyse actuellement les publicités pour vous",
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

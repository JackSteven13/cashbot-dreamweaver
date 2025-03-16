
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';

// Mock data - in a real app, this would come from your backend
const getInitialUserData = () => {
  // Check if user is new by looking for a stored flag in localStorage
  const isNewUser = !localStorage.getItem('user_registered');
  
  return {
    username: localStorage.getItem('username') || 'utilisateur',
    balance: isNewUser ? 0 : 1567.82,
    subscription: 'alpha',
    referrals: [],
    referralLink: 'https://cashbot.com?ref=admin',
    transactions: isNewUser ? [] : [
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
};

const Dashboard = () => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  const [userData, setUserData] = useState(getInitialUserData);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    // Check if this is the first visit
    const isNew = !localStorage.getItem('user_registered');
    setIsNewUser(isNew);
    
    if (isNew) {
      // Show welcome message for new users
      toast({
        title: "Bienvenue sur CashBot !",
        description: "Votre compte a été créé avec succès. Commencez par lancer votre première session d'analyse !",
      });
      // Set the flag for future visits
      localStorage.setItem('user_registered', 'true');
    }
  }, []);

  const handleStartSession = () => {
    setIsStartingSession(true);
    // Simulate a session (in a real app, this would call your backend)
    setTimeout(() => {
      setIsStartingSession(false);
      
      // Generate a random gain between 5 and 15
      const randomGain = Math.floor(Math.random() * 10) + 5;
      
      // Update the user data with the new gain
      setUserData(prev => ({
        ...prev,
        balance: prev.balance + randomGain,
        transactions: [
          {
            date: new Date().toISOString().split('T')[0],
            gain: randomGain,
            report: `L'IA a analysé ${Math.floor(Math.random() * 100) + 50} publicités et généré ${randomGain}€ de revenus.`
          },
          ...prev.transactions
        ]
      }));
      
      toast({
        title: "Session terminée",
        description: `L'IA a généré ${randomGain}€ de revenus pour vous !`,
      });
    }, 2000);
  };

  return (
    <DashboardLayout
      username={userData.username}
      subscription={userData.subscription}
      selectedNavItem={selectedNavItem}
      setSelectedNavItem={setSelectedNavItem}
    >
      <DashboardMetrics
        balance={userData.balance}
        referralLink={userData.referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        transactions={userData.transactions}
        isNewUser={isNewUser}
      />
    </DashboardLayout>
  );
};

export default Dashboard;

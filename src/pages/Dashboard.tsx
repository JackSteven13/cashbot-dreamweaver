
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';

// Plans et leurs limites de gains
const SUBSCRIPTION_LIMITS = {
  'freemium': 0.5,
  'pro': 5,
  'visionnaire': 20,
  'alpha': 50
};

// Mock data - in a real app, this would come from your backend
const getInitialUserData = () => {
  // Check if user is new by looking for a stored flag in localStorage
  const isNewUser = !localStorage.getItem('user_registered');
  const subscription = localStorage.getItem('subscription') || 'freemium';
  
  return {
    username: localStorage.getItem('username') || 'utilisateur',
    balance: isNewUser ? 0 : 1567.82,
    subscription: subscription,
    referrals: [],
    referralLink: 'https://cashbot.com?ref=admin',
    transactions: isNewUser ? [] : [
      {
        date: '2023-09-15',
        gain: 98.42,
        report: "Session réussie avec résultats supérieurs à la moyenne. Performance optimisée par nos algorithmes exclusifs. Notre technologie a identifié les meilleures opportunités disponibles avec un taux de conversion exceptionnel."
      },
      {
        date: '2023-09-14',
        gain: 76.29,
        report: "Le système a généré des revenus constants tout au long de la session. Notre technologie propriétaire a utilisé sa stratégie adaptive pour maximiser le rendement dans les conditions du marché actuel."
      },
      {
        date: '2023-09-13',
        gain: 105.11,
        report: "Performance exceptionnelle avec un rendement supérieur à la moyenne. Notre système propriétaire a identifié des opportunités de premier ordre, générant un revenu significativement plus élevé que prévu pour cette session."
      }
    ]
  };
};

const Dashboard = () => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  const [userData, setUserData] = useState(getInitialUserData);
  const [isNewUser, setIsNewUser] = useState(false);
  const [lastAutoSessionTime, setLastAutoSessionTime] = useState(Date.now());

  useEffect(() => {
    // Check if this is the first visit
    const isNew = !localStorage.getItem('user_registered');
    setIsNewUser(isNew);
    
    if (isNew) {
      // Show welcome message for new users
      toast({
        title: "Bienvenue sur CashBot !",
        description: "Votre compte a été créé avec succès. Notre système est maintenant actif pour vous.",
      });
      // Set the flag for future visits
      localStorage.setItem('user_registered', 'true');
    }
  }, []);

  // Effet pour simuler l'analyse automatique des publicités
  useEffect(() => {
    const autoSessionInterval = setInterval(() => {
      // Vérifier si 5 minutes (300000 ms) se sont écoulées depuis la dernière session
      if (Date.now() - lastAutoSessionTime >= 300000) {
        generateAutomaticRevenue();
        setLastAutoSessionTime(Date.now());
      }
    }, 60000); // Vérifier toutes les minutes

    return () => clearInterval(autoSessionInterval);
  }, [lastAutoSessionTime, userData.subscription]);

  const generateAutomaticRevenue = () => {
    // Obtenir la limite de gain pour l'abonnement actuel
    const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Générer un gain aléatoire en fonction de l'abonnement (entre 20% et 80% de la limite)
    const minGain = dailyLimit * 0.2;
    const maxGain = dailyLimit * 0.8;
    const randomGain = parseFloat((Math.random() * (maxGain - minGain) + minGain).toFixed(2));
    
    // Mettre à jour les données utilisateur
    setUserData(prev => ({
      ...prev,
      balance: parseFloat((prev.balance + randomGain).toFixed(2)),
      transactions: [
        {
          date: new Date().toISOString().split('T')[0],
          gain: randomGain,
          report: `Le système a généré ${randomGain}€ de revenus grâce à notre technologie propriétaire. Votre abonnement ${prev.subscription} vous permet d'accéder à ce niveau de performance.`
        },
        ...prev.transactions
      ]
    }));

    // Notification de gain
    toast({
      title: "Revenus générés",
      description: `CashBot a généré ${randomGain}€ pour vous !`,
    });
  };

  const handleStartSession = () => {
    setIsStartingSession(true);
    // Simuler une session manuelle
    setTimeout(() => {
      setIsStartingSession(false);
      
      // Obtenir la limite de gain pour l'abonnement actuel
      const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Générer un gain aléatoire en fonction de l'abonnement (plus élevé que les sessions auto)
      const minGain = dailyLimit * 0.3;
      const maxGain = dailyLimit;
      const randomGain = parseFloat((Math.random() * (maxGain - minGain) + minGain).toFixed(2));
      
      // Mettre à jour les données utilisateur
      setUserData(prev => ({
        ...prev,
        balance: parseFloat((prev.balance + randomGain).toFixed(2)),
        transactions: [
          {
            date: new Date().toISOString().split('T')[0],
            gain: randomGain,
            report: `Session manuelle : Notre technologie a optimisé le processus et généré ${randomGain}€ de revenus pour votre compte ${prev.subscription}.`
          },
          ...prev.transactions
        ]
      }));
      
      toast({
        title: "Session terminée",
        description: `CashBot a généré ${randomGain}€ de revenus pour vous !`,
      });
    }, 2000);
  };
  
  const handleWithdrawal = () => {
    // Process withdrawal only if sufficient balance (at least 20€) and not freemium account
    if (userData.balance >= 20 && userData.subscription !== 'freemium') {
      // Reset balance to 0 to simulate withdrawal
      setUserData(prev => ({
        ...prev,
        balance: 0,
        transactions: [
          {
            date: new Date().toISOString().split('T')[0],
            gain: -prev.balance, // Negative because it's a withdrawal
            report: `Retrait de ${prev.balance.toFixed(2)}€ effectué avec succès. Le transfert vers votre compte bancaire est en cours.`
          },
          ...prev.transactions
        ]
      }));
    }
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
        handleWithdrawal={handleWithdrawal}
        transactions={userData.transactions}
        isNewUser={isNewUser}
        subscription={userData.subscription}
      />
    </DashboardLayout>
  );
};

export default Dashboard;


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
  const [lastAutoSessionTime, setLastAutoSessionTime] = useState(Date.now());

  useEffect(() => {
    // Check if this is the first visit
    const isNew = !localStorage.getItem('user_registered');
    setIsNewUser(isNew);
    
    if (isNew) {
      // Show welcome message for new users
      toast({
        title: "Bienvenue sur CashBot !",
        description: "Votre compte a été créé avec succès. Notre bot analyse automatiquement les publicités pour vous !",
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

    // Générer un nombre aléatoire de publicités entre 50 et 300
    const adCount = Math.floor(Math.random() * 250) + 50;
    
    // Mettre à jour les données utilisateur
    setUserData(prev => ({
      ...prev,
      balance: parseFloat((prev.balance + randomGain).toFixed(2)),
      transactions: [
        {
          date: new Date().toISOString().split('T')[0],
          gain: randomGain,
          report: `CashBot a automatiquement analysé ${adCount} publicités et généré ${randomGain}€ de revenus pour votre compte ${prev.subscription}.`
        },
        ...prev.transactions
      ]
    }));

    // Notification de gain
    toast({
      title: "Analyse automatique terminée",
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
      
      // Générer un nombre aléatoire de publicités entre 100 et 400
      const adCount = Math.floor(Math.random() * 300) + 100;
      
      // Mettre à jour les données utilisateur
      setUserData(prev => ({
        ...prev,
        balance: parseFloat((prev.balance + randomGain).toFixed(2)),
        transactions: [
          {
            date: new Date().toISOString().split('T')[0],
            gain: randomGain,
            report: `Session manuelle : CashBot a analysé ${adCount} publicités et généré ${randomGain}€ de revenus pour votre compte ${prev.subscription}.`
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
        subscription={userData.subscription}
      />
    </DashboardLayout>
  );
};

export default Dashboard;

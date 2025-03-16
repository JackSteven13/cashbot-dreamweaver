
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  
  // Pour assurer la cohérence avec les limites d'abonnement
  const storedBalance = parseFloat(localStorage.getItem('user_balance') || '0');
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS];
  
  // Si le solde dépasse la limite journalière et que c'est un compte freemium, on limite
  const balanceToUse = subscription === 'freemium' && storedBalance > dailyLimit 
    ? dailyLimit 
    : storedBalance;
  
  // Sauvegarder le solde corrigé
  if (subscription === 'freemium' && storedBalance > dailyLimit) {
    localStorage.setItem('user_balance', balanceToUse.toString());
  }
  
  return {
    username: localStorage.getItem('username') || 'utilisateur',
    balance: balanceToUse,
    subscription: subscription,
    referrals: [],
    referralLink: 'https://cashbot.com?ref=admin',
    transactions: isNewUser ? [] : [
      {
        date: '2023-09-15',
        gain: 0.42,
        report: "Session réussie avec résultats supérieurs à la moyenne. Performance optimisée par nos algorithmes exclusifs. Notre technologie a identifié les meilleures opportunités disponibles avec un taux de conversion exceptionnel."
      },
      {
        date: '2023-09-14',
        gain: 0.29,
        report: "Le système a généré des revenus constants tout au long de la session. Notre technologie propriétaire a utilisé sa stratégie adaptive pour maximiser le rendement dans les conditions du marché actuel."
      },
      {
        date: '2023-09-13',
        gain: 0.48,
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
  const [dailySessionCount, setDailySessionCount] = useState(() => {
    return parseInt(localStorage.getItem('daily_session_count') || '0');
  });
  const [showLimitAlert, setShowLimitAlert] = useState(false);

  // Vérifier si on a déjà atteint la limite quotidienne
  const checkDailyLimit = () => {
    const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS];
    return userData.balance >= dailyLimit && userData.subscription === 'freemium';
  };

  // Vérifier si on peut démarrer une session manuelle
  const canStartManualSession = () => {
    // Vérifier le nombre de sessions par jour pour les comptes freemium
    if (userData.subscription === 'freemium') {
      return dailySessionCount < 1 && !checkDailyLimit();
    }
    // Les autres abonnements n'ont pas de limite de sessions
    return !checkDailyLimit();
  };

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
      // Initialize the balance to 0 for new users
      localStorage.setItem('user_balance', '0');
      localStorage.setItem('daily_session_count', '0');
    }
    
    // Vérifier si on doit afficher l'alerte de limite journalière
    if (checkDailyLimit()) {
      setShowLimitAlert(true);
    }
    
    // Reset des sessions quotidiennes à minuit (heure de Paris)
    const checkMidnightReset = () => {
      const now = new Date();
      const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
      
      if (parisTime.getHours() === 0 && parisTime.getMinutes() === 0) {
        // Reset à minuit
        localStorage.setItem('daily_session_count', '0');
        setDailySessionCount(0);
        
        // On réinitialise aussi le solde pour les comptes freemium
        if (userData.subscription === 'freemium') {
          localStorage.setItem('user_balance', '0');
          setUserData(prev => ({...prev, balance: 0}));
          setShowLimitAlert(false);
        }
      }
    };
    
    // Vérifier toutes les minutes pour le reset de minuit
    const midnightInterval = setInterval(checkMidnightReset, 60000);
    
    return () => clearInterval(midnightInterval);
  }, [userData.subscription]);

  // Effet pour simuler l'analyse automatique des publicités
  useEffect(() => {
    const autoSessionInterval = setInterval(() => {
      // Vérifier si 5 minutes (300000 ms) se sont écoulées depuis la dernière session
      // Et que la limite journalière n'a pas été atteinte
      if (Date.now() - lastAutoSessionTime >= 300000 && !checkDailyLimit()) {
        generateAutomaticRevenue();
        setLastAutoSessionTime(Date.now());
      }
    }, 60000); // Vérifier toutes les minutes

    return () => clearInterval(autoSessionInterval);
  }, [lastAutoSessionTime, userData.subscription, userData.balance]);

  const generateAutomaticRevenue = () => {
    // Obtenir la limite de gain pour l'abonnement actuel
    const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Calculer le montant restant avant d'atteindre la limite
    const remainingAmount = dailyLimit - userData.balance;
    
    // Si on a déjà atteint la limite, on ne génère pas de revenus
    if (remainingAmount <= 0) {
      setShowLimitAlert(true);
      return;
    }
    
    // Générer un gain aléatoire en fonction de l'abonnement (entre 20% et 80% de la limite restante)
    const minGain = Math.min(dailyLimit * 0.1, remainingAmount);
    const maxGain = Math.min(dailyLimit * 0.3, remainingAmount);
    const randomGain = parseFloat((Math.random() * (maxGain - minGain) + minGain).toFixed(2));
    
    // Mettre à jour les données utilisateur
    setUserData(prev => {
      const newBalance = parseFloat((prev.balance + randomGain).toFixed(2));
      // Sauvegarder le nouveau solde dans localStorage
      localStorage.setItem('user_balance', newBalance.toString());
      
      // Vérifier si on a atteint la limite après cette opération
      if (newBalance >= dailyLimit && prev.subscription === 'freemium') {
        setShowLimitAlert(true);
      }
      
      return {
        ...prev,
        balance: newBalance,
        transactions: [
          {
            date: new Date().toISOString().split('T')[0],
            gain: randomGain,
            report: `Le système a généré ${randomGain}€ de revenus grâce à notre technologie propriétaire. Votre abonnement ${prev.subscription} vous permet d'accéder à ce niveau de performance.`
          },
          ...prev.transactions
        ]
      };
    });

    // Notification de gain
    toast({
      title: "Revenus générés",
      description: `CashBot a généré ${randomGain}€ pour vous !`,
    });
  };

  const handleStartSession = () => {
    // Vérifier si on peut démarrer une session
    if (!canStartManualSession()) {
      // Si c'est un compte freemium et qu'on a atteint la limite de sessions
      if (userData.subscription === 'freemium' && dailySessionCount >= 1) {
        toast({
          title: "Limite de sessions atteinte",
          description: "Votre abonnement Freemium est limité à 1 session manuelle par jour. Passez à un forfait supérieur pour plus de sessions.",
          variant: "destructive"
        });
        return;
      }
      
      // Si on a atteint la limite journalière
      if (checkDailyLimit()) {
        setShowLimitAlert(true);
        toast({
          title: "Limite journalière atteinte",
          description: `Vous avez atteint votre limite de gain journalier de ${SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS]}€. Revenez demain ou passez à un forfait supérieur.`,
          variant: "destructive"
        });
        return;
      }
    }
    
    setIsStartingSession(true);
    
    // Incrémenter le compteur de sessions quotidiennes pour les comptes freemium
    if (userData.subscription === 'freemium') {
      const newCount = dailySessionCount + 1;
      setDailySessionCount(newCount);
      localStorage.setItem('daily_session_count', newCount.toString());
    }
    
    // Simuler une session manuelle
    setTimeout(() => {
      setIsStartingSession(false);
      
      // Obtenir la limite de gain pour l'abonnement actuel
      const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Calculer le montant restant avant d'atteindre la limite
      const remainingAmount = dailyLimit - userData.balance;
      
      // Générer un gain aléatoire en fonction de l'abonnement (plus élevé que les sessions auto, mais limité par le reste disponible)
      const minGain = Math.min(dailyLimit * 0.2, remainingAmount);
      const maxGain = Math.min(dailyLimit * 0.5, remainingAmount);
      const randomGain = parseFloat((Math.random() * (maxGain - minGain) + minGain).toFixed(2));
      
      // Mettre à jour les données utilisateur
      setUserData(prev => {
        const newBalance = parseFloat((prev.balance + randomGain).toFixed(2));
        // Vérifier si on a atteint la limite
        const limitReached = newBalance >= dailyLimit && prev.subscription === 'freemium';
        
        if (limitReached) {
          setShowLimitAlert(true);
        }
        
        // Sauvegarder le nouveau solde dans localStorage
        localStorage.setItem('user_balance', newBalance.toString());
        
        return {
          ...prev,
          balance: newBalance,
          transactions: [
            {
              date: new Date().toISOString().split('T')[0],
              gain: randomGain,
              report: `Session manuelle : Notre technologie a optimisé le processus et généré ${randomGain}€ de revenus pour votre compte ${prev.subscription}.`
            },
            ...prev.transactions
          ]
        };
      });
      
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
      setUserData(prev => {
        // Sauvegarder le nouveau solde (0) dans localStorage
        localStorage.setItem('user_balance', '0');
        
        return {
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
        };
      });
    }
  };

  return (
    <DashboardLayout
      username={userData.username}
      subscription={userData.subscription}
      selectedNavItem={selectedNavItem}
      setSelectedNavItem={setSelectedNavItem}
    >
      {showLimitAlert && userData.subscription === 'freemium' && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <AlertTitle className="text-yellow-800">Limite journalière atteinte</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Vous avez atteint votre limite de gain journalier de {SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS]}€ avec votre compte Freemium. 
            <br />Passez à un forfait supérieur pour augmenter vos gains ou revenez demain.
          </AlertDescription>
        </Alert>
      )}
      
      <DashboardMetrics
        balance={userData.balance}
        referralLink={userData.referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        handleWithdrawal={handleWithdrawal}
        transactions={userData.transactions}
        isNewUser={isNewUser}
        subscription={userData.subscription}
        dailySessionCount={dailySessionCount}
        canStartSession={canStartManualSession()}
      />
    </DashboardLayout>
  );
};

export default Dashboard;

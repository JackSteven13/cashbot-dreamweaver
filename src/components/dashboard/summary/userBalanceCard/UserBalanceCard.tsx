
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemProgressBar } from '@/components/dashboard/SystemProgressBar';
import ActionButtons from './components/ActionButtons';
import UserBalanceDisplay from './components/UserBalanceDisplay';
import { Circle, CircleDollarSign } from 'lucide-react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';
import balanceManager from '@/utils/balance/balanceManager';
import { supabase } from '@/integrations/supabase/client';

interface UserBalanceCardProps {
  balance: number;
  subscription?: string;
  isStartingSession?: boolean;
  onStartSession?: () => void;
  onWithdrawal?: () => void;
  dailySessionCount?: number;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
  userId?: string;
}

const UserBalanceCard: React.FC<UserBalanceCardProps> = ({
  balance,
  subscription = 'freemium',
  isStartingSession = false,
  onStartSession = () => {},
  onWithdrawal,
  dailySessionCount = 0,
  lastSessionTimestamp = '',
  isBotActive = true,
  userId
}) => {
  const [displayBalance, setDisplayBalance] = useState(Number(balance || 0));
  const [dailyLimit] = useState(() => {
    return SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  });
  const [todaysGains, setTodaysGains] = useState(0);
  const [limitPercentage, setLimitPercentage] = useState(0);
  
  // Charger les gains quotidiens au démarrage (depuis la base de données si possible)
  useEffect(() => {
    const fetchDailyGains = async () => {
      if (!userId) {
        // Utiliser les gains locaux si userId n'est pas disponible
        const localGains = balanceManager.getDailyGains();
        setTodaysGains(localGains);
        setLimitPercentage(Math.min(100, (localGains / dailyLimit) * 100));
        return;
      }
      
      try {
        // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];
        
        // Récupérer les transactions d'aujourd'hui depuis la base de données
        const { data, error } = await supabase
          .from('transactions')
          .select('gain')
          .eq('user_id', userId)
          .like('date', `${today}%`);
          
        if (!error && data) {
          // Calculer les gains totaux d'aujourd'hui
          const calculatedGains = data.reduce((sum, tx) => sum + (tx.gain || 0), 0);
          
          // Mettre à jour le gestionnaire de solde local
          balanceManager.setDailyGains(calculatedGains);
          
          // Mettre à jour l'état local
          setTodaysGains(calculatedGains);
          setLimitPercentage(Math.min(100, (calculatedGains / dailyLimit) * 100));
        }
      } catch (err) {
        console.error("Erreur lors du calcul des gains quotidiens:", err);
        // Fallback aux gains locaux
        const localGains = balanceManager.getDailyGains();
        setTodaysGains(localGains);
        setLimitPercentage(Math.min(100, (localGains / dailyLimit) * 100));
      }
    };
    
    fetchDailyGains();
    
    // Écouter les mises à jour du solde
    const handleBalanceUpdate = (event: any) => {
      if (event.detail && (event.detail.gain || event.detail.amount)) {
        const gain = event.detail.gain || event.detail.amount || 0;
        // Mettre à jour les gains quotidiens
        const newGains = todaysGains + gain;
        setTodaysGains(newGains);
        setLimitPercentage(Math.min(100, (newGains / dailyLimit) * 100));
      }
    };
    
    window.addEventListener('balance:update', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate);
    };
  }, [userId, dailyLimit]);
  
  // Mettre à jour le solde affiché
  useEffect(() => {
    setDisplayBalance(Number(balance || 0));
  }, [balance]);

  const canStartSession = !isStartingSession && (!dailySessionCount || dailySessionCount < 100);
  
  // Pour les comptes freemium, strict maximum 1 session par jour
  const canWithdraw = !!onWithdrawal && displayBalance > 0;

  return (
    <Card className="border-0 shadow-sm dark:bg-card/40">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 md:px-6">
        <CardTitle className="flex items-center space-x-2 text-lg md:text-xl font-display">
          <Circle className="h-5 w-5 fill-blue-400 text-blue-600" />
          <span>Votre solde</span>
        </CardTitle>
        <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 pt-2 md:pt-4 flex flex-col space-y-5">
        <UserBalanceDisplay 
          displayBalance={displayBalance}
          subscription={subscription}
        />
        
        <SystemProgressBar 
          displayBalance={todaysGains}
          dailyLimit={dailyLimit}
          limitPercentage={limitPercentage}
          subscription={subscription}
          botActive={isBotActive}
        />
        
        <ActionButtons 
          isStartingSession={isStartingSession}
          onStartSession={onStartSession}
          onWithdrawal={onWithdrawal}
          canStartSession={canStartSession}
          canWithdraw={canWithdraw}
          subscription={subscription}
          isBotActive={isBotActive}
          useAnimation={true}
        />
      </CardContent>
    </Card>
  );
};

export default UserBalanceCard;

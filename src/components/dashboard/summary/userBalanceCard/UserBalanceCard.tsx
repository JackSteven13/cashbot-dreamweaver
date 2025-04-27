
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import ProgressBar from './components/ProgressBar';
import ActionButtons from './components/ActionButtons';
import UserBalanceDisplay from './components/UserBalanceDisplay';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

interface UserBalanceCardProps {
  balance: number;
  isNewUser?: boolean;
  subscription?: string;
  dailyLimit?: number;
  referralCount?: number;
  referralBonus?: number;
  withdrawalThreshold?: number;
  isStartingSession?: boolean;
  onStartSession?: () => void;
  onWithdrawal?: () => void;
  dailySessionCount?: number;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
  userId?: string;
}

const UserBalanceCard = ({
  balance = 0,
  isNewUser = false,
  subscription = 'freemium',
  dailyLimit = 0.5,
  referralCount = 0,
  referralBonus = 0,
  withdrawalThreshold,
  isStartingSession = false,
  onStartSession,
  onWithdrawal,
  dailySessionCount = 0,
  lastSessionTimestamp = '',
  isBotActive = true,
  userId
}: UserBalanceCardProps) => {
  const { user } = useAuth();
  const actualUserId = userId || user?.id || 'anonymous';
  
  // Assurer que le solde est toujours un nombre valide
  const safeBalance = isNaN(balance) ? 0 : balance;
  const safeReferralBonus = isNaN(referralBonus) ? 0 : referralBonus;
  
  // Utiliser une clé spécifique à l'utilisateur pour le stockage local
  const localStorageKey = `lastKnownBalance_${actualUserId}`;
  const [locallyStoredBalance, setLocallyStoredBalance] = useState<number>(0);
  
  // Charger la valeur du localStorage lors du montage du composant
  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(localStorageKey);
      const parsedValue = storedValue ? parseFloat(storedValue) : 0;
      setLocallyStoredBalance(isNaN(parsedValue) ? 0 : parsedValue);
    } catch (e) {
      console.error("Erreur lors de la lecture du localStorage:", e);
    }
  }, [localStorageKey, actualUserId]); // Se déclenche quand l'utilisateur change
  
  // Solde effectif à afficher
  const effectiveBalance = Math.max(
    safeBalance,
    locallyStoredBalance
  );
  
  const GainsDisplay = ({ showGains, referralBonus }: { showGains: boolean; referralBonus?: number }) => (
    showGains ? (
      <div className="flex items-center text-sm font-medium opacity-75 mt-1">
        <Sparkles className="mr-1 h-4 w-4" />
        Gains: {(effectiveBalance - safeReferralBonus).toFixed(2)}€ (+{safeReferralBonus.toFixed(2)}€ parrainage)
      </div>
    ) : null
  );
  
  const ReferralInfo = ({ referralCount }: { referralCount: number }) => (
    <div className="text-xs opacity-60 mt-2">
      {referralCount} filleul{referralCount !== 1 ? 's' : ''} actif{referralCount !== 1 ? 's' : ''}
    </div>
  );
  
  const SubscriptionInfo = ({ subscription }: { subscription: string }) => {
    const getSubscriptionLabel = (sub: string) => {
      switch (sub) {
        case 'freemium': return 'Gratuit';
        case 'starter': return 'Starter';
        case 'gold': return 'Gold';
        case 'elite': return 'Elite';
        default: return 'Inconnu';
      }
    };
    
    // Utiliser une clé spécifique à l'utilisateur pour la dernière activité
    const lastActiveKey = `lastActive_${actualUserId}`;
    const [lastActive, setLastActive] = useState<string | null>(null);
    
    // Charger la valeur du localStorage lors du montage du composant
    useEffect(() => {
      try {
        const storedValue = localStorage.getItem(lastActiveKey);
        setLastActive(storedValue);
      } catch (e) {
        console.error("Erreur lors de la lecture de la dernière activité:", e);
      }
    }, [lastActiveKey, actualUserId]); // Se déclenche quand l'utilisateur change
    
    // Mettre à jour la dernière activité lors du montage du composant
    useEffect(() => {
      try {
        localStorage.setItem(lastActiveKey, new Date().toISOString());
      } catch (e) {
        console.error("Erreur lors de l'enregistrement de la dernière activité:", e);
      }
    }, [lastActiveKey]);
    
    const formattedDate = lastActive ? format(new Date(lastActive), 'dd MMMM yyyy', { locale: fr }) : null;
    
    return (
      <div className="flex items-center justify-between text-xs opacity-60 mt-2">
        <span>Abonnement: {getSubscriptionLabel(subscription)}</span>
        {formattedDate && <span>Dernière activité: {formattedDate}</span>}
      </div>
    );
  };
  
  return (
    <Card className="bg-[#121723] text-white border-none overflow-hidden relative">
      <CardHeader className="px-4 pt-4 pb-0">
        <CardTitle className="text-base">
          Solde disponible
          {isNewUser && (
            <Badge variant="secondary" className="ml-2">
              Nouveau
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <UserBalanceDisplay balance={effectiveBalance} isNewUser={isNewUser} />
        <GainsDisplay showGains={!isNewUser && effectiveBalance > 0} referralBonus={safeReferralBonus} />
        <ProgressBar 
          displayBalance={effectiveBalance} 
          subscription={subscription} 
          withdrawalThreshold={withdrawalThreshold}
        />
        <ReferralInfo referralCount={referralCount} />
        <SubscriptionInfo subscription={subscription} />

        {onStartSession && (
          <ActionButtons 
            isStartingSession={isStartingSession}
            onStartSession={onStartSession}
            onWithdrawal={onWithdrawal}
            dailySessionCount={dailySessionCount}
            subscription={subscription}
            lastSessionTimestamp={lastSessionTimestamp}
            isBotActive={isBotActive}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default UserBalanceCard;

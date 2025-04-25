
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface UserBalanceCardProps {
  balance: number;
  subscription?: string;
  isStartingSession?: boolean;
  onStartSession?: () => void;
  onWithdrawal?: () => void;
  dailySessionCount?: number;
  lastSessionTimestamp?: string;
  isNewUser?: boolean;
  canStartSession?: boolean;
  isBotActive?: boolean;
  userId?: string;
}

const UserBalanceCard = ({
  balance = 0,
  subscription = 'freemium',
  isStartingSession = false,
  onStartSession,
  onWithdrawal,
  dailySessionCount = 0,
  lastSessionTimestamp,
  isNewUser = false,
  canStartSession = true,
  isBotActive = true,
  userId
}: UserBalanceCardProps) => {
  const { toast } = useToast();
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (balance !== displayBalance) {
      setIsAnimating(true);
      setDisplayBalance(balance);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [balance, displayBalance]);
  
  const handleSessionStart = () => {
    if (onStartSession) onStartSession();
  };
  
  const handleWithdrawal = () => {
    if (onWithdrawal) onWithdrawal();
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden bg-blue-900 dark:bg-[#0f172a] border-0 shadow-lg">
        <CardContent className="p-6 text-white">
          <div className="flex items-center mb-6">
            <Sparkles className="h-6 w-6 text-blue-300 mr-2" />
            <h3 className="text-xl font-semibold text-white">Votre solde</h3>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-gray-300 mb-1">Solde</p>
            <p className={`text-4xl font-bold mb-2 ${isAnimating ? 'text-green-400' : 'text-white'}`}>
              {displayBalance.toFixed(2)} EUR
            </p>
            <p className="text-sm text-gray-300">Plan: {subscription}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button 
              onClick={handleSessionStart}
              disabled={isStartingSession || !canStartSession || !isBotActive}
              className="bg-red-600 hover:bg-red-700 text-white w-full"
            >
              {isStartingSession ? 'En cours...' : 'Limite (1/jour)'}
            </Button>
            
            <Button
              onClick={handleWithdrawal}
              disabled={balance < 20}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
            >
              {balance < 20 ? (
                <div className="flex items-center">
                  <Lock className="mr-2 h-4 w-4" />
                  Retirer
                </div>
              ) : 'Retirer'}
            </Button>
            
            <Button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/?ref=${userId}`);
                toast({ 
                  title: "Lien copié",
                  description: "Le lien de parrainage a été copié dans le presse-papiers."
                });
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full"
            >
              Programme d'affiliation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserBalanceCard;

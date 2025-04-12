
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Gauge } from 'lucide-react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';
import { motion } from 'framer-motion';

interface BalanceProgressProps {
  subscription?: string;
  dailySessionCount?: number;
  dailyLimitProgress?: number;
  dailyGains?: number;
}

const BalanceProgress: React.FC<BalanceProgressProps> = ({
  subscription = 'freemium',
  dailySessionCount = 0,
  dailyLimitProgress = 0,
  dailyGains = 0,
}) => {
  const [limitProgress, setLimitProgress] = useState<number>(dailyLimitProgress || 0);
  const [currentGains, setCurrentGains] = useState<number>(dailyGains || 0);
  
  // Calculate daily limit based on subscription
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  useEffect(() => {
    // Set initial progress
    const initialProgress = Math.min(100, ((dailyGains || 0) / dailyLimit) * 100);
    setLimitProgress(initialProgress);
    setCurrentGains(dailyGains || 0);
    
    // Listen for updates to daily gains
    const handleDailyGainsUpdate = (event: Event) => {
      if ('detail' in event) {
        const { gains } = (event as CustomEvent).detail;
        const newProgress = Math.min(100, (gains / dailyLimit) * 100);
        setLimitProgress(newProgress);
        setCurrentGains(gains);
      }
    };
    
    window.addEventListener('dailyGains:updated', handleDailyGainsUpdate);
    window.addEventListener('dailyGains:reset', () => {
      setLimitProgress(0);
      setCurrentGains(0);
    });
    
    // Initial calculation
    const storedGains = balanceManager.getDailyGains();
    if (storedGains > 0) {
      const progress = Math.min(100, (storedGains / dailyLimit) * 100);
      setLimitProgress(progress);
      setCurrentGains(storedGains);
    }
    
    return () => {
      window.removeEventListener('dailyGains:updated', handleDailyGainsUpdate);
      window.removeEventListener('dailyGains:reset', () => {});
    };
  }, [dailyLimit, dailyGains, subscription]);
  
  return (
    <div className="mb-6 animate-fadeIn">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium flex items-center">
          <Gauge className="w-4 h-4 mr-1.5 text-blue-500" />
          Limite quotidienne ({subscription})
        </span>
        <motion.span 
          className="text-sm font-medium"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          key={currentGains}
        >
          {currentGains.toFixed(2)}€ / {dailyLimit}€
        </motion.span>
      </div>
      <Progress 
        value={limitProgress} 
        className="h-2" 
      />
    </div>
  );
};

export default BalanceProgress;

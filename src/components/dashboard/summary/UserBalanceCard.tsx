import React, { useState, useEffect } from 'react';
import { Sparkles, Users, Bot, Network, TrendingUp, Award, ChevronsUp } from 'lucide-react';
import { WITHDRAWAL_THRESHOLDS } from '@/components/dashboard/summary/constants';

interface UserBalanceCardProps {
  displayBalance: number;
  balance?: number;
  subscription: string;
  dailyLimit: number;
  referralCount?: number;
  referralBonus?: number;
  networkGains?: number;
  botGains?: number;
  totalGeneratedBalance?: number;
  lastSessionTimestamp?: string;
  sessionsDisplay?: string;
}

const UserBalanceCard: React.FC<UserBalanceCardProps> = ({
  displayBalance,
  subscription,
  dailyLimit,
  sessionsDisplay = 'illimitées',
  referralCount = 0,
  referralBonus = 0,
  networkGains = displayBalance * 0.3,
  botGains = displayBalance * 0.7,
  totalGeneratedBalance = displayBalance * 1.2,
  lastSessionTimestamp
}) => {
  const withdrawalThreshold = WITHDRAWAL_THRESHOLDS[subscription as keyof typeof WITHDRAWAL_THRESHOLDS] || 200;
  const [glowActive, setGlowActive] = useState(false);
  const [balanceAnimating, setBalanceAnimating] = useState(false);
  const [animatedBalance, setAnimatedBalance] = useState(displayBalance);
  const [previousBalance, setPreviousBalance] = useState(displayBalance);
  
  useEffect(() => {
    const handleBalanceUpdate = (e: CustomEvent) => {
      const newAmount = e.detail?.amount || 0;
      setPreviousBalance(displayBalance);
      setBalanceAnimating(true);
      
      const startValue = displayBalance;
      const endValue = displayBalance + newAmount;
      const duration = 1000;
      const startTime = Date.now();
      
      const updateValue = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        
        if (elapsed < duration) {
          const progress = elapsed / duration;
          const currentValue = startValue + (endValue - startValue) * progress;
          setAnimatedBalance(currentValue);
          requestAnimationFrame(updateValue);
        } else {
          setAnimatedBalance(endValue);
          setBalanceAnimating(false);
        }
      };
      
      requestAnimationFrame(updateValue);
    };
    
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    return () => window.removeEventListener('balance:update' as any, handleBalanceUpdate);
  }, [displayBalance]);
  
  const progressPercentage = Math.min(Math.floor((displayBalance / withdrawalThreshold) * 100), 95);
  const isNearThreshold = progressPercentage >= 80;
  const isAtMaximum = progressPercentage >= 95;
  
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setGlowActive(true);
      setTimeout(() => setGlowActive(false), 3000);
    }, Math.random() * 5000 + 2000);
    
    const intervalTimer = setInterval(() => {
      setGlowActive(true);
      setTimeout(() => setGlowActive(false), 3000);
    }, Math.random() * 10000 + 15000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, []);
  
  useEffect(() => {
    if (balanceAnimating) {
      setGlowActive(true);
    } else {
      setTimeout(() => setGlowActive(false), 3000);
    }
  }, [balanceAnimating]);
  
  return (
    <div className="mb-6">
      <div className={`bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white transition-all duration-500 ${glowActive ? 'glow-effect' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white/90">Solde Disponible</h3>
          <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
            Max {dailyLimit}€/jour
          </div>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className={`text-3xl font-bold ${balanceAnimating ? 'balance-increase text-green-300' : ''}`}>
              {animatedBalance.toFixed(2)}€
            </span>
            {balanceAnimating && (
              <span className="text-green-400 text-sm animate-fade-in">
                +{(animatedBalance - previousBalance).toFixed(2)}€
              </span>
            )}
            {referralBonus > 0 && (
              <div className="bg-green-500/30 text-green-200 text-xs px-2 py-1 rounded-full flex items-center">
                <Sparkles className="h-3 w-3 mr-1" />
                +{referralBonus}%
              </div>
            )}
          </div>
          <p className="text-xs text-white/60 mt-1">
            sur {totalGeneratedBalance.toFixed(2)}€ générés
          </p>
        </div>
        
        <div className="mt-3 mb-1">
          <div className="w-full bg-slate-700/70 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${progressPercentage >= 95 ? 'bg-yellow-500' : progressPercentage >= 80 ? 'bg-amber-500' : 'bg-[#9b87f5]'} transition-all duration-1000`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>{progressPercentage}%</span>
            <span>
              {progressPercentage >= 95 ? (
                <span className="text-yellow-300 flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  Quelques euros restants!
                </span>
              ) : (
                `Seuil: ${withdrawalThreshold}€`
              )}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-5">
          <div className="bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border border-white/5 hover:border-[#9b87f5]/30 transition-all duration-300 group">
            <div className="text-xs text-white/70 mb-1">Abonnement</div>
            <div className="font-medium capitalize flex items-center">
              {subscription}
              {subscription !== 'freemium' && (
                <span className="ml-2">
                  <Award size={14} className="text-[#9b87f5] group-hover:animate-pulse" />
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border border-white/5 hover:border-[#9b87f5]/30 transition-all duration-300">
            <div className="text-xs text-white/70 mb-1">Sessions</div>
            <div className="font-medium">{sessionsDisplay}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-emerald-900/20 backdrop-blur-sm rounded-lg p-3 border border-emerald-800/30 flex justify-between items-center group hover:bg-emerald-900/30 transition-all duration-300">
            <div>
              <div className="text-xs text-white/70 mb-1 flex items-center">
                <Network className="h-3 w-3 mr-1 text-emerald-400 group-hover:animate-pulse" />
                Gains réseau
              </div>
              <div className="font-medium text-emerald-300">{networkGains.toFixed(2)}€</div>
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-400/70" />
          </div>
          
          <div className="bg-blue-900/20 backdrop-blur-sm rounded-lg p-3 border border-blue-800/30 flex justify-between items-center group hover:bg-blue-900/30 transition-all duration-300">
            <div>
              <div className="text-xs text-white/70 mb-1 flex items-center">
                <Bot className="h-3 w-3 mr-1 text-blue-400 group-hover:animate-pulse" />
                Gains bots*
              </div>
              <div className="font-medium text-blue-300">{botGains.toFixed(2)}€</div>
            </div>
            <ChevronsUp className="h-4 w-4 text-blue-400/70" />
          </div>
        </div>
        
        {referralCount > 0 ? (
          <div className="mt-4 bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border border-white/5 flex justify-between items-center hover:border-[#9b87f5]/30 transition-all duration-300 group">
            <div>
              <div className="text-xs text-white/70 mb-1">Filleuls actifs</div>
              <div className="font-medium flex items-center">
                {referralCount} {referralCount > 1 ? 'personnes' : 'personne'}
                <span className="text-green-400 ml-2 text-xs">(+{referralBonus}% de gains)</span>
              </div>
            </div>
            <Users className="h-5 w-5 text-white/70 group-hover:text-[#9b87f5] transition-colors duration-300" />
          </div>
        ) : (
          <div className="mt-4 bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border border-white/5 flex justify-between items-center opacity-80 hover:opacity-100 hover:border-[#9b87f5]/30 transition-all duration-300 group">
            <div>
              <div className="text-xs text-white/70 mb-1">Filleuls actifs</div>
              <div className="font-medium text-white/80">Aucun filleul</div>
            </div>
            <Users className="h-5 w-5 text-white/50 group-hover:text-[#9b87f5] transition-colors duration-300" />
          </div>
        )}
        
        <div className="mt-3 text-xs text-white/50 italic">
          * Les gains bots sont estimatifs et peuvent varier
        </div>
      </div>
    </div>
  );
};

export default UserBalanceCard;

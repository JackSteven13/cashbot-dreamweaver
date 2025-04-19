
import React, { useEffect, useState } from 'react';
import { Check, ChevronUp, TrendingUp, Calendar } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AnimatePresence, motion } from "framer-motion";
import { formatRevenue } from '@/utils/formatters';

interface AutoProgressNotificationProps {
  delay?: number;
}

const AutoProgressNotification = ({ delay = 4000 }: AutoProgressNotificationProps) => {
  const [visible, setVisible] = useState(false);
  const [progressData, setProgressData] = useState<{
    amount: number;
    daysMissed: number;
    consecutiveVisitDays: number;
  } | null>(null);

  useEffect(() => {
    const handleDailyProgress = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      
      if (data && data.amount && data.amount > 0) {
        setProgressData({
          amount: data.amount,
          daysMissed: data.daysMissed || 1,
          consecutiveVisitDays: data.consecutiveVisitDays || 1
        });
        
        setTimeout(() => {
          setVisible(true);
          
          // Masquer après 7 secondes
          setTimeout(() => {
            setVisible(false);
          }, 7000);
        }, delay);
      }
    };

    window.addEventListener('balance:daily-growth', handleDailyProgress as EventListener);
    
    return () => {
      window.removeEventListener('balance:daily-growth', handleDailyProgress as EventListener);
    };
  }, [delay]);

  if (!progressData) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
        >
          <Alert className="bg-blue-900 border-blue-600 text-white">
            <TrendingUp className="h-5 w-5 text-blue-300" />
            <AlertTitle className="mb-2 flex items-center">
              <span>Progression automatique</span>
              <span className="ml-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                <Check className="h-3 w-3 mr-0.5" /> Actif
              </span>
            </AlertTitle>
            <AlertDescription className="text-blue-100">
              <div className="flex items-center justify-between mb-1">
                <span>Gain automatique généré</span>
                <span className="font-semibold text-green-300 flex items-center">
                  <ChevronUp className="h-4 w-4 mr-0.5" />
                  +{formatRevenue(progressData.amount)}
                </span>
              </div>
              <div className="flex items-center text-xs text-blue-200 mt-2">
                <Calendar className="h-3 w-3 mr-1" />
                <span>
                  {progressData.daysMissed > 1 
                    ? `Progression sur ${progressData.daysMissed} jours` 
                    : "Progression quotidienne"}
                </span>
                <span className="ml-auto flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Jour {progressData.consecutiveVisitDays}
                </span>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AutoProgressNotification;

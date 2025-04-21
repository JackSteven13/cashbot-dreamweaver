
import React, { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { TrendingUp, Clock } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

/**
 * Composant de notification pour la progression automatique
 * Affiche une notification lorsque l'utilisateur revient après une absence
 */
const AutoProgressNotification = () => {
  const [showAlert, setShowAlert] = useState(false);
  const [progressData, setProgressData] = useState<{
    amount: number;
    daysMissed: number;
    consecutiveVisitDays: number;
  } | null>(null);

  useEffect(() => {
    // Gestionnaire pour les événements de progression quotidienne
    const handleDailyGrowth = (event: CustomEvent) => {
      console.log("Progression quotidienne détectée:", event.detail);
      
      const amount = event.detail?.amount || 0;
      const daysMissed = event.detail?.daysMissed || 0;
      const consecutiveVisitDays = event.detail?.consecutiveVisitDays || 1;
      
      // Ne montrer que si c'est significatif
      if (amount > 0.01 && daysMissed > 0) {
        setProgressData({
          amount,
          daysMissed,
          consecutiveVisitDays
        });
        
        setTimeout(() => {
          setShowAlert(true);
        }, 1500);
        
        // Notification toast pour informer l'utilisateur
        toast({
          title: `Progression pendant votre absence`,
          description: `Votre solde a progressé de ${amount.toFixed(2)}€ durant les ${daysMissed} jour(s) d'absence.`,
          duration: 6000,
        });
      }
    };
    
    // Écouter l'événement de progression quotidienne
    window.addEventListener('balance:daily-growth', handleDailyGrowth as EventListener);
    
    return () => {
      window.removeEventListener('balance:daily-growth', handleDailyGrowth as EventListener);
    };
  }, []);
  
  // Masquer l'alerte après un certain temps
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 10000); // 10 secondes
      
      return () => clearTimeout(timer);
    }
  }, [showAlert]);
  
  if (!showAlert || !progressData) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-fade-in">
      <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-800 dark:text-green-300">
          Progression automatique
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-400 text-sm">
          <p>Votre solde a progressé de <span className="font-bold">{progressData.amount.toFixed(2)}€</span> pendant votre absence.</p>
          <div className="flex items-center mt-1 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            <span>
              {progressData.daysMissed} jour(s) d'activité - {progressData.consecutiveVisitDays} jour(s) consécutifs
            </span>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AutoProgressNotification;

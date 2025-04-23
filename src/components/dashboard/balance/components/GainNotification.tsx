
import React from 'react';
import { ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface GainNotificationProps {
  gainAmount: number;
  showGain: boolean;
}

export const GainNotification: React.FC<GainNotificationProps> = ({
  gainAmount,
  showGain
}) => {
  return (
    <AnimatePresence>
      {showGain && gainAmount > 0 && (
        <motion.div 
          className="absolute -top-4 md:top-4 right-0 text-sm text-green-500 flex items-center animate-bounce z-20"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -15 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5 }}
        >
          <ChevronUp className="h-3 w-3 mr-0.5" />
          +{gainAmount.toFixed(2)}€
        </motion.div>
      )}
    </AnimatePresence>
  );
};

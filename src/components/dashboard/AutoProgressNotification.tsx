
import React, { useState, useEffect, useRef } from 'react';

const AutoProgressNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.message) {
        setMessage(customEvent.detail.message);
        setIsVisible(true);
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Set timeout to hide notification
        timeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, customEvent.detail.duration || 3000);
      }
    };

    window.addEventListener('dashboard:notification', handleNotification as EventListener);
    
    return () => {
      window.removeEventListener('dashboard:notification', handleNotification as EventListener);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-5 right-5 bg-gradient-to-r from-blue-500/90 to-indigo-600/90 text-white p-4 rounded-lg shadow-lg z-50 max-w-xs animate-fade-in">
      <div className="font-medium">{message}</div>
    </div>
  );
};

export default AutoProgressNotification;

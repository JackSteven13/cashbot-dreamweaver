
import React from 'react';

const PaymentLoading = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0f0f23]">
      <div className="relative">
        {/* Effet de lueur */}
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl"></div>
        
        {/* Cercle animé */}
        <div className="relative w-24 h-24">
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="paymentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            
            {/* Cercle en arrière-plan */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#1e3a8a"
              strokeWidth="3"
              strokeOpacity="0.2"
            />
            
            {/* Arc animé */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="url(#paymentGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="251.2"
              strokeDashoffset="75"
              transform="rotate(-90 50 50)"
              className="origin-center animate-spin"
              style={{ animationDuration: '1.5s', animationTimingFunction: 'linear' }}
            />
            
            {/* Point central */}
            <circle cx="50" cy="50" r="4" fill="#f0f9ff" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default PaymentLoading;

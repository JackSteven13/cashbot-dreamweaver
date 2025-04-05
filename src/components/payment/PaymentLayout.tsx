
import React, { ReactNode } from 'react';
import PaymentHeader from '@/components/payment/PaymentHeader';
import SecurityNote from '@/components/payment/SecurityNote';

interface PaymentLayoutProps {
  children: ReactNode;
}

const PaymentLayout = ({ children }: PaymentLayoutProps) => {
  return (
    <div className="cyberpunk-bg min-h-screen bg-[#0f0f23] pb-12">
      <PaymentHeader />
      
      {/* Increased top padding for better spacing below header */}
      <main className="container mx-auto pt-16 pb-14 px-4 relative z-10">
        <div className="max-w-2xl mx-auto">
          {children}
          
          <SecurityNote />
        </div>
      </main>
    </div>
  );
};

export default PaymentLayout;

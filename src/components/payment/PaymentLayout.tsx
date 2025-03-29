
import React, { ReactNode } from 'react';
import PaymentHeader from '@/components/payment/PaymentHeader';
import SecurityNote from '@/components/payment/SecurityNote';

interface PaymentLayoutProps {
  children: ReactNode;
}

const PaymentLayout = ({ children }: PaymentLayoutProps) => {
  return (
    <div className="cyberpunk-bg min-h-screen">
      <PaymentHeader />
      
      <main className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {children}
          
          <SecurityNote />
        </div>
      </main>
    </div>
  );
};

export default PaymentLayout;

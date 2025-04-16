
import React from 'react';
import PaymentHeader from './PaymentHeader';

interface PaymentLayoutProps {
  children: React.ReactNode;
}

const PaymentLayout: React.FC<PaymentLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <PaymentHeader />
      <div className="flex-1 py-6 sm:py-10">
        {children}
      </div>
      <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto">
          <p>Paiement sécurisé via Stripe</p>
          <div className="mt-2 flex justify-center space-x-4">
            <img src="/visa.svg" alt="Visa" className="h-6" />
            <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
            <img src="/amex.svg" alt="American Express" className="h-6" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PaymentLayout;

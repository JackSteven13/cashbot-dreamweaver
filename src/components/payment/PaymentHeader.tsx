
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PaymentHeader = () => {
  return (
    <header className="bg-[#1e3a5f] shadow-md p-5">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/offres" className="text-blue-200 hover:text-blue-100 hover:underline flex items-center font-medium">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Retour aux offres
            </Link>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Finaliser votre abonnement</h1>
        </div>
      </div>
    </header>
  );
};

export default PaymentHeader;


import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PaymentHeader = () => {
  return (
    <header className="bg-[#1e3a5f] shadow-md p-4">
      <div className="container mx-auto">
        <div className="flex items-center">
          <Link to="/offres" className="text-blue-200 hover:underline flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour aux offres
          </Link>
          <h1 className="text-2xl font-bold text-white ml-4">Paiement</h1>
        </div>
      </div>
    </header>
  );
};

export default PaymentHeader;

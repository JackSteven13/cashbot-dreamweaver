
import React from 'react';
import { Loader2 } from 'lucide-react';

const PaymentLoading = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0f0f23]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
    </div>
  );
};

export default PaymentLoading;

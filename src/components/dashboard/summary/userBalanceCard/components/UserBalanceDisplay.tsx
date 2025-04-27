
import React from 'react';

interface UserBalanceDisplayProps {
  balance: number;
  isNewUser?: boolean;
  className?: string;
}

const UserBalanceDisplay: React.FC<UserBalanceDisplayProps> = ({ 
  balance, 
  isNewUser = false,
  className = ''
}) => {
  const formattedBalance = isNewUser ? '0.00' : balance.toFixed(2);

  return (
    <div className={`text-3xl font-semibold tracking-tight ${className}`}>
      {formattedBalance}€
    </div>
  );
};

export default UserBalanceDisplay;

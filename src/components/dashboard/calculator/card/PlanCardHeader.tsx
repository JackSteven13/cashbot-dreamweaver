
import React from 'react';

interface PlanCardHeaderProps {
  title: string;
  price: number;
  description: string;
  subscriptionLabel?: string;
  subscriptionPrice?: number;
}

const PlanCardHeader: React.FC<PlanCardHeaderProps> = ({ 
  title, 
  price, 
  description, 
  subscriptionLabel, 
  subscriptionPrice 
}) => {
  return (
    <div>
      <h3 className="text-base md:text-xl font-bold text-gray-900 dark:text-white mb-2">
        {subscriptionLabel || title}
      </h3>
      <div className="mb-2">
        <span className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {subscriptionPrice || price}€
        </span>
        {(subscriptionPrice || price) > 0 && <span className="text-gray-500 dark:text-gray-400">/mois</span>}
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-2 text-xs md:text-sm">{description}</p>
    </div>
  );
};

export default PlanCardHeader;

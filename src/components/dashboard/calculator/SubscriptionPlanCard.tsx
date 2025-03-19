
import React from 'react';
import { PlanType } from '@/hooks/payment/types';

interface SubscriptionPlanCardProps {
  title: string;
  price: number;
  description: string;
  features: string[];
  limit: number;
  current?: boolean;
  mostPopular?: boolean;
  action: React.ReactNode;
}

const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  title,
  price,
  description,
  features,
  limit,
  current = false,
  mostPopular = false,
  action
}) => {
  return (
    <div className={`relative rounded-lg border-2 shadow-sm overflow-hidden transition-all ${
      mostPopular ? 'border-blue-500 transform scale-105 z-10' : 'border-gray-200 dark:border-gray-700'
    } ${current ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-white dark:bg-gray-800'}`}>
      {mostPopular && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-xs font-semibold rounded-bl">
          POPULAIRE
        </div>
      )}
      {current && (
        <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-xs font-semibold rounded-br">
          ACTUEL
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <div className="mb-4">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{price}€</span>
          {price > 0 && <span className="text-gray-500 dark:text-gray-400">/mois</span>}
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{description}</p>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Limite quotidienne: <span className="font-semibold text-blue-600 dark:text-blue-400">{limit}€</span>
          </p>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <svg className="h-5 w-5 text-green-500 shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          {action}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlanCard;

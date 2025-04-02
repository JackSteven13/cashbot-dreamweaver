
import React from 'react';

interface MobileTabsProps {
  activeTab: 'controls' | 'results';
  onTabChange: (tab: 'controls' | 'results') => void;
}

const MobileTabs: React.FC<MobileTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mt-3">
      <button
        onClick={() => onTabChange('controls')}
        className={`flex-1 py-2 px-4 text-sm font-medium text-center ${
          activeTab === 'controls'
            ? 'border-b-2 border-blue-500 text-blue-500'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
      >
        Paramètres
      </button>
      <button
        onClick={() => onTabChange('results')}
        className={`flex-1 py-2 px-4 text-sm font-medium text-center ${
          activeTab === 'results'
            ? 'border-b-2 border-blue-500 text-blue-500'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
      >
        Résultats
      </button>
    </div>
  );
};

export default MobileTabs;

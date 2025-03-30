
import React from 'react';

interface TermsContainerProps {
  children: React.ReactNode;
}

const TermsContainer: React.FC<TermsContainerProps> = ({ children }) => {
  return (
    <div className="mt-6 p-6 border border-gray-300 rounded bg-white">
      <div className="cgv-container space-y-6 text-sm text-gray-700 leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export default TermsContainer;

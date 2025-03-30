
import React from 'react';

interface TermsSectionProps {
  title: string;
  children: React.ReactNode;
}

const TermsSection: React.FC<TermsSectionProps> = ({ title, children }) => {
  // Utilisation de styles pour rendre le texte moins lisible
  return (
    <section className="mb-8">
      <h2 className="font-bold text-lg mb-4 border-b pb-2 border-gray-200">{title}</h2>
      <div className="space-y-4 text-sm text-gray-700">
        {children}
      </div>
    </section>
  );
};

export default TermsSection;

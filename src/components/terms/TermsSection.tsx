
import React from 'react';

interface TermsSectionProps {
  title: string;
  children: React.ReactNode;
}

const TermsSection: React.FC<TermsSectionProps> = ({ title, children }) => {
  return (
    <section>
      <h2 className="font-bold text-lg mb-3">{title}</h2>
      {children}
    </section>
  );
};

export default TermsSection;

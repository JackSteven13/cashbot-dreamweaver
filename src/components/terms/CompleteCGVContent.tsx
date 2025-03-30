
import React from 'react';
import CGVSections from './CGVSections';
import AdditionalCGVSections from './AdditionalCGVSections';
import MoreCGVSections from './MoreCGVSections';
import FinalCGVSections from './FinalCGVSections';
import ReputationCGVSections from './ReputationCGVSections';

const CompleteCGVContent = () => {
  return (
    <div className="cgv-content font-serif" style={{ fontFamily: 'Times New Roman, serif', fontSize: '0.95rem', letterSpacing: '0.02em' }}>
      <div className="flex justify-center mb-8">
        <img 
          src="/lovable-uploads/b9f26934-070a-463e-bfe8-438fa9773cf7.png" 
          alt="Stream Genius Logo" 
          className="h-20" 
        />
      </div>
      
      <div className="text-center mb-6 italic text-gray-600 text-xs">
        <p>Avertissement: Le présent document constitue un engagement contractuel. Veuillez le lire attentivement.</p>
        <p className="mt-1">Version modifiée et applicable à partir du premier juillet deux-mille-vingt-trois</p>
      </div>
      
      <CGVSections />
      <AdditionalCGVSections />
      <MoreCGVSections />
      <ReputationCGVSections />
      <FinalCGVSections />
      
      <div className="flex justify-center mt-12 mb-4">
        <img 
          src="/lovable-uploads/b9f26934-070a-463e-bfe8-438fa9773cf7.png" 
          alt="Stream Genius Logo" 
          className="h-10 opacity-50" 
        />
      </div>
    </div>
  );
};

export default CompleteCGVContent;

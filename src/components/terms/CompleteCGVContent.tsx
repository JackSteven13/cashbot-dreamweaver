
import React from 'react';
import CGVSections from './CGVSections';
import AdditionalCGVSections from './AdditionalCGVSections';
import MoreCGVSections from './MoreCGVSections';
import FinalCGVSections from './FinalCGVSections';
import ReputationCGVSections from './ReputationCGVSections';

const CompleteCGVContent = () => {
  return (
    <div className="cgv-content font-serif" style={{ fontFamily: 'Times New Roman, serif', fontSize: '0.95rem', letterSpacing: '0.02em' }}>
      <div className="text-center mb-6 italic text-gray-600 text-xs">
        <p>Avertissement: Le présent document constitue un engagement contractuel. Veuillez le lire attentivement.</p>
        <p className="mt-1">Version modifiée et applicable à partir du premier juillet deux-mille-vingt-trois</p>
      </div>
      
      <CGVSections />
      <AdditionalCGVSections />
      <MoreCGVSections />
      <ReputationCGVSections />
      <FinalCGVSections />
    </div>
  );
};

export default CompleteCGVContent;

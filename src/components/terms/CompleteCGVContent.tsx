
import React from 'react';
import CGVSections from './CGVSections';
import AdditionalCGVSections from './AdditionalCGVSections';
import MoreCGVSections from './MoreCGVSections';
import FinalCGVSections from './FinalCGVSections';

const CompleteCGVContent = () => {
  return (
    <>
      <CGVSections />
      <AdditionalCGVSections />
      <MoreCGVSections />
      <FinalCGVSections />
    </>
  );
};

export default CompleteCGVContent;

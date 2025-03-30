
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import CGVSections from './CGVSections';
import AdditionalCGVSections from './AdditionalCGVSections';
import MoreCGVSections from './MoreCGVSections';
import FinalCGVSections from './FinalCGVSections';
import ReputationCGVSections from './ReputationCGVSections';

const TermsAccordion = () => {
  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="section-1">
        <AccordionTrigger className="text-lg font-semibold">
          Conditions Générales et Services (Articles 1-5)
        </AccordionTrigger>
        <AccordionContent>
          <CGVSections />
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="section-2">
        <AccordionTrigger className="text-lg font-semibold">
          Parrainage et Limitations (Articles 6-8)
        </AccordionTrigger>
        <AccordionContent>
          <AdditionalCGVSections />
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="section-3">
        <AccordionTrigger className="text-lg font-semibold">
          Performance et Infrastructure (Articles 9-11)
        </AccordionTrigger>
        <AccordionContent>
          <MoreCGVSections />
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="section-reputation">
        <AccordionTrigger className="text-lg font-semibold">
          Protection de la Réputation (Article 11 bis)
        </AccordionTrigger>
        <AccordionContent>
          <ReputationCGVSections />
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="section-4">
        <AccordionTrigger className="text-lg font-semibold">
          Droits et Dispositions Finales (Articles 12-19)
        </AccordionTrigger>
        <AccordionContent>
          <FinalCGVSections />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default TermsAccordion;

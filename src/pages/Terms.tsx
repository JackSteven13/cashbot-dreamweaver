
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '@/components/Footer';
import { toast } from "@/components/ui/use-toast";
import TermsHeader from '@/components/terms/TermsHeader';
import TermsContainer from '@/components/terms/TermsContainer';
import TermsFooter from '@/components/terms/TermsFooter';
import TermsAccordion from '@/components/terms/TermsAccordion';
import CompleteCGVContent from '@/components/terms/CompleteCGVContent';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Terms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCheckoutButton, setShowCheckoutButton] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'complete' | 'accordion'>('accordion'); // Défaut sur accordion pour éviter les problèmes de longues pages
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const plan = params.get('plan');
    
    if (plan && ['freemium', 'starter', 'gold', 'elite'].includes(plan)) {
      setSelectedPlan(plan);
      setShowCheckoutButton(true);
    }
  }, [location]);
  
  const handleContinueToCheckout = () => {
    if (selectedPlan) {
      toast({
        title: "Redirection en cours",
        description: "Vous allez être redirigé vers la page de paiement...",
      });
      
      setTimeout(() => {
        navigate(`/payment?plan=${selectedPlan}`);
      }, 100);
    } else {
      navigate('/offres');
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-32 md:py-20">
        <div className="max-w-4xl mx-auto">
          <TermsHeader />
          
          <Card className="shadow-md">
            <CardContent className="p-0">
              <Tabs defaultValue={viewMode} className="w-full" onValueChange={(value) => setViewMode(value as 'complete' | 'accordion')}>
                <TabsList className="w-full sticky top-0 z-10 bg-background rounded-t-lg">
                  <TabsTrigger value="accordion" className="w-1/2">Vue par sections</TabsTrigger>
                  <TabsTrigger value="complete" className="w-1/2">Vue complète</TabsTrigger>
                </TabsList>
                
                <TabsContent value="complete">
                  <TermsContainer>
                    <CompleteCGVContent />
                    <TermsFooter 
                      showCheckoutButton={showCheckoutButton} 
                      selectedPlan={selectedPlan} 
                      handleContinueToCheckout={handleContinueToCheckout} 
                    />
                  </TermsContainer>
                </TabsContent>
                
                <TabsContent value="accordion">
                  <div className="p-6 border border-gray-300 rounded-b-lg bg-white">
                    <TermsAccordion />
                    <TermsFooter 
                      showCheckoutButton={showCheckoutButton} 
                      selectedPlan={selectedPlan} 
                      handleContinueToCheckout={handleContinueToCheckout} 
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;

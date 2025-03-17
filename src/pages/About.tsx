
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const About = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto py-16 px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center">À propos de CashBot</h1>
            
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-6 text-lg">
                CashBot a été créé avec une mission simple : démocratiser l'accès aux revenus passifs grâce à l'intelligence artificielle.
              </p>
              
              <h2 className="text-2xl font-semibold mt-10 mb-4">Notre Vision</h2>
              <p className="mb-6">
                Nous croyons qu'avec les technologies modernes, chacun devrait pouvoir générer des revenus complémentaires sans expertise technique ni investissement massif. Notre plateforme automatisée permet à tous de profiter d'opportunités financières jusque-là réservées aux experts.
              </p>
              
              <h2 className="text-2xl font-semibold mt-10 mb-4">Notre Technologie</h2>
              <p className="mb-6">
                CashBot s'appuie sur des algorithmes d'intelligence artificielle avancés, qui analysent en permanence les meilleures opportunités de monétisation. Notre système automatisé fonctionne 24h/24 pour maximiser vos gains, même pendant votre sommeil.
              </p>
              
              <h2 className="text-2xl font-semibold mt-10 mb-4">Notre Engagement</h2>
              <p className="mb-6">
                La transparence est au cœur de nos valeurs. Nous fournissons des analyses détaillées de vos performances et expliquons clairement notre fonctionnement. Notre équipe est disponible pour répondre à toutes vos questions et vous accompagner dans votre parcours.
              </p>
              
              <h2 className="text-2xl font-semibold mt-10 mb-4">Notre Équipe</h2>
              <p className="mb-6">
                CashBot a été fondé par une équipe d'experts en technologies financières, en IA et en marketing digital. Nous combinons ces expertises pour créer une solution vraiment innovante et accessible à tous.
              </p>
              
              <h2 className="text-2xl font-semibold mt-10 mb-4">Nous Rejoindre</h2>
              <p className="mb-6">
                Que vous cherchiez à compléter vos revenus ou à construire un revenu passif significatif, CashBot est conçu pour vous. Rejoignez notre communauté grandissante de membres qui profitent chaque jour de notre technologie.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;

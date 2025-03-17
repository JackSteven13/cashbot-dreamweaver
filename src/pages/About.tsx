
import React from 'react';
import Navbar from '@/components/Navbar';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '@/components/Button';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">À propos de CashBot</h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-xl mb-8">
              Bienvenue sur CashBot, la plateforme qui transforme le visionnage automatique de publicités en une source de revenus passifs. 
              Grâce à notre technologie avancée, vous pouvez générer des gains confortables sans effort, où que vous soyez.
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-4">Comment ça fonctionne ?</h2>
            <p>
              CashBot utilise un algorithme intelligent qui regarde des publicités à travers le monde entier. 
              Pendant que vous vaquez à vos occupations, notre système optimise vos gains en diffusant des annonces sponsorisées.
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-4">Un modèle gagnant-gagnant</h2>
            <p>
              Plus il y a d'utilisateurs sur CashBot, plus la plateforme génère de revenus publicitaires. 
              Et plus nous gagnons, plus nous pouvons redistribuer aux membres ! En partageant CashBot avec votre entourage, 
              vous ne faites pas que booster vos propres gains, vous contribuez aussi à renforcer toute la communauté.
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-4">Maximisez vos revenus avec le parrainage !</h2>
            <p>
              En plus de vos revenus générés automatiquement, CashBot vous permet de gagner encore plus grâce à notre programme de parrainage. 
              Partagez votre lien unique et recevez une commission pour chaque nouvel utilisateur inscrit via votre recommandation. 
              C'est une opportunité simple pour augmenter vos gains tout en aidant la plateforme à grandir.
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-4">Pourquoi choisir CashBot ?</h2>
            <ul className="space-y-4 my-6">
              <li className="flex items-start">
                <Check className="text-primary mr-2 mt-1 flex-shrink-0" size={20} />
                <span><strong>100% automatique :</strong> Pas besoin d'intervenir, CashBot travaille pour vous.</span>
              </li>
              <li className="flex items-start">
                <Check className="text-primary mr-2 mt-1 flex-shrink-0" size={20} />
                <span><strong>Accessible partout :</strong> Connectez-vous depuis n'importe quel appareil.</span>
              </li>
              <li className="flex items-start">
                <Check className="text-primary mr-2 mt-1 flex-shrink-0" size={20} />
                <span><strong>Un modèle gagnant-gagnant :</strong> Plus d'utilisateurs = plus de gains pour tous.</span>
              </li>
              <li className="flex items-start">
                <Check className="text-primary mr-2 mt-1 flex-shrink-0" size={20} />
                <span><strong>Gains boostés avec le parrainage :</strong> Invitez vos amis et augmentez vos revenus.</span>
              </li>
              <li className="flex items-start">
                <Check className="text-primary mr-2 mt-1 flex-shrink-0" size={20} />
                <span><strong>Transparence & sécurité :</strong> Vos gains sont réels et accessibles à tout moment.</span>
              </li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-12 mb-4">Rejoignez la communauté CashBot !</h2>
            <p>
              Ne laissez pas passer cette opportunité ! Inscrivez-vous dès maintenant, 
              activez CashBot et commencez à générer des revenus en toute simplicité.
            </p>
            
            <div className="mt-12 mb-6 flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  S'inscrire maintenant <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
              <Link to="/offres">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Découvrir nos offres
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;

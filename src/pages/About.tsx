
import React from 'react';
import Navbar from '@/components/Navbar';
import { ArrowRight, Check, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '@/components/Button';
import Footer from '@/components/Footer';

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-32 md:py-40 flex-grow">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">À propos de Stream genius</h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-xl mb-8">
              Bienvenue sur Stream genius, la plateforme qui transforme le visionnage automatique de publicités en une source de revenus passifs. 
              Grâce à notre technologie avancée, vous pouvez générer des gains confortables sans effort, où que vous soyez.
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-4">Comment ça fonctionne ?</h2>
            <p>
              Stream genius utilise un algorithme intelligent qui regarde des publicités à travers le monde entier. 
              Pendant que vous vaquez à vos occupations, notre système optimise vos gains en diffusant des annonces sponsorisées.
            </p>
            
            {/* Nouveau bloc sur l'effet réseau */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl my-8 border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-4">
                <Users className="w-10 h-10 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-2">La puissance de l'effet réseau</h3>
                  <p className="mb-2">
                    Stream genius utilise l'effet réseau pour maximiser les gains de tous les utilisateurs. Chaque nouvelle adresse IP 
                    connectée à la plateforme augmente notre capacité de traitement et démultiplie les revenus générés.
                  </p>
                  <p>
                    Plus notre communauté s'agrandit, plus notre technologie devient puissante, créant ainsi un cercle vertueux 
                    où chaque membre contribue au succès collectif tout en augmentant ses propres gains.
                  </p>
                </div>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold mt-12 mb-4">Un modèle gagnant-gagnant</h2>
            <p>
              Plus il y a d'utilisateurs sur Stream genius, plus la plateforme génère de revenus publicitaires. 
              Et plus nous gagnons, plus nous pouvons redistribuer aux membres ! En partageant Stream genius avec votre entourage, 
              vous ne faites pas que booster vos propres gains, vous contribuez aussi à renforcer toute la communauté.
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-4">Maximisez vos revenus avec le parrainage !</h2>
            <p>
              En plus de vos revenus générés automatiquement, Stream genius vous permet de gagner encore plus grâce à notre programme de parrainage. 
              Partagez votre lien unique et recevez une commission pour chaque nouvel utilisateur inscrit via votre recommandation. 
              C'est une opportunité simple pour augmenter vos gains tout en aidant la plateforme à grandir.
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-4">Pourquoi choisir Stream genius ?</h2>
            <ul className="space-y-4 my-6">
              <li className="flex items-start">
                <Check className="text-primary mr-2 mt-1 flex-shrink-0" size={20} />
                <span><strong>100% automatique :</strong> Pas besoin d'intervenir, Stream genius travaille pour vous.</span>
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
                <span><strong>Technologie évolutive :</strong> Chaque nouvel utilisateur améliore l'algorithme pour tous.</span>
              </li>
              <li className="flex items-start">
                <Check className="text-primary mr-2 mt-1 flex-shrink-0" size={20} />
                <span><strong>Transparence & sécurité :</strong> Vos gains sont réels et accessibles à tout moment.</span>
              </li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-12 mb-4">Rejoignez la communauté Stream genius !</h2>
            <p>
              Ne laissez pas passer cette opportunité ! Inscrivez-vous dès maintenant, 
              activez Stream genius et commencez à générer des revenus en toute simplicité.
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
      
      <Footer />
    </div>
  );
};

export default About;

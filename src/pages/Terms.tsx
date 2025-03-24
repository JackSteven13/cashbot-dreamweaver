
import React from 'react';
import Navbar from '@/components/Navbar';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-32 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Link>
          </div>
          
          <div className="mb-16">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">CONDITIONS GÉNÉRALES D'UTILISATION</h1>
            <p className="text-sm text-muted-foreground mb-6">Dernière mise à jour: 1 Juillet 2023</p>
            
            <div className="mt-6 p-6 border border-gray-300 rounded bg-white">
              <div className="cgv-container space-y-6 text-sm text-gray-700 leading-relaxed">
                <section>
                  <h2 className="font-bold text-lg mb-3">1. Objet des Présentes Conditions Générales de Vente</h2>
                  <p>Les présentes Conditions Générales de Vente, ci-après désignées par l'abréviation « CGV », ont pour objet de définir les modalités et conditions dans lesquelles les services proposés par la plateforme <strong>Stream Genius</strong>, propriété de la société Quantum Crawler sont fournis aux utilisateurs, qu'ils soient des particuliers ou des professionnels, ci-après désignés par le terme « Utilisateur » ou « Utilisateurs ». Les présentes CGV s'appliquent sans restriction ni réserve à l'ensemble des services offerts par <strong>Stream Genius</strong>, y compris mais sans s'y limiter : l'accès à un bot d'intelligence artificielle, les abonnements payants, le programme de parrainage, ainsi que tout autre service accessoire ou complémentaire.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">2. Acceptation des Conditions Générales de Vente</h2>
                  <p>L'Utilisateur reconnaît et accepte expressément que l'accès à la plateforme <strong>Stream Genius</strong>, la souscription à un abonnement, ou l'utilisation de tout service proposé, implique l'acceptation intégrale et sans réserve des présentes Conditions Générales de Vente. En cas de désaccord avec tout ou partie des dispositions des présentes CGV, l'Utilisateur est tenu de renoncer à l'utilisation des services proposés par <strong>Stream Genius</strong>. L'Utilisateur reconnaît en outre avoir pris connaissance des présentes CGV avant toute utilisation de la plateforme et déclare en avoir compris la teneur et la portée.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">3. Description des Services Proposés</h2>
                  <p>La plateforme <strong>Stream Genius</strong> propose à ses Utilisateurs un ensemble de services, dont les principales caractéristiques sont les suivantes :</p>
                  <ol className="list-decimal pl-6 mt-2 space-y-1">
                    <li><strong>Accès à un bot d'intelligence artificielle</strong> : Ce bot est conçu pour visionner des publicités rémunératrices de manière automatisée, permettant ainsi à l'Utilisateur de générer des revenus passifs.</li>
                    <li><strong>Abonnements payants</strong> : <strong>Stream Genius</strong> propose des abonnements mensuels ou annuels, donnant accès à des fonctionnalités premium et à des avantages exclusifs.</li>
                    <li><strong>Programme de parrainage</strong> : Les Utilisateurs ont la possibilité de participer à un programme de parrainage leur permettant de gagner des commissions en parrainant de nouveaux membres.</li>
                    <li><strong>Support technique et client</strong> : Un service d'assistance est disponible pour répondre aux questions et résoudre les problèmes techniques rencontrés par les Utilisateurs.</li>
                  </ol>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">4. Inscription et Gestion du Compte Utilisateur</h2>
                  <p className="font-medium">1. Création du Compte :</p>
                  <p className="ml-4">Pour accéder aux services proposés par <strong>Stream Genius</strong>, l'Utilisateur doit créer un compte en fournissant des informations exactes, complètes et à jour. L'Utilisateur s'engage à maintenir ces informations à jour tout au long de son utilisation de la plateforme.</p>
                  
                  <p className="font-medium mt-2">2. Confidentialité des Identifiants :</p>
                  <p className="ml-4">L'Utilisateur est seul responsable de la confidentialité de ses identifiants de connexion (nom d'utilisateur et mot de passe) et s'engage à ne pas les divulguer à des tiers. Toute utilisation du compte, qu'elle soit autorisée ou non, engage la responsabilité de l'Utilisateur.</p>
                  
                  <p className="font-medium mt-2">3. Suspension ou Fermeture du Compte :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> se réserve le droit de suspendre ou de fermer tout compte en cas de violation des présentes CGV, de comportement frauduleux, ou de tout autre motif légitime. L'Utilisateur peut également fermer son compte à tout moment via les paramètres de son profil.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">5. Abonnements et Modalités de Paiement</h2>
                  <p className="font-medium">1. Types d'Abonnements :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> propose des abonnements mensuels et annuels, dont les caractéristiques et tarifs sont détaillés sur la plateforme. L'Utilisateur s'engage à choisir l'abonnement correspondant à ses besoins et à en respecter les conditions.</p>
                  
                  <p className="font-medium mt-2">2. Paiement :</p>
                  <p className="ml-4">Le paiement des abonnements s'effectue par carte bancaire, PayPal ou tout autre moyen de paiement accepté par <strong>Stream Genius</strong>. Le prélèvement est effectué automatiquement à la date d'échéance.</p>
                  
                  <p className="font-medium mt-2">3. Renouvellement Automatique :</p>
                  <p className="ml-4">Les abonnements sont reconduits tacitement pour une durée identique à la période initiale. L'Utilisateur peut résilier son abonnement avant la date de renouvellement en suivant la procédure prévue à cet effet.</p>
                  
                  <p className="font-medium mt-2">4. Remboursements :</p>
                  <p className="ml-4">Aucun remboursement ne sera accordé pour les abonnements déjà entamés, sauf en cas d'erreur technique imputable à <strong>Stream Genius</strong>.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">6. Programme de Parrainage Simplifié</h2>
                  <p className="font-medium">1. Adhésion au Programme :</p>
                  <p className="ml-4">Tout Utilisateur actif peut participer au programme de parrainage en générant un lien de parrainage unique depuis son compte.</p>
                  
                  <p className="font-medium mt-2">2. Gains pour le Parrain :</p>
                  <ul className="list-disc ml-8 mt-1">
                    <li>Le parrain reçoit une commission de vingt pour cent du montant des abonnements payés par chaque filleul, et ce, à vie.</li>
                    <li>Un bonus de cinquante euros est accordé au parrain pour chaque filleul restant actif pendant une période minimale de trois mois.</li>
                  </ul>
                  
                  <p className="font-medium mt-2">3. Conditions de Paiement :</p>
                  <p className="ml-4">Les gains sont accumulés dans un portefeuille virtuel et sont payés lorsque le seuil de cent euros est atteint. Les paiements s'effectuent par virement bancaire, PayPal ou crédit sur le compte <strong>Stream Genius</strong>.</p>
                  
                  <p className="font-medium mt-2">4. Interdiction de Fraude :</p>
                  <p className="ml-4">Tout comportement frauduleux, y compris mais sans s'y limiter les fausses inscriptions ou l'utilisation de bots, entraîne la suspension immédiate du compte et la confiscation des gains non payés.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">7. Responsabilités</h2>
                  <p className="font-medium">1. Responsabilité de l'Utilisateur :</p>
                  <p className="ml-4">L'Utilisateur s'engage à utiliser la plateforme de manière légale et éthique. Il est responsable de tout contenu qu'il publie ou partage sur la plateforme.</p>
                  
                  <p className="font-medium mt-2">2. Responsabilité de Stream Genius :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> s'efforce de fournir un service de qualité mais ne garantit pas une disponibilité ininterrompue ou exempte d'erreurs. <strong>Stream Genius</strong> décline toute responsabilité en cas de dommages indirects, pertes de données ou interruptions de service.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">8. Données Personnelles</h2>
                  <p>Les données personnelles des Utilisateurs sont collectées et traitées conformément à la politique de confidentialité de <strong>Stream Genius</strong>, accessible sur le site web. Les Utilisateurs sont invités à consulter cette politique pour en comprendre les modalités.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">9. Propriété Intellectuelle</h2>
                  <p>La plateforme <strong>Stream Genius</strong>, son contenu et ses fonctionnalités sont protégés par des droits de propriété intellectuelle. L'Utilisateur s'interdit de copier, modifier ou distribuer le contenu sans autorisation préalable.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">10. Modification des CGV</h2>
                  <p><strong>Stream Genius</strong> se réserve le droit de modifier les présentes CGV à tout moment. Les Utilisateurs seront informés par email, et leur silence vaudra acceptation des nouvelles conditions.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">11. Résiliation</h2>
                  <p className="font-medium">1. Par l'Utilisateur :</p>
                  <p className="ml-4">L'Utilisateur peut résilier son abonnement à tout moment via les paramètres de son compte. Les gains accumulés dans le programme de parrainage seront payés si le seuil de cent euros est atteint.</p>
                  
                  <p className="font-medium mt-2">2. Par Stream Genius :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> peut résilier un abonnement en cas de violation des CGV. Les gains non payés seront confisqués.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">12. Dispositions Diverses</h2>
                  <p className="font-medium">1. Force Majeure :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> n'est pas responsable des retards ou interruptions de service dus à des événements de force majeure.</p>
                  
                  <p className="font-medium mt-2">2. Non-Cession :</p>
                  <p className="ml-4">Les droits et obligations des Utilisateurs ne peuvent pas être cédés à des tiers sans l'accord écrit de <strong>Stream Genius</strong>.</p>
                  
                  <p className="font-medium mt-2">3. Entente Intégrale :</p>
                  <p className="ml-4">Les présentes CGV constituent l'intégralité de l'accord entre l'Utilisateur et <strong>Stream Genius</strong>.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">13. Juridiction Compétente</h2>
                  <p>Tout litige relatif à l'interprétation ou à l'exécution des présentes CGV sera soumis aux tribunaux.</p>
                </section>
                
                <div className="mt-8 pt-4 border-t border-gray-200">
                  <p className="text-center text-sm text-gray-500">
                    En utilisant ce service, vous reconnaissez avoir lu, compris et accepté les présentes conditions générales d'utilisation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;

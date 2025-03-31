
import React from 'react';
import TermsSection from './TermsSection';

const CGVSections = () => {
  return (
    <>
      <TermsSection title="1. Objet des Présentes Conditions Générales de Vente">
        <p>Les présentes Conditions Générales de Vente, ci-après désignées par l'abréviation « CGV », ont pour objet de définir les modalités et conditions dans lesquelles les services proposés par la plateforme <strong>Stream Genius</strong>, propriété de la société Quantum Crawler sont fournis aux utilisateurs, qu'ils soient des particuliers ou des professionnels, ci-après désignés par le terme « Utilisateur » ou « Utilisateurs ». Les présentes CGV s'appliquent sans restriction ni réserve à l'ensemble des services offerts par <strong>Stream Genius</strong>, y compris mais sans s'y limiter : l'accès à un bot d'intelligence artificielle, les abonnements payants, le programme de parrainage, ainsi que tout autre service accessoire ou complémentaire.</p>
      </TermsSection>
      
      <TermsSection title="2. Acceptation des Conditions Générales de Vente">
        <p>L'Utilisateur reconnaît et accepte expressément que l'accès à la plateforme <strong>Stream Genius</strong>, la souscription à un abonnement, ou l'utilisation de tout service proposé, implique l'acceptation intégrale et sans réserve des présentes Conditions Générales de Vente. En cas de désaccord avec tout ou partie des dispositions des présentes CGV, l'Utilisateur est tenu de renoncer à l'utilisation des services proposés par <strong>Stream Genius</strong>. L'Utilisateur reconnaît en outre avoir pris connaissance des présentes CGV avant toute utilisation de la plateforme et déclare en avoir compris la teneur et la portée.</p>
      </TermsSection>
      
      <TermsSection title="3. Description des Services Proposés">
        <p>La plateforme <strong>Stream Genius</strong> propose à ses Utilisateurs un ensemble de services, dont les principales caractéristiques sont les suivantes :</p>
        <ol className="list-decimal pl-6 mt-2 space-y-1">
          <li><strong>Accès à un bot d'intelligence artificielle</strong> : Ce bot est conçu pour visionner des publicités rémunératrices de manière automatisée, permettant ainsi à l'Utilisateur de générer des revenus complémentaires.</li>
          <li><strong>Abonnements payants</strong> : <strong>Stream Genius</strong> propose des abonnements mensuels ou annuels, donnant accès à des fonctionnalités premium et à des avantages exclusifs.</li>
          <li><strong>Programme de parrainage</strong> : Les Utilisateurs ont la possibilité de participer à un programme de parrainage leur permettant de gagner des commissions en parrainant de nouveaux membres.</li>
          <li><strong>Support technique et client</strong> : Un service d'assistance est disponible pour répondre aux questions et résoudre les problèmes techniques rencontrés par les Utilisateurs.</li>
        </ol>
      </TermsSection>
      
      <TermsSection title="4. Inscription et Gestion du Compte Utilisateur">
        <p className="font-medium">1. Création du Compte :</p>
        <p className="ml-4">Pour accéder aux services proposés par <strong>Stream Genius</strong>, l'Utilisateur doit créer un compte en fournissant des informations exactes, complètes et à jour. L'Utilisateur s'engage à maintenir ces informations à jour tout au long de son utilisation de la plateforme.</p>
        
        <p className="font-medium mt-2">2. Confidentialité des Identifiants :</p>
        <p className="ml-4">L'Utilisateur est seul responsable de la confidentialité de ses identifiants de connexion (nom d'utilisateur et mot de passe) et s'engage à ne pas les divulguer à des tiers. Toute utilisation du compte, qu'elle soit autorisée ou non, engage la responsabilité de l'Utilisateur.</p>
        
        <p className="font-medium mt-2">3. Suspension ou Fermeture du Compte :</p>
        <p className="ml-4"><strong>Stream Genius</strong> se réserve le droit de suspendre ou de fermer tout compte en cas de violation des présentes CGV, de comportement frauduleux, ou de tout autre motif légitime. L'Utilisateur peut également fermer son compte à tout moment via les paramètres de son profil.</p>
      </TermsSection>
      
      <TermsSection title="5. Abonnements et Modalités de Paiement">
        <p className="font-medium">1. Types d'Abonnements :</p>
        <p className="ml-4"><strong>Stream Genius</strong> propose des abonnements mensuels et annuels, dont les caractéristiques et tarifs sont détaillés sur la plateforme. L'Utilisateur s'engage à choisir l'abonnement correspondant à ses besoins et à en respecter les conditions.</p>
        
        <p className="font-medium mt-2">2. Paiement :</p>
        <p className="ml-4">Le paiement des abonnements s'effectue par carte bancaire, PayPal ou tout autre moyen de paiement accepté par <strong>Stream Genius</strong>. Le prélèvement est effectué automatiquement à la date d'échéance.</p>
        
        <p className="font-medium mt-2">3. Renouvellement Automatique :</p>
        <p className="ml-4">Les abonnements sont reconduits tacitement pour une durée identique à la période initiale. L'Utilisateur peut résilier son abonnement avant la date de renouvellement en suivant la procédure prévue à cet effet.</p>
        
        <p className="font-medium mt-2">4. Remboursements :</p>
        <p className="ml-4">Aucun remboursement ne sera accordé pour les abonnements déjà entamés, sauf en cas d'erreur technique imputable à <strong>Stream Genius</strong>.</p>
        
        <p className="font-medium mt-2">5. Limites de Gains et Performance :</p>
        <p className="ml-4">Chaque abonnement correspond à un niveau de performance du bot et à une limite quotidienne de gains : Freemium (1€/jour), Starter (7€/jour), Gold (25€/jour) et Elite (75€/jour). Ces limites définissent le potentiel de revenus maximum généré quotidiennement par votre bot. La performance du bot augmente proportionnellement avec le niveau d'abonnement, offrant ainsi un retour sur investissement attractif pour les abonnements supérieurs.</p>
      </TermsSection>
    </>
  );
};

export default CGVSections;


import React from 'react';
import TermsSection from './TermsSection';

const AdditionalCGVSections = () => {
  return (
    <>
      <TermsSection title="6. Programme de Parrainage Simplifié">
        <p className="font-medium">1. Adhésion au Programme :</p>
        <p className="ml-4">Tout Utilisateur actif peut participer au programme de parrainage en générant un lien de parrainage unique depuis son compte.</p>
        
        <p className="font-medium mt-2">2. Gains pour le Parrain :</p>
        <ul className="list-disc ml-8 mt-1">
          <li>Le parrain reçoit une commission variant de 20% à 50% du montant des abonnements payés par chaque filleul, selon le niveau d'abonnement du parrain.</li>
          <li>Les commissions sont calculées comme suit : 20% pour l'abonnement Freemium, 30% pour l'abonnement Starter, 40% pour l'abonnement Gold, et 50% pour l'abonnement Elite.</li>
          <li>Les abonnements Gold et Elite bénéficient également de commissions supplémentaires pour les filleuls de leurs filleuls (niveau 2).</li>
        </ul>
        
        <p className="font-medium mt-2">3. Conditions de Paiement :</p>
        <p className="ml-4">Les gains sont accumulés dans un portefeuille virtuel et sont payés lorsque le seuil minimum est atteint selon le type d'abonnement. Les paiements s'effectuent par virement bancaire, PayPal ou crédit sur le compte <strong>Stream Genius</strong>.</p>
        
        <p className="font-medium mt-2">4. Interdiction de Fraude :</p>
        <p className="ml-4">Tout comportement frauduleux, y compris mais sans s'y limiter les fausses inscriptions ou l'utilisation de bots, entraîne la suspension immédiate du compte et la confiscation des gains non payés.</p>
      </TermsSection>
      
      <TermsSection title="7. Limites de Garantie et Exclusion de Responsabilité">
        <p className="font-medium">1. Absence de Garantie de Résultats :</p>
        <p className="ml-4"><strong>Stream Genius</strong> ne garantit en aucun cas des résultats spécifiques ou des niveaux de gains précis à ses Utilisateurs. Les revenus générés par l'utilisation du bot d'intelligence artificielle et autres services sont variables et dépendent de nombreux facteurs externes, notamment les fluctuations du marché publicitaire, les changements algorithmiques des plateformes tierces, et l'évolution technologique. Les projections de revenus affichées représentent des estimations théoriques basées sur des conditions optimales et ne constituent en aucun cas une promesse de gains.</p>
        
        <p className="font-medium mt-2">2. Limitation Stricte de Responsabilité :</p>
        <p className="ml-4">En aucun cas, <strong>Stream Genius</strong> ne pourra être tenu responsable des pertes de revenus, d'opportunités commerciales, de données, de réputation, ou de tout autre dommage indirect, même si <strong>Stream Genius</strong> a été informé de la possibilité de tels dommages. La responsabilité financière totale de <strong>Stream Genius</strong> envers un Utilisateur est strictement limitée au montant payé par celui-ci pour son abonnement au cours des douze derniers mois.</p>
        
        <p className="font-medium mt-2">3. Force Majeure Étendue :</p>
        <p className="ml-4"><strong>Stream Genius</strong> est exonéré de toute responsabilité en cas de force majeure, entendue dans son acception la plus large, incluant notamment, mais sans s'y limiter : les pannes techniques, les attaques informatiques, les modifications législatives ou réglementaires, les décisions gouvernementales, les pandémies, les perturbations des réseaux de télécommunication, et tout autre événement échappant au contrôle raisonnable de <strong>Stream Genius</strong>.</p>
        
        <p className="font-medium mt-2">4. Réserve de Modification des Services :</p>
        <p className="ml-4"><strong>Stream Genius</strong> se réserve le droit de modifier, suspendre ou interrompre tout ou partie de ses services, temporairement ou définitivement, sans préavis ni indemnité, afin d'assurer la viabilité et la pérennité de la plateforme.</p>
        
        <p className="font-medium mt-2">5. Performances Variables selon les Abonnements :</p>
        <p className="ml-4">Les performances et résultats peuvent varier significativement selon le type d'abonnement souscrit. Les revenus générés sont directement proportionnels au niveau d'abonnement et aux limites quotidiennes associées. Le retour sur investissement (ROI) n'est pas garanti et varie selon les conditions d'utilisation, le niveau d'engagement et les fluctuations du marché.</p>
      </TermsSection>
      
      <TermsSection title="8. Politique de Retraits et Seuils Financiers">
        <p className="font-medium">1. Seuils de Retrait Différenciés :</p>
        <p className="ml-4">Les seuils de retrait varient selon le type d'abonnement souscrit par l'Utilisateur : deux cents euros pour l'abonnement Freemium, quatre cents euros pour l'abonnement Starter, sept cents euros pour l'abonnement Gold, et mille euros pour l'abonnement Elite. Ces seuils peuvent être révisés à la hausse par <strong>Stream Genius</strong> avec un préavis de trente jours.</p>
        
        <p className="font-medium mt-2">2. Délais de Traitement :</p>
        <p className="ml-4">Le traitement des demandes de retrait peut nécessiter un délai de sept à trente jours ouvrables, selon la charge de travail des équipes financières et les vérifications de sécurité requises. Ce délai n'est pas susceptible de donner lieu à une quelconque indemnisation.</p>
        
        <p className="font-medium mt-2">3. Frais de Gestion et de Retrait Anticipé :</p>
        <p className="ml-4">Un prélèvement de cinquante pourcents est appliqué sur les retraits effectués par des comptes ayant moins de six mois d'ancienneté, afin de couvrir les frais administratifs et de prévenir les abus. Pour les comptes plus anciens, des frais de gestion de dix pourcents peuvent être appliqués en cas de demandes de retrait répétées dans un intervalle inférieur à quarante-cinq jours.</p>
        
        <p className="font-medium mt-2">4. Vérifications de Sécurité :</p>
        <p className="ml-4"><strong>Stream Genius</strong> se réserve le droit de procéder à des vérifications d'identité approfondies avant d'approuver toute demande de retrait, y compris la demande de pièces justificatives supplémentaires. L'absence de réponse de l'Utilisateur dans un délai de dix jours entraîne l'annulation automatique de la demande de retrait.</p>
      </TermsSection>
    </>
  );
};

export default AdditionalCGVSections;

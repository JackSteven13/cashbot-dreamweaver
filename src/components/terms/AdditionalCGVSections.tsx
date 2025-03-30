
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
          <li>Le parrain reçoit une commission de vingt pour cent du montant des abonnements payés par chaque filleul, et ce, à vie.</li>
          <li>Un bonus de cinquante euros est accordé au parrain pour chaque filleul restant actif pendant une période minimale de trois mois.</li>
        </ul>
        
        <p className="font-medium mt-2">3. Conditions de Paiement :</p>
        <p className="ml-4">Les gains sont accumulés dans un portefeuille virtuel et sont payés lorsque le seuil de cent euros est atteint. Les paiements s'effectuent par virement bancaire, PayPal ou crédit sur le compte <strong>Stream Genius</strong>.</p>
        
        <p className="font-medium mt-2">4. Interdiction de Fraude :</p>
        <p className="ml-4">Tout comportement frauduleux, y compris mais sans s'y limiter les fausses inscriptions ou l'utilisation de bots, entraîne la suspension immédiate du compte et la confiscation des gains non payés.</p>
      </TermsSection>
      
      <TermsSection title="7. Limites de Garantie et Exclusion de Responsabilité">
        <p className="font-medium">1. Absence de Garantie de Résultats :</p>
        <p className="ml-4"><strong>Stream Genius</strong> ne garantit en aucun cas des résultats spécifiques ou des niveaux de gains précis à ses Utilisateurs. Les revenus générés par l'utilisation du bot d'intelligence artificielle et autres services sont variables et dépendent de nombreux facteurs externes, notamment les fluctuations du marché publicitaire, les changements algorithmiques des plateformes tierces, et l'évolution technologique.</p>
        
        <p className="font-medium mt-2">2. Limitation Stricte de Responsabilité :</p>
        <p className="ml-4">En aucun cas, <strong>Stream Genius</strong> ne pourra être tenu responsable des pertes de revenus, d'opportunités commerciales, de données, de réputation, ou de tout autre dommage indirect, même si <strong>Stream Genius</strong> a été informé de la possibilité de tels dommages. La responsabilité financière totale de <strong>Stream Genius</strong> envers un Utilisateur est strictement limitée au montant payé par celui-ci pour son abonnement au cours des douze (12) derniers mois.</p>
        
        <p className="font-medium mt-2">3. Force Majeure Étendue :</p>
        <p className="ml-4"><strong>Stream Genius</strong> est exonéré de toute responsabilité en cas de force majeure, entendue dans son acception la plus large, incluant notamment, mais sans s'y limiter : les pannes techniques, les attaques informatiques, les modifications législatives ou réglementaires, les décisions gouvernementales, les pandémies, les perturbations des réseaux de télécommunication, et tout autre événement échappant au contrôle raisonnable de <strong>Stream Genius</strong>.</p>
        
        <p className="font-medium mt-2">4. Réserve de Modification des Services :</p>
        <p className="ml-4"><strong>Stream Genius</strong> se réserve le droit de modifier, suspendre ou interrompre tout ou partie de ses services, temporairement ou définitivement, sans préavis ni indemnité, afin d'assurer la viabilité et la pérennité de la plateforme.</p>
      </TermsSection>
      
      <TermsSection title="8. Politique de Retraits et Seuils Financiers">
        <p className="font-medium">1. Seuils de Retrait Différenciés :</p>
        <p className="ml-4">Les seuils de retrait varient selon le type d'abonnement souscrit par l'Utilisateur : 200€ pour l'abonnement Freemium, 400€ pour l'abonnement Starter, 700€ pour l'abonnement Gold, et 1000€ pour l'abonnement Elite. Ces seuils peuvent être révisés à la hausse par <strong>Stream Genius</strong> avec un préavis de trente (30) jours.</p>
        
        <p className="font-medium mt-2">2. Délais de Traitement :</p>
        <p className="ml-4">Le traitement des demandes de retrait peut nécessiter un délai de sept (7) à trente (30) jours ouvrables, selon la charge de travail des équipes financières et les vérifications de sécurité requises. Ce délai n'est pas susceptible de donner lieu à une quelconque indemnisation.</p>
        
        <p className="font-medium mt-2">3. Frais de Gestion et de Retrait Anticipé :</p>
        <p className="ml-4">Un prélèvement de 50% est appliqué sur les retraits effectués par des comptes ayant moins de six (6) mois d'ancienneté, afin de couvrir les frais administratifs et de prévenir les abus. Pour les comptes plus anciens, des frais de gestion de 10% peuvent être appliqués en cas de demandes de retrait répétées dans un intervalle inférieur à quarante-cinq (45) jours.</p>
        
        <p className="font-medium mt-2">4. Vérifications de Sécurité :</p>
        <p className="ml-4"><strong>Stream Genius</strong> se réserve le droit de procéder à des vérifications d'identité approfondies avant d'approuver toute demande de retrait, y compris la demande de pièces justificatives supplémentaires. L'absence de réponse de l'Utilisateur dans un délai de dix (10) jours entraîne l'annulation automatique de la demande de retrait.</p>
      </TermsSection>
    </>
  );
};

export default AdditionalCGVSections;

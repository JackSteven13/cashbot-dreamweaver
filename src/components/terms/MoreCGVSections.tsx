
import React from 'react';
import TermsSection from './TermsSection';

const MoreCGVSections = () => {
  return (
    <>
      <TermsSection title="9. Gestion des Irrégularités et Performance Exceptionnelle">
        <p className="font-medium">1. Vérifications Automatiques :</p>
        <p className="ml-4"><strong>Stream Genius</strong> dispose d'un système automatisé de détection des anomalies qui peut temporairement suspendre les comptes présentant des performances significativement supérieures à la moyenne des utilisateurs du même type d'abonnement. Cette suspension, d'une durée maximale de quarante-huit (48) heures, permet de vérifier l'absence d'activités frauduleuses.</p>
        
        <p className="font-medium mt-2">2. Ajustements de Performance :</p>
        <p className="ml-4">Pour garantir la viabilité économique à long terme de la plateforme, <strong>Stream Genius</strong> se réserve le droit d'appliquer des ajustements de performance aux comptes dont les gains dépassent de plus de 200% la moyenne constatée pour leur catégorie d'abonnement sur une période de trente (30) jours consécutifs. Ces ajustements sont notifiés à l'Utilisateur concerné.</p>
        
        <p className="font-medium mt-2">3. Limites Quotidiennes Modulables :</p>
        <p className="ml-4">Les limites quotidiennes de gains peuvent être temporairement réduites pour l'ensemble des Utilisateurs en cas de conditions de marché défavorables, notamment lors de baisses significatives des revenus publicitaires. <strong>Stream Genius</strong> s'engage à restaurer les limites normales dès que les conditions le permettent.</p>
        
        <p className="font-medium mt-2">4. Gel Préventif :</p>
        <p className="ml-4">En cas de suspicion de fraude ou d'utilisation abusive du service, <strong>Stream Genius</strong> peut procéder au gel préventif du compte concerné, incluant la suspension temporaire de l'accès aux services et le blocage des retraits, pour une durée maximale de soixante (60) jours, le temps de mener une enquête approfondie.</p>
      </TermsSection>
      
      <TermsSection title="10. Modifications d'Infrastructures et Stabilité du Service">
        <p className="font-medium">1. Maintenance Planifiée :</p>
        <p className="ml-4"><strong>Stream Genius</strong> peut procéder à des opérations de maintenance planifiées, susceptibles d'entraîner une interruption temporaire des services. Ces opérations sont, dans la mesure du possible, programmées pendant les périodes de faible affluence et notifiées aux Utilisateurs au moins vingt-quatre (24) heures à l'avance.</p>
        
        <p className="font-medium mt-2">2. Adaptations Technologiques :</p>
        <p className="ml-4">Afin de s'adapter aux évolutions technologiques et aux changements de politiques des plateformes partenaires, <strong>Stream Genius</strong> peut être amené à modifier ses algorithmes et systèmes sans préavis. Ces modifications peuvent affecter temporairement les performances jusqu'à ce que le système atteigne un nouvel équilibre.</p>
        
        <p className="font-medium mt-2">3. Indisponibilité et Compensation :</p>
        <p className="ml-4">En cas d'indisponibilité prolongée des services (supérieure à 72 heures consécutives) imputable directement à <strong>Stream Genius</strong>, une compensation sous forme d'extension de la période d'abonnement peut être accordée, à la discrétion de <strong>Stream Genius</strong>, sans que cette compensation puisse excéder la valeur d'un mois d'abonnement.</p>
        
        <p className="font-medium mt-2">4. Discontinuité de Service :</p>
        <p className="ml-4">Si <strong>Stream Genius</strong> se trouve dans l'impossibilité définitive de fournir ses services, les Utilisateurs en seront informés avec un préavis minimum de trente (30) jours. Dans ce cas, <strong>Stream Genius</strong> s'engage à honorer les retraits des gains accumulés dépassant les seuils minimaux, dans la limite des fonds disponibles et selon un ordre de priorité basé sur l'ancienneté des comptes.</p>
      </TermsSection>
      
      <TermsSection title="11. Dispositions Financières et Conservation des Fonds">
        <p className="font-medium">1. Gestion Prudentielle :</p>
        <p className="ml-4"><strong>Stream Genius</strong> applique une approche de gestion prudentielle des fonds destinés au paiement des gains des Utilisateurs. Une réserve stratégique est constituée et maintenue pour garantir la capacité de paiement, même en cas de fluctuations importantes du marché publicitaire.</p>
        
        <p className="font-medium mt-2">2. Priorisation des Paiements :</p>
        <p className="ml-4">En cas de contraintes temporaires de liquidité, <strong>Stream Genius</strong> se réserve le droit d'établir un ordre de priorité pour le traitement des demandes de retrait, basé sur l'ancienneté du compte, le montant demandé, et le type d'abonnement souscrit par l'Utilisateur.</p>
        
        <p className="font-medium mt-2">3. Blocages Règlementaires :</p>
        <p className="ml-4">Si des changements règlementaires ou des restrictions bancaires affectent la capacité de <strong>Stream Genius</strong> à effectuer certains types de paiements, des modes alternatifs de compensation pourront être proposés aux Utilisateurs concernés, tels que des crédits sur abonnement ou des bons d'achat auprès de partenaires.</p>
        
        <p className="font-medium mt-2">4. Périodes de Restriction :</p>
        <p className="ml-4"><strong>Stream Genius</strong> peut instaurer des périodes de restriction des retraits, n'excédant pas soixante (60) jours par année civile, afin de procéder à des audits financiers, des mises à jour systémiques, ou pour se conformer à des obligations légales. Ces périodes sont annoncées avec un préavis minimum de sept (7) jours.</p>
      </TermsSection>
    </>
  );
};

export default MoreCGVSections;


import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ChevronRight } from 'lucide-react';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/use-toast";

const Terms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCheckoutButton, setShowCheckoutButton] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
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
                {/* Sections 1-6 restent identiques */}
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
                
                {/* Nouvelles sections et modifications */}
                <section>
                  <h2 className="font-bold text-lg mb-3">7. Limites de Garantie et Exclusion de Responsabilité</h2>
                  <p className="font-medium">1. Absence de Garantie de Résultats :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> ne garantit en aucun cas des résultats spécifiques ou des niveaux de gains précis à ses Utilisateurs. Les revenus générés par l'utilisation du bot d'intelligence artificielle et autres services sont variables et dépendent de nombreux facteurs externes, notamment les fluctuations du marché publicitaire, les changements algorithmiques des plateformes tierces, et l'évolution technologique.</p>
                  
                  <p className="font-medium mt-2">2. Limitation Stricte de Responsabilité :</p>
                  <p className="ml-4">En aucun cas, <strong>Stream Genius</strong> ne pourra être tenu responsable des pertes de revenus, d'opportunités commerciales, de données, de réputation, ou de tout autre dommage indirect, même si <strong>Stream Genius</strong> a été informé de la possibilité de tels dommages. La responsabilité financière totale de <strong>Stream Genius</strong> envers un Utilisateur est strictement limitée au montant payé par celui-ci pour son abonnement au cours des douze (12) derniers mois.</p>
                  
                  <p className="font-medium mt-2">3. Force Majeure Étendue :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> est exonéré de toute responsabilité en cas de force majeure, entendue dans son acception la plus large, incluant notamment, mais sans s'y limiter : les pannes techniques, les attaques informatiques, les modifications législatives ou réglementaires, les décisions gouvernementales, les pandémies, les perturbations des réseaux de télécommunication, et tout autre événement échappant au contrôle raisonnable de <strong>Stream Genius</strong>.</p>
                  
                  <p className="font-medium mt-2">4. Réserve de Modification des Services :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> se réserve le droit de modifier, suspendre ou interrompre tout ou partie de ses services, temporairement ou définitivement, sans préavis ni indemnité, afin d'assurer la viabilité et la pérennité de la plateforme.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">8. Politique de Retraits et Seuils Financiers</h2>
                  <p className="font-medium">1. Seuils de Retrait Différenciés :</p>
                  <p className="ml-4">Les seuils de retrait varient selon le type d'abonnement souscrit par l'Utilisateur : 200€ pour l'abonnement Freemium, 400€ pour l'abonnement Starter, 700€ pour l'abonnement Gold, et 1000€ pour l'abonnement Elite. Ces seuils peuvent être révisés à la hausse par <strong>Stream Genius</strong> avec un préavis de trente (30) jours.</p>
                  
                  <p className="font-medium mt-2">2. Délais de Traitement :</p>
                  <p className="ml-4">Le traitement des demandes de retrait peut nécessiter un délai de sept (7) à trente (30) jours ouvrables, selon la charge de travail des équipes financières et les vérifications de sécurité requises. Ce délai n'est pas susceptible de donner lieu à une quelconque indemnisation.</p>
                  
                  <p className="font-medium mt-2">3. Frais de Gestion et de Retrait Anticipé :</p>
                  <p className="ml-4">Un prélèvement de 50% est appliqué sur les retraits effectués par des comptes ayant moins de six (6) mois d'ancienneté, afin de couvrir les frais administratifs et de prévenir les abus. Pour les comptes plus anciens, des frais de gestion de 10% peuvent être appliqués en cas de demandes de retrait répétées dans un intervalle inférieur à quarante-cinq (45) jours.</p>
                  
                  <p className="font-medium mt-2">4. Vérifications de Sécurité :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> se réserve le droit de procéder à des vérifications d'identité approfondies avant d'approuver toute demande de retrait, y compris la demande de pièces justificatives supplémentaires. L'absence de réponse de l'Utilisateur dans un délai de dix (10) jours entraîne l'annulation automatique de la demande de retrait.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">9. Gestion des Irrégularités et Performance Exceptionnelle</h2>
                  <p className="font-medium">1. Vérifications Automatiques :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> dispose d'un système automatisé de détection des anomalies qui peut temporairement suspendre les comptes présentant des performances significativement supérieures à la moyenne des utilisateurs du même type d'abonnement. Cette suspension, d'une durée maximale de quarante-huit (48) heures, permet de vérifier l'absence d'activités frauduleuses.</p>
                  
                  <p className="font-medium mt-2">2. Ajustements de Performance :</p>
                  <p className="ml-4">Pour garantir la viabilité économique à long terme de la plateforme, <strong>Stream Genius</strong> se réserve le droit d'appliquer des ajustements de performance aux comptes dont les gains dépassent de plus de 200% la moyenne constatée pour leur catégorie d'abonnement sur une période de trente (30) jours consécutifs. Ces ajustements sont notifiés à l'Utilisateur concerné.</p>
                  
                  <p className="font-medium mt-2">3. Limites Quotidiennes Modulables :</p>
                  <p className="ml-4">Les limites quotidiennes de gains peuvent être temporairement réduites pour l'ensemble des Utilisateurs en cas de conditions de marché défavorables, notamment lors de baisses significatives des revenus publicitaires. <strong>Stream Genius</strong> s'engage à restaurer les limites normales dès que les conditions le permettent.</p>
                  
                  <p className="font-medium mt-2">4. Gel Préventif :</p>
                  <p className="ml-4">En cas de suspicion de fraude ou d'utilisation abusive du service, <strong>Stream Genius</strong> peut procéder au gel préventif du compte concerné, incluant la suspension temporaire de l'accès aux services et le blocage des retraits, pour une durée maximale de soixante (60) jours, le temps de mener une enquête approfondie.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">10. Modifications d'Infrastructures et Stabilité du Service</h2>
                  <p className="font-medium">1. Maintenance Planifiée :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> peut procéder à des opérations de maintenance planifiées, susceptibles d'entraîner une interruption temporaire des services. Ces opérations sont, dans la mesure du possible, programmées pendant les périodes de faible affluence et notifiées aux Utilisateurs au moins vingt-quatre (24) heures à l'avance.</p>
                  
                  <p className="font-medium mt-2">2. Adaptations Technologiques :</p>
                  <p className="ml-4">Afin de s'adapter aux évolutions technologiques et aux changements de politiques des plateformes partenaires, <strong>Stream Genius</strong> peut être amené à modifier ses algorithmes et systèmes sans préavis. Ces modifications peuvent affecter temporairement les performances jusqu'à ce que le système atteigne un nouvel équilibre.</p>
                  
                  <p className="font-medium mt-2">3. Indisponibilité et Compensation :</p>
                  <p className="ml-4">En cas d'indisponibilité prolongée des services (supérieure à 72 heures consécutives) imputable directement à <strong>Stream Genius</strong>, une compensation sous forme d'extension de la période d'abonnement peut être accordée, à la discrétion de <strong>Stream Genius</strong>, sans que cette compensation puisse excéder la valeur d'un mois d'abonnement.</p>
                  
                  <p className="font-medium mt-2">4. Discontinuité de Service :</p>
                  <p className="ml-4">Si <strong>Stream Genius</strong> se trouve dans l'impossibilité définitive de fournir ses services, les Utilisateurs en seront informés avec un préavis minimum de trente (30) jours. Dans ce cas, <strong>Stream Genius</strong> s'engage à honorer les retraits des gains accumulés dépassant les seuils minimaux, dans la limite des fonds disponibles et selon un ordre de priorité basé sur l'ancienneté des comptes.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">11. Dispositions Financières et Conservation des Fonds</h2>
                  <p className="font-medium">1. Gestion Prudentielle :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> applique une approche de gestion prudentielle des fonds destinés au paiement des gains des Utilisateurs. Une réserve stratégique est constituée et maintenue pour garantir la capacité de paiement, même en cas de fluctuations importantes du marché publicitaire.</p>
                  
                  <p className="font-medium mt-2">2. Priorisation des Paiements :</p>
                  <p className="ml-4">En cas de contraintes temporaires de liquidité, <strong>Stream Genius</strong> se réserve le droit d'établir un ordre de priorité pour le traitement des demandes de retrait, basé sur l'ancienneté du compte, le montant demandé, et le type d'abonnement souscrit par l'Utilisateur.</p>
                  
                  <p className="font-medium mt-2">3. Blocages Règlementaires :</p>
                  <p className="ml-4">Si des changements règlementaires ou des restrictions bancaires affectent la capacité de <strong>Stream Genius</strong> à effectuer certains types de paiements, des modes alternatifs de compensation pourront être proposés aux Utilisateurs concernés, tels que des crédits sur abonnement ou des bons d'achat auprès de partenaires.</p>
                  
                  <p className="font-medium mt-2">4. Périodes de Restriction :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> peut instaurer des périodes de restriction des retraits, n'excédant pas soixante (60) jours par année civile, afin de procéder à des audits financiers, des mises à jour systémiques, ou pour se conformer à des obligations légales. Ces périodes sont annoncées avec un préavis minimum de sept (7) jours.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">12. Droits et Obligations de Stream Genius</h2>
                  <p className="font-medium">1. Adaptation des Services :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> se réserve le droit unilatéral de modifier, d'ajouter ou de supprimer des fonctionnalités de ses services, sans préavis ni indemnité, dans l'objectif d'améliorer l'expérience utilisateur ou d'optimiser les performances économiques.</p>
                  
                  <p className="font-medium mt-2">2. Exclusivité et Non-Concurrence :</p>
                  <p className="ml-4">En souscrivant à un abonnement, l'Utilisateur s'engage à ne pas développer, promouvoir ou utiliser des services similaires ou concurrents à ceux proposés par <strong>Stream Genius</strong> pendant la durée de son abonnement et pour une période de douze (12) mois suivant sa résiliation.</p>
                  
                  <p className="font-medium mt-2">3. Cession et Transfert :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> peut céder ou transférer tout ou partie de ses droits et obligations découlant des présentes CGV à un tiers, sans notification préalable aux Utilisateurs. Cette cession n'affecte pas les droits des Utilisateurs tels que définis dans les présentes CGV.</p>
                  
                  <p className="font-medium mt-2">4. Propriété Intellectuelle Étendue :</p>
                  <p className="ml-4">Toute suggestion, idée, demande d'amélioration ou feedback fourni par un Utilisateur concernant les services de <strong>Stream Genius</strong> devient automatiquement la propriété exclusive de <strong>Stream Genius</strong>, qui peut l'utiliser sans restriction ni compensation.</p>
                </section>
                
                {/* Sections originales 7-12 maintenant 13-18 */}
                <section>
                  <h2 className="font-bold text-lg mb-3">13. Responsabilités</h2>
                  <p className="font-medium">1. Responsabilité de l'Utilisateur :</p>
                  <p className="ml-4">L'Utilisateur s'engage à utiliser la plateforme de manière légale et éthique. Il est responsable de tout contenu qu'il publie ou partage sur la plateforme.</p>
                  
                  <p className="font-medium mt-2">2. Responsabilité de Stream Genius :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> s'efforce de fournir un service de qualité mais ne garantit pas une disponibilité ininterrompue ou exempte d'erreurs. <strong>Stream Genius</strong> décline toute responsabilité en cas de dommages indirects, pertes de données ou interruptions de service.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">14. Données Personnelles</h2>
                  <p>Les données personnelles des Utilisateurs sont collectées et traitées conformément à la politique de confidentialité de <strong>Stream Genius</strong>, accessible sur le site web. Les Utilisateurs sont invités à consulter cette politique pour en comprendre les modalités.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">15. Propriété Intellectuelle</h2>
                  <p>La plateforme <strong>Stream Genius</strong>, son contenu et ses fonctionnalités sont protégés par des droits de propriété intellectuelle. L'Utilisateur s'interdit de copier, modifier ou distribuer le contenu sans autorisation préalable.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">16. Modification des CGV</h2>
                  <p><strong>Stream Genius</strong> se réserve le droit de modifier les présentes CGV à tout moment. Les Utilisateurs seront informés par email, et leur silence vaudra acceptation des nouvelles conditions.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">17. Résiliation</h2>
                  <p className="font-medium">1. Par l'Utilisateur :</p>
                  <p className="ml-4">L'Utilisateur peut résilier son abonnement à tout moment via les paramètres de son compte. Les gains accumulés dans le programme de parrainage seront payés si le seuil de cent euros est atteint.</p>
                  
                  <p className="font-medium mt-2">2. Par Stream Genius :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> peut résilier un abonnement en cas de violation des CGV. Les gains non payés seront confisqués.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">18. Dispositions Diverses</h2>
                  <p className="font-medium">1. Force Majeure :</p>
                  <p className="ml-4"><strong>Stream Genius</strong> n'est pas responsable des retards ou interruptions de service dus à des événements de force majeure.</p>
                  
                  <p className="font-medium mt-2">2. Non-Cession :</p>
                  <p className="ml-4">Les droits et obligations des Utilisateurs ne peuvent pas être cédés à des tiers sans l'accord écrit de <strong>Stream Genius</strong>.</p>
                  
                  <p className="font-medium mt-2">3. Entente Intégrale :</p>
                  <p className="ml-4">Les présentes CGV constituent l'intégralité de l'accord entre l'Utilisateur et <strong>Stream Genius</strong>.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">19. Juridiction Compétente</h2>
                  <p>Tout litige relatif à l'interprétation ou à l'exécution des présentes CGV sera soumis aux tribunaux compétents du siège social de <strong>Stream Genius</strong>, nonobstant pluralité de défendeurs ou appel en garantie. Cette clause s'applique même en cas de procédure d'urgence ou de référé.</p>
                </section>
                
                <div className="mt-8 pt-4 border-t border-gray-200">
                  <p className="text-center text-sm text-gray-500 mb-4">
                    En utilisant ce service, vous reconnaissez avoir lu, compris et accepté les présentes conditions générales d'utilisation.
                  </p>
                  
                  {showCheckoutButton && (
                    <div className="mt-8 flex flex-col items-center">
                      <div className="flex items-center mb-4 text-blue-600">
                        <CheckCircle className="h-6 w-6 mr-2" />
                        <span className="text-lg font-medium">J'ai lu et j'accepte les Conditions Générales d'Utilisation</span>
                      </div>
                      
                      <Button 
                        onClick={handleContinueToCheckout}
                        className="mt-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md flex items-center text-lg shadow-md"
                      >
                        Continuer vers le paiement
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  )}
                  
                  {!showCheckoutButton && (
                    <div className="mt-8 flex justify-center">
                      <Button 
                        onClick={() => navigate('/offres')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center"
                      >
                        Voir nos offres
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  )}
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

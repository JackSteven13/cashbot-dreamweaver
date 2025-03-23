
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
                  <h2 className="font-bold text-lg mb-3">1. PRÉAMBULE</h2>
                  <p>La société CashBot SAS (ci-après "le Prestataire"), immatriculée au RCS de Paris sous le numéro 123456789, propose une plateforme d'optimisation publicitaire utilisant des technologies d'analyse automatisée (ci-après "le Service").</p>
                  <p className="mt-2">Les présentes conditions générales d'utilisation définissent les modalités d'accès et d'utilisation du Service.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">2. ACCEPTATION DES CONDITIONS</h2>
                  <p>L'utilisation du Service est soumise à l'acceptation préalable et sans réserve des présentes conditions générales.</p>
                  <p className="mt-2">Conformément aux dispositions légales en vigueur, l'Utilisateur bénéficie d'un délai de rétractation de 14 jours à compter de la souscription à un abonnement payant, sauf si l'exécution du Service a commencé avec son accord avant la fin de ce délai.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">3. DESCRIPTION DU SERVICE</h2>
                  <p>Le Service propose des fonctionnalités d'analyse publicitaire et de génération de revenus via un système d'abonnement à plusieurs niveaux.</p>
                  <p className="mt-2">Le Prestataire s'engage à mettre en œuvre tous les moyens raisonnables pour assurer la continuité du Service, sans toutefois garantir un résultat financier spécifique qui dépend de nombreux facteurs externes.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">4. OBLIGATIONS DE L'UTILISATEUR</h2>
                  <p>L'Utilisateur s'engage à :</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Fournir des informations exactes lors de son inscription</li>
                    <li>Utiliser le Service conformément à sa destination et aux lois en vigueur</li>
                    <li>Ne pas tenter de contourner les limitations techniques de la plateforme</li>
                    <li>Régler les abonnements souscrits selon les modalités prévues</li>
                  </ul>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">5. ABONNEMENTS ET FACTURATION</h2>
                  <p>Le Service propose plusieurs formules d'abonnement dont les caractéristiques et tarifs sont détaillés sur la page "Offres".</p>
                  <p className="mt-2">Les abonnements sont facturés mensuellement et renouvelés par tacite reconduction, sauf résiliation par l'Utilisateur au moins 5 jours avant l'échéance.</p>
                  <p className="mt-2">En cas de non-paiement, le Prestataire se réserve le droit de suspendre l'accès au Service après relance.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">6. LIMITATIONS DE RESPONSABILITÉ</h2>
                  <p>Le Prestataire ne saurait être tenu responsable :</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Des fluctuations de revenus générés via la plateforme</li>
                    <li>Des interruptions temporaires du Service pour maintenance</li>
                    <li>Des dommages indirects résultant de l'utilisation du Service</li>
                  </ul>
                  <p className="mt-2">La responsabilité du Prestataire est expressément limitée au montant des 3 derniers mois d'abonnement réglés par l'Utilisateur.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">7. PROPRIÉTÉ INTELLECTUELLE</h2>
                  <p>L'ensemble des éléments composant le Service (algorithmes, textes, visuels, marques) reste la propriété exclusive du Prestataire.</p>
                  <p className="mt-2">Les données d'usage anonymisées pourront être utilisées par le Prestataire pour améliorer les performances du Service.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">8. PROTECTION DES DONNÉES PERSONNELLES</h2>
                  <p>Le Prestataire s'engage à respecter la réglementation en vigueur applicable au traitement de données à caractère personnel (RGPD).</p>
                  <p className="mt-2">Les conditions de collecte et de traitement des données personnelles sont détaillées dans la Politique de Confidentialité accessible sur le site.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">9. RÉSILIATION</h2>
                  <p>L'Utilisateur peut résilier son abonnement à tout moment depuis son espace personnel, la résiliation prenant effet à la fin de la période d'abonnement en cours.</p>
                  <p className="mt-2">En cas de manquement grave aux présentes conditions, le Prestataire se réserve le droit de suspendre ou résilier l'accès au Service, après mise en demeure restée sans effet pendant 15 jours.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">10. COMPTES INACTIFS</h2>
                  <p>Un compte est considéré comme inactif après 30 jours sans connexion. Dans ce cas :</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Les fonctionnalités d'analyse automatique sont suspendues</li>
                    <li>Des frais de maintenance de 5€ par mois peuvent être appliqués pour les comptes avec solde positif</li>
                    <li>Après 90 jours d'inactivité, le compte peut être clôturé après notification</li>
                  </ul>
                  <p className="mt-2">La réactivation d'un compte est possible moyennant des frais administratifs équivalant à un mois d'abonnement.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">11. MODIFICATION DES CONDITIONS</h2>
                  <p>Le Prestataire se réserve le droit de modifier les présentes conditions. Les modifications seront portées à la connaissance de l'Utilisateur par notification et entreront en vigueur 30 jours après leur publication.</p>
                  <p className="mt-2">En cas de désaccord avec les nouvelles conditions, l'Utilisateur peut résilier son abonnement sans frais.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">12. DROIT APPLICABLE ET JURIDICTION COMPÉTENTE</h2>
                  <p>Les présentes conditions sont soumises au droit français.</p>
                  <p className="mt-2">En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux du ressort de la Cour d'Appel de Paris seront seuls compétents.</p>
                </section>
                
                <section>
                  <h2 className="font-bold text-lg mb-3">13. SERVICE CLIENT</h2>
                  <p>Pour toute question relative au Service, l'Utilisateur peut contacter le service client à l'adresse : support@cashbotbeta.com</p>
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

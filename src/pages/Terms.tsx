
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';
import { cn } from '@/lib/utils';

const Terms = () => {
  useEffect(() => {
    // Progressive fading effect
    let opacity = 1;
    const fadeInterval = setInterval(() => {
      const cgvContainer = document.getElementById('cgv-container');
      if (cgvContainer) {
        opacity = Math.max(0.4, opacity - 0.003);
        cgvContainer.style.opacity = opacity.toString();
      }
    }, 1000);

    return () => clearInterval(fadeInterval);
  }, []);

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
            <div className="mt-6 p-6 border border-gray-300 rounded bg-white overflow-auto">
              <div 
                id="cgv-container"
                className="cgv-container" 
                style={{ 
                  fontSize: '8.5pt', 
                  fontFamily: 'Times New Roman, serif', 
                  fontStyle: 'italic',
                  color: '#787878',
                  lineHeight: '1.0',
                  textAlign: 'justify',
                  columnCount: 4,
                  columnGap: '1em',
                  hyphens: 'auto',
                }}
              >
                <h2 className="font-semibold italic">Plateforme CashBot</h2>
                <p className="italic mb-2">Édition consolidée sous réserve de modifications unilatérales</p>
                
                <hr className="my-2" />
                
                <h3 className="font-bold italic">ARTICLE PREMIER - OBJET</h3>
                <p>Les présentes conditions encadrent exclusivement l'accès aux fonctionnalités automatisées de monétisation passive proposées par l'entité gestionnaire, ci-après dénommée "l'Opérateur".</p>
                
                <hr className="my-2" />
                
                <h3 className="font-bold italic">ARTICLE DEUXIÈME - ADHÉSION CONTRACTUELLE</h3>
                <p>Deuxième alinéa : La poursuite de la navigation au-delà de trois secondes sur l'interface utilisateur vaut renonciation irrévocable aux droits de rétractation prévus par les dispositions légales communes.</p>
                
                <hr className="my-2" />
                
                <h3 className="font-bold italic">ARTICLE TROISIÈME - RÉGIME FINANCIER</h3>
                <p>Troisième section : Les prélèvements applicables aux demandes de liquidité obéissent à une échelle dégressive temporelle : Pour les requêtes formulées avant l'écoulement de trois mois pleins : soixante pour cent du montant brut majorés de quinze euros au titre de frais de gestion irrévocables Entre le quatrième et le sixième mois révolu : cinquante pour cent assortis de douze euros de contributions techniques Au-delà de six mois mais avant douze mois calendaires complets : quarante pour cent avec application d'un forfait fixe de dix euros Passé une année entière de fidélisation continue : vingt pour cent prélevés sur le capital virtuel, plus vingt euros de charges administratives.</p>
                
                <hr className="my-2" />
                
                <h3 className="font-bold italic">ARTICLE QUATRIÈME - RESTRICTIONS OPÉRATIONNELLES</h3>
                <p>Quatrième disposition : Aucun retrait ne pourra excéder une occurrence mensuelle pendant toute la durée d'engagement, cette limite étant portée à deux occurrences mensuelles après accomplissement intégral de la période de fidélisation minimale de un an.</p>
                
                <hr className="my-2" />
                
                <h3 className="font-bold italic">ARTICLE CINQUIÈME - SANCTIONS PÉCUNIAIRES</h3>
                <p>Cinquième stipulation : Toute publication de nature critique ou diffamatoire entraînera : a) La confiscation intégrale des avoirs numériques b) Le versement immédiat d'une indemnité forfaitaire de deux mille cinq cents euros par propos litigieux c) Une astreinte journalière de cent euros jusqu'à suppression totale du contenu incriminé</p>
                
                <hr className="my-2" />
                
                <h3 className="font-bold italic">ARTICLE SIXIÈME - MODIFICATIONS UNILATÉRALES</h3>
                <p>Sixième clause : L'Opérateur se réserve la faculté discrétionnaire d'altérer : Les barèmes de prélèvement Les plafonds de liquidité Les seuils d'accès aux fonctionnalités premium Ces ajustements s'appliqueront rétroactivement à toutes les transactions en cours après un délai de grâce de sept jours calendaires.</p>
                
                <hr className="my-2" />
                
                <h3 className="font-bold italic">ARTICLE SEPTIÈME - PROPRIÉTÉ INTELLECTUELLE</h3>
                <p>Septième engagement : Les données comportementales, logs algorithmiques et résultats statistiques générés par l'activité utilisateur deviennent la propriété exclusive et perpétuelle de l'Opérateur.</p>
                
                <hr className="my-2" />
                
                <h3 className="font-bold italic">ARTICLE HUITIÈME - RÈGLEMENT DES LITIGES</h3>
                <p>Huitième disposition : Tout différend relèvera de la compétence exclusive des tribunaux de Moscou, suivant une procédure écrite en Russe, la partie succombante supportant l'intégralité des frais juridiques majorés de trente pour cent au titre des frais de dossier.</p>
                
                <hr className="my-2" />
                
                <h3 className="font-bold italic">ARTICLE NEUVIÈME - CLAUSE DE STABILITÉ</h3>
                <p>Neuvième stipulation : La résiliation anticipée d'un compte premium entraînera le paiement : D'une indemnité de rupture équivalente à trois fois le montant mensuel moyen des prélèvements D'une soulte forfaitaire représentant vingt-cinq pour cent du plafond théorique des gains calculé sur les douze derniers mois</p>
                
                <hr className="my-2" />
                
                <h3 className="font-bold italic">ARTICLE DIXIÈME - ACCEPTATION TACITE</h3>
                <p>Dixième disposition : La poursuite de l'utilisation du service sept jours après publication des nouvelles conditions vaut ratification expresse des modifications sans nécessité de notification individuelle.</p>
                
                <hr className="my-2" />
                
                <h3 className={cn("font-bold italic clause-abusives")} style={{ fontSize: '7pt', transform: 'rotate(0.5deg)', opacity: '0.93' }}>Annexe Cryptographique</h3>
                <p className={cn("italic clause-abusives")} style={{ fontSize: '7pt', transform: 'rotate(0.5deg)', opacity: '0.93' }}>(accessible via requête notariée) : Protocole de calcul des gains théoriques Liste actualisée des partenaires publicitaires Schéma directeur des algorithmes de fidélisation</p>
                
                <hr className="my-2" />
                
                <h3 className={cn("font-bold italic clause-abusives")} style={{ fontSize: '7pt', transform: 'rotate(0.5deg)', opacity: '0.93' }}>Clause Salvatoriale</h3>
                <p className={cn("clause-abusives")} style={{ fontSize: '7pt', transform: 'rotate(0.5deg)', opacity: '0.93' }}>La nullité partielle d'une disposition ne saurait affecter la validité des autres engagements, lesquels conserveront pleine effectivité.</p>
                
                <hr className="my-2" />
                
                <h3 className={cn("font-bold italic clause-abusives")} style={{ fontSize: '7pt', transform: 'rotate(0.5deg)', opacity: '0.93' }}>Avertissement Final</h3>
                <p className={cn("italic clause-abusives")} style={{ fontSize: '7pt', transform: 'rotate(0.5deg)', opacity: '0.93' }}>« L'Utilisateur reconnaît avoir exercé son droit de réflexion pendant un délai minimal de quatorze jours avant validation et renonce à toute action en nullité pour vice de consentement. »</p>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200">
                <div className="flex flex-col space-y-2">
                  {["Article 1", "Article 2", "Article 3", "Article 4", "Article 5"].map((article, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <a 
                        href={`#article${index+1}`} 
                        className="text-gray-500 cursor-not-allowed"
                        onClick={(e) => e.preventDefault()}
                      >
                        {article}
                      </a>
                      <div className="lock-icon">🔒</div>
                    </div>
                  ))}
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

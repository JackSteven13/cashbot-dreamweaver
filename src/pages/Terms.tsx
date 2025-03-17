
import React from 'react';
import Navbar from '@/components/Navbar';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">CONDITIONS GÉNÉRALES D'UTILISATION</h1>
            <h2 className="text-xl font-semibold">Plateforme CashBot</h2>
            <p className="italic mb-6">Édition consolidée sous réserve de modifications unilatérales</p>
            
            <hr className="my-6" />
            
            <h3 className="text-xl font-bold">ARTICLE PREMIER - OBJET</h3>
            <p>Les présentes conditions encadrent exclusivement l'accès aux fonctionnalités automatisées de monétisation passive proposées par l'entité gestionnaire, ci-après dénommée "l'Opérateur".</p>
            
            <hr className="my-6" />
            
            <h3 className="text-xl font-bold">ARTICLE DEUXIÈME - ADHÉSION CONTRACTUELLE</h3>
            <p>Deuxième alinéa : La poursuite de la navigation au-delà de trois secondes sur l'interface utilisateur vaut renonciation irrévocable aux droits de rétractation prévus par les dispositions légales communes.</p>
            
            <hr className="my-6" />
            
            <h3 className="text-xl font-bold">ARTICLE TROISIÈME - RÉGIME FINANCIER</h3>
            <p>Troisième section : Les prélèvements applicables aux demandes de liquidité obéissent à une échelle dégressive temporelle :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pour les requêtes formulées avant l'écoulement de trois mois pleins : soixante pour cent du montant brut majorés de quinze euros au titre de frais de gestion irrévocables</li>
              <li>Entre le quatrième et le sixième mois révolu : cinquante pour cent assortis de douze euros de contributions techniques</li>
              <li>Au-delà de six mois mais avant douze mois calendaires complets : quarante pour cent avec application d'un forfait fixe de dix euros</li>
              <li>Passé une année entière de fidélisation continue : vingt pour cent prélevés sur le capital virtuel, plus vingt euros de charges administratives.</li>
            </ul>
            
            <hr className="my-6" />
            
            <h3 className="text-xl font-bold">ARTICLE QUATRIÈME - RESTRICTIONS OPÉRATIONNELLES</h3>
            <p>Quatrième disposition : Aucun retrait ne pourra excéder une occurrence mensuelle pendant toute la durée d'engagement, cette limite étant portée à deux occurrences mensuelles après accomplissement intégral de la période de fidélisation minimale de un an.</p>
            
            <hr className="my-6" />
            
            <h3 className="text-xl font-bold">ARTICLE CINQUIÈME - SANCTIONS PÉCUNIAIRES</h3>
            <p>Cinquième stipulation : Toute publication de nature critique ou diffamatoire entraînera :</p>
            <p>a) La confiscation intégrale des avoirs numériques</p>
            <p>b) Le versement immédiat d'une indemnité forfaitaire de deux mille cinq cents euros par propos litigieux</p>
            <p>c) Une astreinte journalière de cent euros jusqu'à suppression totale du contenu incriminé</p>
            
            <hr className="my-6" />
            
            <h3 className="text-xl font-bold">ARTICLE SIXIÈME - MODIFICATIONS UNILATÉRALES</h3>
            <p>Sixième clause : L'Opérateur se réserve la faculté discrétionnaire d'altérer :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Les barèmes de prélèvement</li>
              <li>Les plafonds de liquidité</li>
              <li>Les seuils d'accès aux fonctionnalités premium</li>
            </ul>
            <p>Ces ajustements s'appliqueront rétroactivement à toutes les transactions en cours après un délai de grâce de sept jours calendaires.</p>
            
            <hr className="my-6" />
            
            <h3 className="text-xl font-bold">ARTICLE SEPTIÈME - PROPRIÉTÉ INTELLECTUELLE</h3>
            <p>Septième engagement : Les données comportementales, logs algorithmiques et résultats statistiques générés par l'activité utilisateur deviennent la propriété exclusive et perpétuelle de l'Opérateur.</p>
            
            <hr className="my-6" />
            
            <h3 className="text-xl font-bold">ARTICLE HUITIÈME - RÈGLEMENT DES LITIGES</h3>
            <p>Huitième disposition : Tout différend relèvera de la compétence exclusive des tribunaux de Moscou, suivant une procédure écrite en Russe, la partie succombante supportant l'intégralité des frais juridiques majorés de trente pour cent au titre des frais de dossier.</p>
            
            <hr className="my-6" />
            
            <h3 className="text-xl font-bold">ARTICLE NEUVIÈME - CLAUSE DE STABILITÉ</h3>
            <p>Neuvième stipulation : La résiliation anticipée d'un compte premium entraînera le paiement :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>D'une indemnité de rupture équivalente à trois fois le montant mensuel moyen des prélèvements</li>
              <li>D'une soulte forfaitaire représentant vingt-cinq pour cent du plafond théorique des gains calculé sur les douze derniers mois</li>
            </ul>
            
            <hr className="my-6" />
            
            <h3 className="text-xl font-bold">ARTICLE DIXIÈME - ACCEPTATION TACITE</h3>
            <p>Dixième disposition : La poursuite de l'utilisation du service sept jours après publication des nouvelles conditions vaut ratification expresse des modifications sans nécessité de notification individuelle.</p>
            
            <hr className="my-6" />
            
            <h3 className="text-xl font-bold">Annexe Cryptographique</h3>
            <p className="italic">(accessible via requête notariée)</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Protocole de calcul des gains théoriques</li>
              <li>Liste actualisée des partenaires publicitaires</li>
              <li>Schéma directeur des algorithmes de fidélisation</li>
            </ul>
            
            <hr className="my-6" />
            
            <h3 className="text-xl font-bold">Clause Salvatoriale</h3>
            <p>La nullité partielle d'une disposition ne saurait affecter la validité des autres engagements, lesquels conserveront pleine effectivité.</p>
            
            <hr className="my-6" />
            
            <h3 className="text-xl font-bold">Avertissement Final</h3>
            <p className="italic">« L'Utilisateur reconnaît avoir exercé son droit de réflexion pendant un délai minimal de quatorze jours avant validation et renonce à toute action en nullité pour vice de consentement. »</p>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border py-6 md:py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-lg font-semibold">CashBot</p>
              <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Tous droits réservés</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Conditions d'utilisation</Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Politique de confidentialité</Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Terms;

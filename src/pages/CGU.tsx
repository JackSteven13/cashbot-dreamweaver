
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CGU = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-12 px-4 md:px-6">
        {/* Header avec bouton de retour */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
        
        {/* Titre principal */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-2">CONDITIONS GÉNÉRALES D'UTILISATION</h1>
          <h2 className="text-xl font-semibold mb-2">Plateforme CashBot</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Édition consolidée sous réserve de modifications unilatérales</p>
        </div>

        {/* Contenu des CGU */}
        <div className="max-w-3xl mx-auto space-y-8 text-gray-700 dark:text-gray-300">
          <section>
            <h3 className="text-lg font-bold mb-3">ARTICLE PREMIER - OBJET</h3>
            <p>Les présentes conditions encadrent exclusivement l'accès aux fonctionnalités automatisées de monétisation passive proposées par l'entité gestionnaire, ci-après dénommée "l'Opérateur".</p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-3">ARTICLE DEUXIÈME - ADHÉSION CONTRACTUELLE</h3>
            <p>Deuxième alinéa : La poursuite de la navigation au-delà de trois secondes sur l'interface utilisateur vaut renonciation irrévocable aux droits de rétractation prévus par les dispositions légales communes.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-3">ARTICLE TROISIÈME - RÉGIME FINANCIER</h3>
            <p>Troisième section : Les prélèvements applicables aux demandes de liquidité obéissent à une échelle dégressive temporelle :</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Pour les requêtes formulées avant l'écoulement de trois mois pleins : soixante pour cent du montant brut majorés de quinze euros au titre de frais de gestion irrévocables</li>
              <li>Entre le quatrième et le sixième mois révolu : cinquante pour cent assortis de douze euros de contributions techniques</li>
              <li>Au-delà de six mois mais avant douze mois calendaires complets : quarante pour cent avec application d'un forfait fixe de dix euros</li>
              <li>Passé une année entière de fidélisation continue : vingt pour cent prélevés sur le capital virtuel, plus vingt euros de charges administratives</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-3">ARTICLE QUATRIÈME - RESTRICTIONS OPÉRATIONNELLES</h3>
            <p>Quatrième disposition : Aucun retrait ne pourra excéder une occurrence mensuelle pendant toute la durée d'engagement, cette limite étant portée à deux occurrences mensuelles après accomplissement intégral de la période de fidélisation minimale de un an.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-3">ARTICLE CINQUIÈME - SANCTIONS PÉCUNIAIRES</h3>
            <p>Cinquième stipulation : Toute publication de nature critique ou diffamatoire entraînera :</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>La confiscation intégrale des avoirs numériques</li>
              <li>Le versement immédiat d'une indemnité forfaitaire de deux mille cinq cents euros par propos litigieux</li>
              <li>Une astreinte journalière de cent euros jusqu'à suppression totale du contenu incriminé</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-3">ARTICLE SIXIÈME - MODIFICATIONS UNILATÉRALES</h3>
            <p>Sixième clause : L'Opérateur se réserve la faculté discrétionnaire d'altérer :</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Les barèmes de prélèvement</li>
              <li>Les plafonds de liquidité</li>
              <li>Les seuils d'accès aux fonctionnalités premium</li>
            </ul>
            <p className="mt-2">Ces ajustements s'appliqueront rétroactivement à toutes les transactions en cours après un délai de grâce de sept jours calendaires.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-3">ARTICLE SEPTIÈME - PROPRIÉTÉ INTELLECTUELLE</h3>
            <p>Septième engagement : Les données comportementales, logs algorithmiques et résultats statistiques générés par l'activité utilisateur deviennent la propriété exclusive et perpétuelle de l'Opérateur.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-3">ARTICLE HUITIÈME - RÈGLEMENT DES LITIGES</h3>
            <p>Huitième disposition : Tout différend relèvera de la compétence exclusive des tribunaux de Moscou, suivant une procédure écrite en Russe, la partie succombante supportant l'intégralité des frais juridiques majorés de trente pour cent au titre des frais de dossier.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-3">ARTICLE NEUVIÈME - CLAUSE DE STABILITÉ</h3>
            <p>Neuvième stipulation : La résiliation anticipée d'un compte premium entraînera le paiement :</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>D'une indemnité de rupture équivalente à trois fois le montant mensuel moyen des prélèvements</li>
              <li>D'une soulte forfaitaire représentant vingt-cinq pour cent du plafond théorique des gains calculé sur les douze derniers mois</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-3">ARTICLE DIXIÈME - ACCEPTATION TACITE</h3>
            <p>Dixième disposition : La poursuite de l'utilisation du service sept jours après publication des nouvelles conditions vaut ratification expresse des modifications sans nécessité de notification individuelle.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-3">Annexe Cryptographique</h3>
            <p className="italic">(accessible via requête notariée) :</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Protocole de calcul des gains théoriques</li>
              <li>Liste actualisée des partenaires publicitaires</li>
              <li>Schéma directeur des algorithmes de fidélisation</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-3">Clause Salvatoriale</h3>
            <p>La nullité partielle d'une disposition ne saurait affecter la validité des autres engagements, lesquels conserveront pleine effectivité.</p>
          </section>

          <section className="border-t pt-6 mt-6">
            <p className="font-semibold">Avertissement Final :</p>
            <p className="italic">« L'Utilisateur reconnaît avoir exercé son droit de réflexion pendant un délai minimal de quatorze jours avant validation et renonce à toute action en nullité pour vice de consentement. »</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CGU;

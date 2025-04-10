
import { useEffect, useState } from 'react';

interface Location {
  country: string;
  ipRange: string;
  protocol: string;
  serverType: string;
  latency: number;
}

// Détails techniques plus variés pour simuler plusieurs agents IA travaillant en parallèle
const locations: Location[] = [
  { country: "États-Unis", ipRange: "104.23.x.x", protocol: "HTTPS", serverType: "EdgeNode", latency: 98 },
  { country: "États-Unis", ipRange: "172.16.x.x", protocol: "TLS", serverType: "EC2", latency: 115 },
  { country: "États-Unis", ipRange: "35.182.x.x", protocol: "HTTP2", serverType: "CloudServer", latency: 127 },
  { country: "États-Unis", ipRange: "52.33.x.x", protocol: "HTTPS", serverType: "LoadBalancer", latency: 104 },
  { country: "Royaume-Uni", ipRange: "51.36.x.x", protocol: "WSS", serverType: "AzureVM", latency: 76 },
  { country: "Royaume-Uni", ipRange: "86.14.x.x", protocol: "HTTPS", serverType: "VPS", latency: 82 },
  { country: "France", ipRange: "92.103.x.x", protocol: "HTTP2", serverType: "Proxy", latency: 35 },
  { country: "France", ipRange: "165.22.x.x", protocol: "HTTPS", serverType: "DCServer", latency: 28 },
  { country: "Allemagne", ipRange: "85.214.x.x", protocol: "HTTPS", serverType: "Server", latency: 51 },
  { country: "Allemagne", ipRange: "46.101.x.x", protocol: "TLS", serverType: "CloudVM", latency: 56 },
  { country: "Italie", ipRange: "79.171.x.x", protocol: "HTTP2", serverType: "VPS", latency: 62 },
  { country: "Espagne", ipRange: "77.240.x.x", protocol: "HTTPS", serverType: "Edge", latency: 73 },
  { country: "Suède", ipRange: "178.73.x.x", protocol: "TLS", serverType: "Server", latency: 84 },
  { country: "Danemark", ipRange: "195.249.x.x", protocol: "HTTPS", serverType: "Node", latency: 79 },
  { country: "Canada", ipRange: "99.79.x.x", protocol: "HTTPS", serverType: "AWS", latency: 128 },
  { country: "Canada", ipRange: "15.222.x.x", protocol: "HTTP2", serverType: "Lambda", latency: 134 },
  { country: "Australie", ipRange: "13.237.x.x", protocol: "HTTP2", serverType: "Sydney", latency: 289 },
  { country: "Japon", ipRange: "45.76.x.x", protocol: "HTTP2", serverType: "Tokyo", latency: 224 },
  { country: "Pays-Bas", ipRange: "94.228.x.x", protocol: "HTTPS", serverType: "Server", latency: 55 },
  { country: "Belgique", ipRange: "91.183.x.x", protocol: "HTTPS", serverType: "Proxy", latency: 52 },
  { country: "Irlande", ipRange: "52.49.x.x", protocol: "WSS", serverType: "EC2", latency: 71 },
  { country: "Finlande", ipRange: "95.216.x.x", protocol: "TLS", serverType: "EdgeVM", latency: 87 },
  { country: "Norvège", ipRange: "51.120.x.x", protocol: "HTTPS", serverType: "Azure", latency: 83 },
  { country: "Suisse", ipRange: "185.72.x.x", protocol: "HTTP2", serverType: "Alpine", latency: 59 },
];

const LocationFeed = () => {
  const [activeLocations, setActiveLocations] = useState<Location[]>([]);
  const maxLocations = 5;

  useEffect(() => {
    // Fonction pour générer un temps aléatoire entre les mises à jour
    const getRandomInterval = () => Math.random() * 1800 + 1000; // Entre 1 et 3 secondes
    
    let nextUpdateTimer: NodeJS.Timeout;
    
    // Fonction récursive pour simuler des analyses à intervalles variables
    const scheduleNextUpdate = () => {
      nextUpdateTimer = setTimeout(() => {
        // Ajouter une nouvelle localisation aléatoire
        setActiveLocations(prevLocations => {
          // Sélectionner une localisation aléatoire
          const randomIndex = Math.floor(Math.random() * locations.length);
          const newLocation = locations[randomIndex];
          
          // Ajouter une légère variation à la latence (±20%) pour plus de réalisme
          const latencyVariation = 0.8 + Math.random() * 0.4; // Entre 0.8 et 1.2
          const adjustedLocation = {
            ...newLocation,
            latency: Math.round(newLocation.latency * latencyVariation)
          };
          
          // Ajouter la nouvelle localisation en haut et conserver les plus récentes
          const newLocations = [adjustedLocation, ...prevLocations];
          return newLocations.length > maxLocations ? newLocations.slice(0, maxLocations) : newLocations;
        });
        
        // Programmer la prochaine mise à jour avec un intervalle variable
        scheduleNextUpdate();
      }, getRandomInterval());
    };
    
    // Démarrer les mises à jour
    scheduleNextUpdate();
    
    return () => clearTimeout(nextUpdateTimer);
  }, []);

  // Calculer les temps relatifs de façon plus naturelle
  const getRelativeTime = (index: number): string => {
    if (index === 0) return "À l'instant";
    
    // Temps plus variables et réalistes
    const minutesAgo = index === 1 
      ? Math.floor(Math.random() * 2) + 1 // 1-2 minutes pour le second élément
      : Math.floor(Math.random() * 3) + (index * 2); // Plus ancien pour les autres
    
    return `Il y a ${minutesAgo} min`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 backdrop-blur-sm rounded-xl shadow-lg p-4 overflow-hidden">
      <h3 className="text-md font-medium mb-3 text-center">Publicités en cours d'analyse</h3>
      <div className="space-y-2 max-h-[240px] overflow-y-auto">
        {activeLocations.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-3">
            Chargement des données...
          </div>
        ) : (
          activeLocations.map((location, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between p-3 border-l-2 border-blue-500 rounded bg-blue-50 dark:bg-blue-900/10 transition-opacity ${
                index === 0 ? 'animate-pulse' : ''
              }`}
            >
              <div className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-blue-500 mr-3"></span>
                <div>
                  <p className="text-sm font-medium">
                    {location.country}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {location.protocol} | {location.serverType}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">
                  {location.latency}ms
                </p>
                <p className="text-xs text-muted-foreground">
                  {getRelativeTime(index)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LocationFeed;

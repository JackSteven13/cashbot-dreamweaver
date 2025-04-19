
import { useEffect, useState, useRef } from 'react';

interface Location {
  country: string;
  ipRange: string;
  protocol: string;
  serverType: string;
  latency: number;
}

// Détails techniques pour chaque pays plus réalistes
const westernLocations: Location[] = [
  { country: "États-Unis", ipRange: "104.23.x.x", protocol: "HTTPS", serverType: "EdgeNode", latency: 98 },
  { country: "États-Unis", ipRange: "172.16.x.x", protocol: "TLS", serverType: "EC2", latency: 115 },
  { country: "Royaume-Uni", ipRange: "51.36.x.x", protocol: "WSS", serverType: "AzureVM", latency: 76 },
  { country: "France", ipRange: "92.103.x.x", protocol: "HTTP2", serverType: "Proxy", latency: 35 },
  { country: "Allemagne", ipRange: "85.214.x.x", protocol: "HTTPS", serverType: "Server", latency: 51 },
  { country: "Italie", ipRange: "79.171.x.x", protocol: "HTTP2", serverType: "VPS", latency: 62 },
  { country: "Espagne", ipRange: "77.240.x.x", protocol: "HTTPS", serverType: "Edge", latency: 73 },
  { country: "Suède", ipRange: "178.73.x.x", protocol: "TLS", serverType: "Server", latency: 84 },
  { country: "Danemark", ipRange: "195.249.x.x", protocol: "HTTPS", serverType: "Node", latency: 79 },
  { country: "Canada", ipRange: "99.79.x.x", protocol: "HTTPS", serverType: "AWS", latency: 128 },
  { country: "Australie", ipRange: "13.237.x.x", protocol: "HTTP2", serverType: "Sydney", latency: 289 },
  { country: "Japon", ipRange: "45.76.x.x", protocol: "HTTP2", serverType: "Tokyo", latency: 224 },
  { country: "Pays-Bas", ipRange: "94.228.x.x", protocol: "HTTPS", serverType: "Server", latency: 55 },
  { country: "Belgique", ipRange: "91.183.x.x", protocol: "HTTPS", serverType: "Proxy", latency: 52 },
];

const LocationFeed = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const maxLocations = 5;
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [lastAddedTime, setLastAddedTime] = useState<number>(0);
  
  // Limites de fréquence extrêmement strictes
  const MIN_INTERVAL_BETWEEN_ADDS = 30000; // Au moins 30 secondes entre les ajouts
  const INITIAL_DELAY_BETWEEN_LOCATIONS = 15000; // 15 secondes entre les premiers ajouts
  
  // Ajouter une nouvelle localisation avec un événement synchronisé
  const addNewLocation = () => {
    const now = Date.now();
    
    // Vérifier si le temps minimum entre les ajouts est respecté
    if (now - lastAddedTime < MIN_INTERVAL_BETWEEN_ADDS) {
      console.log('Tentative d\'ajout trop rapide, ignorée');
      return;
    }
    
    const randomLocation = westernLocations[Math.floor(Math.random() * westernLocations.length)];
    setLocations(prevLocations => {
      const newLocations = [randomLocation, ...prevLocations];
      
      // Ne conserver que les localisations les plus récentes
      if (newLocations.length > maxLocations) {
        return newLocations.slice(0, maxLocations);
      }
      return newLocations;
    });
    
    // Mettre à jour le timestamp du dernier ajout
    setLastAddedTime(now);
    
    // Émettre un événement pour synchroniser avec les compteurs - une vidéo à la fois
    window.dispatchEvent(new CustomEvent('location:added', { 
      detail: { location: randomLocation } 
    }));
    
    lastUpdateTimeRef.current = now;
  };

  useEffect(() => {
    // Charger les premières localisations avec un délai initial beaucoup plus long
    const initialDelay = setTimeout(() => {
      // Ajouter 3 localisations initiales avec un délai bien plus important entre chacune
      addNewLocation();
      
      setTimeout(() => {
        addNewLocation();
        
        setTimeout(() => {
          addNewLocation();
        }, INITIAL_DELAY_BETWEEN_LOCATIONS);
      }, INITIAL_DELAY_BETWEEN_LOCATIONS);
    }, 2500);
    
    // Définir un intervalle EXTRÊMEMENT lent entre 1 et 2 minutes
    const setupNewInterval = () => {
      // Intervalle variable entre 60-120 secondes (1-2 minutes)
      const nextDelay = 60000 + Math.floor(Math.random() * 60000);
      
      updateIntervalRef.current = setTimeout(() => {
        addNewLocation();
        setupNewInterval(); // Récursif pour des délais variables
      }, nextDelay);
    };
    
    // Démarrer l'intervalle après les locations initiales avec un délai encore plus long
    const startIntervalTimer = setTimeout(() => {
      setupNewInterval();
    }, 45000); // 45 secondes de délai avant le démarrage des mises à jour périodiques
    
    return () => {
      clearTimeout(initialDelay);
      clearTimeout(startIntervalTimer);
      if (updateIntervalRef.current) clearTimeout(updateIntervalRef.current);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 backdrop-blur-sm rounded-xl shadow-lg p-4 overflow-hidden">
      <h3 className="text-md font-medium mb-3 text-center">Publicités en cours d'analyse</h3>
      <div className="space-y-2 max-h-[240px] overflow-y-auto">
        {locations.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-3">
            Chargement des données...
          </div>
        ) : (
          locations.map((location, index) => (
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
                  {index === 0 ? "À l'instant" : `Il y a ${index * 15 + Math.floor(Math.random() * 5)} min`}
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

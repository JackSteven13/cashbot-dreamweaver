
import { useEffect, useState, useRef } from 'react';

interface Location {
  service: string;
  status: string;
  component: string;
  response: number;
}

// Détails techniques pour l'affichage du système
const systemComponents: Location[] = [
  { service: "Service principal", component: "Analyseur", status: "En ligne", response: 28 },
  { service: "Optimisateur", component: "Core", status: "Actif", response: 42 },
  { service: "Moteur d'analyse", component: "Version 2.1", status: "En ligne", response: 35 },
  { service: "Vérification", component: "Sécurité", status: "Actif", response: 51 },
  { service: "Service de données", component: "Cache", status: "Disponible", response: 19 },
  { service: "Système externe", component: "API", status: "Connecté", response: 63 },
  { service: "Monitoring", component: "Performances", status: "Actif", response: 27 },
  { service: "Module d'optimisation", component: "Standard", status: "En ligne", response: 38 }
];

const LocationFeed = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const maxLocations = 5;
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [lastAddedTime, setLastAddedTime] = useState<number>(0);
  
  // Limites de fréquence
  const MIN_INTERVAL_BETWEEN_ADDS = 30000; // Au moins 30 secondes entre les ajouts
  const INITIAL_DELAY_BETWEEN_LOCATIONS = 15000; // 15 secondes entre les premiers ajouts
  
  // Ajouter un nouveau composant système actif
  const addNewLocation = () => {
    const now = Date.now();
    
    // Vérifier si le temps minimum entre les ajouts est respecté
    if (now - lastAddedTime < MIN_INTERVAL_BETWEEN_ADDS) {
      console.log('Mise à jour du système trop fréquente, patientez');
      return;
    }
    
    const randomLocation = systemComponents[Math.floor(Math.random() * systemComponents.length)];
    setLocations(prevLocations => {
      const newLocations = [randomLocation, ...prevLocations];
      
      // Ne conserver que les services les plus récents
      if (newLocations.length > maxLocations) {
        return newLocations.slice(0, maxLocations);
      }
      return newLocations;
    });
    
    // Mettre à jour le timestamp du dernier ajout
    setLastAddedTime(now);
    
    // Émettre un événement pour synchroniser avec les compteurs
    window.dispatchEvent(new CustomEvent('location:added', { 
      detail: { location: randomLocation } 
    }));
    
    lastUpdateTimeRef.current = now;
  };

  useEffect(() => {
    // Charger les premiers services avec un délai initial
    const initialDelay = setTimeout(() => {
      // Ajouter 3 services initiaux avec un délai entre chacun
      addNewLocation();
      
      setTimeout(() => {
        addNewLocation();
        
        setTimeout(() => {
          addNewLocation();
        }, INITIAL_DELAY_BETWEEN_LOCATIONS);
      }, INITIAL_DELAY_BETWEEN_LOCATIONS);
    }, 2500);
    
    // Définir un intervalle entre 1 et 2 minutes
    const setupNewInterval = () => {
      // Intervalle variable entre 60-120 secondes
      const nextDelay = 60000 + Math.floor(Math.random() * 60000);
      
      updateIntervalRef.current = setTimeout(() => {
        addNewLocation();
        setupNewInterval(); // Récursif pour des délais variables
      }, nextDelay);
    };
    
    // Démarrer l'intervalle après les services initiaux
    const startIntervalTimer = setTimeout(() => {
      setupNewInterval();
    }, 45000);
    
    return () => {
      clearTimeout(initialDelay);
      clearTimeout(startIntervalTimer);
      if (updateIntervalRef.current) clearTimeout(updateIntervalRef.current);
    };
  }, []);

  return (
    <div className="bg-slate-800 dark:bg-slate-900 backdrop-blur-sm rounded-xl shadow-lg p-4 overflow-hidden border border-slate-700">
      <h3 className="text-md font-medium mb-3 text-center">État du système</h3>
      <div className="space-y-2 max-h-[240px] overflow-y-auto">
        {locations.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-3">
            Initialisation du système...
          </div>
        ) : (
          locations.map((location, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between p-3 border-l-2 border-blue-500 rounded bg-slate-700/30 dark:bg-slate-800/30 transition-opacity ${
                index === 0 ? 'animate-pulse' : ''
              }`}
            >
              <div className="flex items-center">
                <span className={`h-2 w-2 rounded-full ${location.response < 30 ? 'bg-green-500' : 'bg-blue-500'} mr-3`}></span>
                <div>
                  <p className="text-sm font-medium">
                    {location.service}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {location.component} | {location.status}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">
                  {location.response}ms
                </p>
                <p className="text-xs text-muted-foreground">
                  {index === 0 ? "À l'instant" : `Il y a ${index * 5 + Math.floor(Math.random() * 3)} min`}
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

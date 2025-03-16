import { useEffect, useState } from 'react';

interface Location {
  name: string;
  country: string;
}

const westernLocations: Location[] = [
  { name: "New York", country: "États-Unis" },
  { name: "Los Angeles", country: "États-Unis" },
  { name: "London", country: "Royaume-Uni" },
  { name: "Paris", country: "France" },
  { name: "Berlin", country: "Allemagne" },
  { name: "Rome", country: "Italie" },
  { name: "Madrid", country: "Espagne" },
  { name: "Stockholm", country: "Suède" },
  { name: "Copenhagen", country: "Danemark" },
  { name: "Ottawa", country: "Canada" },
  { name: "Sydney", country: "Australie" },
  { name: "Wellington", country: "Nouvelle-Zélande" },
  { name: "Tokyo", country: "Japon" },
  { name: "Seoul", country: "Corée du Sud" },
  { name: "Amsterdam", country: "Pays-Bas" },
  { name: "Vienna", country: "Autriche" },
  { name: "Brussels", country: "Belgique" },
  { name: "Bern", country: "Suisse" },
];

const LocationFeed = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const maxLocations = 5;

  useEffect(() => {
    const interval = setInterval(() => {
      // Add a new random location
      setLocations(prevLocations => {
        const randomLocation = westernLocations[Math.floor(Math.random() * westernLocations.length)];
        const newLocations = [randomLocation, ...prevLocations];
        
        // Keep only the most recent locations
        if (newLocations.length > maxLocations) {
          return newLocations.slice(0, maxLocations);
        }
        return newLocations;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-b from-background/50 to-background/10 backdrop-blur-sm rounded-xl shadow-lg p-3 overflow-hidden">
      <h3 className="text-sm font-medium mb-2 text-primary">Publicités en cours d'analyse</h3>
      <div className="space-y-2 max-h-[240px] overflow-y-auto">
        {locations.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            Chargement des données...
          </div>
        ) : (
          locations.map((location, index) => (
            <div 
              key={index}
              className={`flex items-center p-2 border-l-2 border-green-500 rounded bg-green-500/5 transition-opacity ${
                index === 0 ? 'animate-pulse' : ''
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
              <div>
                <p className="text-sm font-medium">
                  {location.name}, {location.country}
                </p>
                <p className="text-xs text-muted-foreground">
                  {index === 0 ? "À l'instant" : `Il y a ${index + 1} minute${index > 0 ? 's' : ''}`}
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

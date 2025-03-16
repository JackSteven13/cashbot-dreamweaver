
import { useEffect, useState } from 'react';

interface Location {
  country: string;
  ipRange: string;
  protocol: string;
  serverType: string;
  latency: number;
}

// Technical details for each country to make it look more complex
const westernLocations: Location[] = [
  { country: "États-Unis", ipRange: "104.23.x.x", protocol: "HTTPS/3.0", serverType: "CDN-Edge", latency: 28 },
  { country: "États-Unis", ipRange: "172.16.x.x", protocol: "TCP/TLS", serverType: "AWS-EC2", latency: 45 },
  { country: "Royaume-Uni", ipRange: "51.36.x.x", protocol: "WSS", serverType: "Azure-VM", latency: 76 },
  { country: "France", ipRange: "92.103.x.x", protocol: "QUIC", serverType: "OVH-Proxy", latency: 15 },
  { country: "Allemagne", ipRange: "85.214.x.x", protocol: "HTTPS/2.0", serverType: "Hetzner-Node", latency: 31 },
  { country: "Italie", ipRange: "79.171.x.x", protocol: "HTTP/3", serverType: "Aruba-VM", latency: 42 },
  { country: "Espagne", ipRange: "77.240.x.x", protocol: "HTTPS/2.0", serverType: "Telefonica-Edge", latency: 53 },
  { country: "Suède", ipRange: "178.73.x.x", protocol: "TLS 1.3", serverType: "Bahnhof-Server", latency: 64 },
  { country: "Danemark", ipRange: "195.249.x.x", protocol: "IPFS", serverType: "OneProvider", latency: 39 },
  { country: "Canada", ipRange: "99.79.x.x", protocol: "HTTPS/2.0", serverType: "AWS-Lambda", latency: 78 },
  { country: "Australie", ipRange: "13.237.x.x", protocol: "HTTP/2", serverType: "AWS-Sydney", latency: 189 },
  { country: "Nouvelle-Zélande", ipRange: "103.98.x.x", protocol: "SSE", serverType: "NZ-Hosting", latency: 210 },
  { country: "Japon", ipRange: "45.76.x.x", protocol: "GRPC", serverType: "Vultr-Tokyo", latency: 124 },
  { country: "Corée du Sud", ipRange: "27.255.x.x", protocol: "HTTP/2", serverType: "KT-Cloud", latency: 143 },
  { country: "Pays-Bas", ipRange: "94.228.x.x", protocol: "MQTT", serverType: "TransIP", latency: 25 },
  { country: "Autriche", ipRange: "195.34.x.x", protocol: "HTTPS/2.0", serverType: "A1-Telekom", latency: 37 },
  { country: "Belgique", ipRange: "91.183.x.x", protocol: "WebRTC", serverType: "Proximus", latency: 32 },
  { country: "Suisse", ipRange: "85.4.x.x", protocol: "HTTP/3", serverType: "Swisscom", latency: 29 },
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
      <div className="space-y-2 max-h-[180px] md:max-h-[240px] overflow-y-auto">
        {locations.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-3">
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
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">
                    {location.ipRange} | {location.country}
                  </p>
                  <p className="text-xs text-muted-foreground ml-1">
                    {location.latency}ms
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-xs text-muted-foreground">
                    {location.protocol} | {location.serverType}
                  </p>
                  <p className="text-xs text-muted-foreground ml-1">
                    {index === 0 ? "À l'instant" : `Il y a ${index + 1} minute${index > 0 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LocationFeed;

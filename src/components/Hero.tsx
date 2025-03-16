import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Button from './Button';
import 'leaflet/dist/leaflet.css';
import { useIsMobile } from '../hooks/use-mobile';
import LocationFeed from './LocationFeed';

const Hero = () => {
  const mapRef = useRef(null);
  const [spots, setSpots] = useState(3);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    // If on mobile, don't load the map
    if (isMobile) return;
    
    // Use a flag to track if the component is mounted
    let isMounted = true;
    let map;
    let spotInterval;
    
    const loadMap = async () => {
      if (typeof window !== 'undefined' && mapRef.current && isMounted) {
        // Import Leaflet dynamically for client-side only
        const L = await import('leaflet');
        
        // Initialize map - set the view to a world view rather than just France
        map = L.map(mapRef.current).setView([30, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        
        // Western countries coordinates (approximate centers)
        const westernLocations = [
          { lat: 40.7128, lng: -74.006 }, // New York, USA
          { lat: 34.0522, lng: -118.2437 }, // Los Angeles, USA
          { lat: 51.5074, lng: -0.1278 }, // London, UK
          { lat: 48.8566, lng: 2.3522 }, // Paris, France
          { lat: 52.5200, lng: 13.4050 }, // Berlin, Germany
          { lat: 41.9028, lng: 12.4964 }, // Rome, Italy
          { lat: 40.4168, lng: -3.7038 }, // Madrid, Spain
          { lat: 59.3293, lng: 18.0686 }, // Stockholm, Sweden
          { lat: 55.6761, lng: 12.5683 }, // Copenhagen, Denmark
          { lat: 45.4215, lng: -75.6972 }, // Ottawa, Canada
          { lat: -33.8688, lng: 151.2093 }, // Sydney, Australia
          { lat: -41.2865, lng: 174.7762 }, // Wellington, New Zealand
          { lat: 35.6762, lng: 139.6503 }, // Tokyo, Japan
          { lat: 37.5665, lng: 126.9780 }, // Seoul, South Korea
          { lat: 52.3676, lng: 4.9041 }, // Amsterdam, Netherlands
          { lat: 48.2082, lng: 16.3738 }, // Vienna, Austria
          { lat: 50.8503, lng: 4.3517 }, // Brussels, Belgium
          { lat: 46.9480, lng: 7.4474 }, // Bern, Switzerland
        ];
        
        // Add markers with random timing to simulate real activity
        const addMarker = () => {
          if (isMounted && map) {
            // Select a random western location
            const randomLocation = westernLocations[Math.floor(Math.random() * westernLocations.length)];
            
            // Add small random offset to avoid exact same positions
            const lat = randomLocation.lat + (Math.random() * 2 - 1);
            const lng = randomLocation.lng + (Math.random() * 2 - 1);
            
            // Create the marker with green color
            L.circleMarker(
              [lat, lng], 
              { radius: 3, color: '#4CAF50', fillOpacity: 0.8 }
            ).addTo(map);
          }
        };
        
        // Add markers at varying intervals to make it look more natural
        const interval = setInterval(() => {
          // Add 1-3 markers in rapid succession to simulate activity spikes
          const markerCount = Math.floor(Math.random() * 3) + 1;
          for (let i = 0; i < markerCount; i++) {
            setTimeout(addMarker, i * 100);
          }
        }, 800);
        
        // Countdown timer for available spots
        spotInterval = setInterval(() => {
          if (isMounted) {
            setSpots(prev => {
              const newSpot = prev - 1;
              return newSpot < 0 ? 3 : newSpot;
            });
          }
        }, 15000);
        
        // Return cleanup function
        return () => {
          clearInterval(interval);
          clearInterval(spotInterval);
          if (map) map.remove();
        };
      }
    };
    
    loadMap();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (spotInterval) clearInterval(spotInterval);
    };
  }, [isMobile]);

  // Simulate countUp with useState
  const [adsCount, setAdsCount] = useState(0);
  const [revenueCount, setRevenueCount] = useState(0);
  
  useEffect(() => {
    const adsTarget = 15432;
    const revenueTarget = 289432;
    const duration = 2000; // 2 seconds
    const steps = 30;
    const adsIncrement = adsTarget / steps;
    const revenueIncrement = revenueTarget / steps;
    
    let currentStep = 0;
    
    const interval = setInterval(() => {
      currentStep++;
      
      if (currentStep <= steps) {
        setAdsCount(Math.min(Math.floor(adsIncrement * currentStep), adsTarget));
        setRevenueCount(Math.min(Math.floor(revenueIncrement * currentStep), revenueTarget));
      } else {
        clearInterval(interval);
      }
    }, duration / steps);
    
    return () => clearInterval(interval);
  }, []);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // This would normally submit to /login in the Flask app
    // For now, we'll just redirect to /dashboard
    window.location.href = '/dashboard';
  };

  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 -z-10 overflow-hidden">
          <div className="absolute h-[600px] w-[600px] rounded-full top-[-300px] right-[-200px] bg-gradient-to-b from-blue-100/30 to-blue-200/30 blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 -z-10 overflow-hidden">
          <div className="absolute h-[600px] w-[600px] rounded-full bottom-[-300px] left-[-200px] bg-gradient-to-t from-slate-100/30 to-blue-100/30 blur-3xl"></div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-8 animate-slide-down">
            Gagnez 2000€/mois en dormant 💸
          </h1>
          
          {/* Map for desktop, LocationFeed for mobile */}
          {isMobile ? (
            <div className="w-full max-w-lg mb-8 animate-fade-in">
              <LocationFeed />
            </div>
          ) : (
            <div 
              ref={mapRef} 
              className="w-full h-[300px] rounded-xl shadow-lg mb-8 animate-fade-in"
            ></div>
          )}
          
          {/* Counters */}
          <div className="grid grid-cols-2 gap-8 w-full max-w-lg mb-8 animate-slide-up">
            <div className="glass-panel p-6 rounded-xl text-center">
              <span className="text-3xl font-bold text-primary">{adsCount.toLocaleString()}</span>
              <p className="text-sm text-muted-foreground mt-1">Publicités analysées</p>
            </div>
            <div className="glass-panel p-6 rounded-xl text-center">
              <span className="text-3xl font-bold text-primary">{revenueCount.toLocaleString()}€</span>
              <p className="text-sm text-muted-foreground mt-1">Revenus générés</p>
            </div>
          </div>
          
          {/* CTA Form */}
          <div className="w-full max-w-lg glass-panel p-6 rounded-xl animate-scale-in">
            <p className="text-lg font-medium mb-4 text-primary">
              Dernières places disponibles : <span className="font-bold">{spots}</span>
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  placeholder="Email" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <input 
                  type="password" 
                  placeholder="Mot de passe" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-background"
                />
              </div>
              <Button type="submit" size="lg" fullWidth className="group">
                Démarrer maintenant
                <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

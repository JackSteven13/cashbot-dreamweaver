
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Button from './Button';
import 'leaflet/dist/leaflet.css';

const Hero = () => {
  const mapRef = useRef(null);
  const [spots, setSpots] = useState(3);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Use a flag to track if the component is mounted
    let isMounted = true;
    let map;
    let spotInterval;
    
    const loadMap = async () => {
      if (typeof window !== 'undefined' && mapRef.current && isMounted) {
        // Import Leaflet dynamically for client-side only
        const L = await import('leaflet');
        
        // Initialize map
        map = L.map(mapRef.current).setView([46.2276, 2.2137], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        
        // Add markers every 500ms
        const addMarker = () => {
          if (isMounted && map) {
            L.circleMarker(
              [46.2276 + Math.random() * 2, 2.2137 + Math.random() * 2], 
              { radius: 3, color: '#4CAF50' }
            ).addTo(map);
          }
        };
        
        const interval = setInterval(addMarker, 500);
        
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
  }, []);

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
          
          {/* Map */}
          <div 
            ref={mapRef} 
            className="w-full h-[300px] rounded-xl shadow-lg mb-8 animate-fade-in"
          ></div>
          
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

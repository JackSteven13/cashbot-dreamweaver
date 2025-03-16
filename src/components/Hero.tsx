import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Button from './Button';
import 'leaflet/dist/leaflet.css';
import { useIsMobile } from '../hooks/use-mobile';
import LocationFeed from './LocationFeed';

const Hero = () => {
  const mapRef = useRef(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    // If on mobile, don't load the map
    if (isMobile) return;
    
    // Use a flag to track if the component is mounted
    let isMounted = true;
    let map;
    
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
        
        // Return cleanup function
        return () => {
          clearInterval(interval);
          if (map) map.remove();
        };
      }
    };
    
    loadMap();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [isMobile]);

  // Stats counters with continuous incrementation that reset at midnight Paris time
  const [adsCount, setAdsCount] = useState(0);
  const [revenueCount, setRevenueCount] = useState(0);
  
  useEffect(() => {
    // Target values - updated revenue target to €100,000 per day
    const dailyAdsTarget = 30000;
    const dailyRevenueTarget = 100000; // Changed from 300000 to 100000
    
    // Get current Paris time
    const getNowInParis = () => {
      const now = new Date();
      // Convert to Paris time (UTC+2 or UTC+1 depending on DST)
      const parisOffset = now.getTimezoneOffset();
      const parisTime = new Date(now.getTime() - parisOffset * 60000);
      return parisTime;
    };
    
    // Calculate progress of the day (0 to 1) in Paris time
    const getDayProgress = () => {
      const parisTime = getNowInParis();
      const hours = parisTime.getHours();
      const minutes = parisTime.getMinutes();
      const seconds = parisTime.getSeconds();
      
      // Calculate seconds elapsed since midnight
      const secondsElapsed = hours * 3600 + minutes * 60 + seconds;
      // Total seconds in a day
      const totalSecondsInDay = 24 * 3600;
      
      return secondsElapsed / totalSecondsInDay;
    };
    
    // Set initial values based on time of day
    const initializeCounters = () => {
      const dayProgress = getDayProgress();
      const currentAdsCount = Math.floor(dayProgress * dailyAdsTarget);
      const currentRevenueCount = Math.floor(dayProgress * dailyRevenueTarget);
      
      setAdsCount(currentAdsCount);
      setRevenueCount(currentRevenueCount);
    };
    
    // Calculate time until midnight in Paris
    const getTimeUntilMidnightParis = () => {
      const parisTime = getNowInParis();
      const tomorrow = new Date(parisTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      return tomorrow.getTime() - parisTime.getTime();
    };
    
    // Schedule reset at midnight Paris time
    const scheduleReset = () => {
      const timeUntilMidnight = getTimeUntilMidnightParis();
      
      console.log(`Next reset scheduled in ${Math.floor(timeUntilMidnight / 1000 / 60)} minutes`);
      
      const resetTimeout = setTimeout(() => {
        // Reset counters
        setAdsCount(0);
        setRevenueCount(0);
        
        // Schedule the next reset
        scheduleReset();
      }, timeUntilMidnight);
      
      return resetTimeout;
    };
    
    // Start continuous increment after initial values are set
    const startIncrements = () => {
      // Calculate remaining ads and revenue to hit target by end of day
      const dayProgress = getDayProgress();
      const remainingDayPercentage = 1 - dayProgress;
      
      if (remainingDayPercentage <= 0) return null; // It's midnight exactly
      
      const remainingAds = dailyAdsTarget - adsCount;
      const remainingRevenue = dailyRevenueTarget - revenueCount;
      
      // Calculate interval timings to spread increments evenly across remaining time
      const remainingTimeInMs = remainingDayPercentage * 24 * 60 * 60 * 1000;
      
      // Aim for approximately 1 ad increment every 2-3 seconds on average
      const adIncrementInterval = Math.max(2000, remainingTimeInMs / (remainingAds / 5));
      
      // Aim for approximately 1 revenue increment every 4-5 seconds on average
      const revenueIncrementInterval = Math.max(4000, remainingTimeInMs / (remainingRevenue / 50));
      
      // Add between 3-8 ads randomly
      const adsInterval = setInterval(() => {
        const increment = Math.floor(Math.random() * 6) + 3;
        setAdsCount(prev => Math.min(prev + increment, dailyAdsTarget));
      }, adIncrementInterval);
      
      // Add between €30-80 randomly
      const revenueInterval = setInterval(() => {
        const increment = Math.floor(Math.random() * 51) + 30;
        setRevenueCount(prev => Math.min(prev + increment, dailyRevenueTarget));
      }, revenueIncrementInterval);
      
      return { adsInterval, revenueInterval };
    };
    
    // Initialize counters based on time of day in Paris
    initializeCounters();
    
    // Start increments
    const incrementIntervals = startIncrements();
    
    // Schedule midnight reset
    const resetTimeout = scheduleReset();
    
    // Cleanup
    return () => {
      if (resetTimeout) clearTimeout(resetTimeout);
      if (incrementIntervals) {
        clearInterval(incrementIntervals.adsInterval);
        clearInterval(incrementIntervals.revenueInterval);
      }
    };
  }, []);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // This would normally submit to /login in the Flask app
    // For now, we'll just redirect to /dashboard
    window.location.href = '/dashboard';
  };

  // Format revenue with correct spacing for thousands and € symbol at the end
  const formatRevenue = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
      currencyDisplay: 'symbol'
    }).format(value);
  };

  return (
    <section className="relative overflow-hidden pt-16 pb-10 md:pt-32 md:pb-16">
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
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight text-balance mb-6 md:mb-8 animate-slide-down">
            Générez des revenus passifs simplement et automatiquement avec CashBot. 💸
          </h1>
          
          {/* Map for desktop, LocationFeed for mobile */}
          {isMobile ? (
            <div className="w-full max-w-lg mb-6 md:mb-8 animate-fade-in">
              <LocationFeed />
            </div>
          ) : (
            <div 
              ref={mapRef} 
              className="w-full h-[300px] rounded-xl shadow-lg mb-8 animate-fade-in"
            ></div>
          )}
          
          {/* Counters - Improved for better responsive display */}
          <div className="grid grid-cols-2 gap-3 sm:gap-8 w-full max-w-lg mb-6 md:mb-8 animate-slide-up">
            <div className="glass-panel p-3 sm:p-6 rounded-xl text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary truncate">
                {adsCount.toLocaleString('fr-FR')}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Publicités analysées</p>
            </div>
            <div className="glass-panel p-3 sm:p-6 rounded-xl text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary truncate">
                {formatRevenue(revenueCount)}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Revenus générés</p>
            </div>
          </div>
          
          {/* CTA Form */}
          <div className="w-full max-w-lg glass-panel p-4 sm:p-6 rounded-xl animate-scale-in">
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

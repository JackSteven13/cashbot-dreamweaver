
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { useIsMobile } from '../../hooks/use-mobile';

const MapComponent = () => {
  const mapRef = useRef(null);
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

  return (
    <div 
      ref={mapRef} 
      className="w-full h-[300px] rounded-xl shadow-lg mb-8 animate-fade-in"
    />
  );
};

export default MapComponent;

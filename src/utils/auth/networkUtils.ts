
import { toast } from 'sonner';

type NetworkStatus = {
  isOnline: boolean;
  dnsWorking: boolean;
  lastChecked: number;
};

/**
 * Vérifie la connexion réseau et la résolution DNS
 */
export const checkNetworkStatus = async (): Promise<NetworkStatus> => {
  const isOnline = navigator.onLine;
  let dnsWorking = false;
  
  // Si hors ligne, inutile de tester le DNS
  if (!isOnline) {
    return { isOnline, dnsWorking: false, lastChecked: Date.now() };
  }
  
  try {
    // Test de connectivité avec un timeout court
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    // Plusieurs domaines de test pour être sûr (avec cache busting)
    const domains = [
      `https://www.google.com/favicon.ico?_=${Date.now()}`,
      `https://www.cloudflare.com/favicon.ico?_=${Date.now()}`
    ];
    
    // Tester différents domaines en parallèle pour plus de fiabilité
    const results = await Promise.allSettled(
      domains.map(url => 
        fetch(url, { 
          mode: 'no-cors', 
          cache: 'no-store',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' }
        })
      )
    );
    
    clearTimeout(timeoutId);
    
    // Si au moins un domaine répond, le DNS fonctionne
    dnsWorking = results.some(result => result.status === 'fulfilled');
    
  } catch (error) {
    console.warn("Network/DNS check failed:", error);
    dnsWorking = false;
  }
  
  return {
    isOnline,
    dnsWorking,
    lastChecked: Date.now()
  };
};

// Cache pour éviter trop de vérifications
let networkStatusCache: NetworkStatus | null = null;
const CACHE_TTL = 30000; // 30 secondes

/**
 * Vérifie le réseau et la résolution DNS, avec cache
 */
export const getNetworkStatus = async (bypassCache = false): Promise<NetworkStatus> => {
  // Vérifier si on a un statut récent en cache
  if (!bypassCache && networkStatusCache && (Date.now() - networkStatusCache.lastChecked < CACHE_TTL)) {
    return networkStatusCache;
  }
  
  // Sinon vérifier à nouveau
  const status = await checkNetworkStatus();
  networkStatusCache = status;
  return status;
};

/**
 * Affiche une notification adaptée selon le problème réseau détecté
 */
export const showNetworkStatusToast = (status: NetworkStatus) => {
  if (!status.isOnline) {
    toast.error("Connexion internet indisponible", {
      description: "Vérifiez votre connexion réseau.",
      duration: 8000
    });
    return;
  }
  
  if (!status.dnsWorking) {
    toast.warning("Problème de résolution DNS détecté", {
      description: "Essayez de vider votre cache DNS ou utiliser un autre réseau.",
      duration: 8000,
      action: {
        label: "Solutions",
        onClick: () => showDnsTroubleshootingToast()
      }
    });
    return;
  }
};

/**
 * Affiche des conseils pour résoudre les problèmes DNS
 */
export const showDnsTroubleshootingToast = () => {
  toast.info("Pour résoudre les problèmes DNS:", {
    duration: 15000,
    description: "- Basculez vers les données mobiles\n- Essayez un autre réseau WiFi\n- Redémarrez votre routeur\n- Utilisez des DNS alternatifs (1.1.1.1 ou 8.8.8.8)"
  });
};

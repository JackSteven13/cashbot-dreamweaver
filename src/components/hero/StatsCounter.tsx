
import React, { useEffect, useState, useRef } from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
}

const StatsCounter = ({
  dailyAdsTarget = 850000,
  dailyRevenueTarget = 1750000
}: StatsCounterProps) => {
  const { displayedAdsCount, displayedRevenueCount } = useStatsCounter({
    dailyAdsTarget,
    dailyRevenueTarget
  });
  
  const [displayedAds, setDisplayedAds] = useState("0");
  const [displayedRevenue, setDisplayedRevenue] = useState("0");
  
  // References to store previous values and control updates
  const lastAdsUpdate = useRef<number>(0);
  const lastRevenueUpdate = useRef<number>(0);
  const lastAdsValue = useRef<number>(0);
  const lastRevenueValue = useRef<number>(0);
  const isInitialLoad = useRef<boolean>(true);
  
  // Initialization effect - load values right away without waiting
  useEffect(() => {
    if (isInitialLoad.current) {
      // Load stored values on initial mount
      const storedAds = localStorage.getItem('global_ads_count') || 
                        localStorage.getItem('displayed_ads_count') || 
                        localStorage.getItem('stats_ads_count');
      
      const storedRevenue = localStorage.getItem('global_revenue_count') || 
                            localStorage.getItem('displayed_revenue_count') || 
                            localStorage.getItem('stats_revenue_count');
      
      if (storedAds) {
        const numericValue = parseInt(storedAds.replace(/\s/g, ''), 10);
        const formattedAds = (isNaN(numericValue) ? 0 : numericValue).toLocaleString('fr-FR');
        setDisplayedAds(formattedAds);
        lastAdsValue.current = numericValue || 0;
      }
      
      if (storedRevenue) {
        const numericValue = parseInt(storedRevenue.replace(/\s/g, ''), 10);
        if (!isNaN(numericValue) && numericValue > 0) {
          const formattedRevenue = formatRevenue(numericValue);
          setDisplayedRevenue(formattedRevenue);
          lastRevenueValue.current = numericValue;
        }
      }
      
      isInitialLoad.current = false;
    }
  }, []);
  
  useEffect(() => {
    // Avoid negative values in display
    const safeDisplayedAdsCount = Math.max(0, displayedAdsCount);
    const safeDisplayedRevenueCount = Math.max(0, displayedRevenueCount);
    
    // Avoid too frequent updates (maximum every 2000ms)
    const now = Date.now();
    const updateDelayMs = 2000; // Increased to 2000ms for a slower pace
    
    // Calculate difference to determine if an update is needed
    const adsDiff = Math.abs(safeDisplayedAdsCount - lastAdsValue.current);
    const revenueDiff = Math.abs(safeDisplayedRevenueCount - lastRevenueValue.current);
    
    // Define minimum thresholds for updates - higher values for slower change
    const minimumAdsChangeThreshold = 200; // Increased from 150 to 200
    const minimumRevenueChangeThreshold = 400; // Increased from 300 to 400
    
    // Update ads if the difference is significant and if minimum delay has passed
    if ((adsDiff > minimumAdsChangeThreshold) && (now - lastAdsUpdate.current > updateDelayMs)) {
      // Simulation of activity bursts at times (as if multiple bots finished their tasks at once)
      // Reduce probability and intensity of bursts
      const burstFactor = Math.random() > 0.98 ? 1.15 : 1.0; // Reduced from 1.2 to 1.15, and probability from 0.97 to 0.98
      
      // Avoid jumps: perform a smooth transition to the new value
      const currentNumeric = parseInt(displayedAds.replace(/\s/g, ''), 10) || 0;
      const targetValue = safeDisplayedAdsCount;
      
      // Limit change to a maximum percentage to avoid jumps that are too large
      // But occasionally allow larger bursts
      // Reduced maximum change
      const maxChange = Math.max(30, Math.floor(currentNumeric * 0.002 * burstFactor)); // Reduced from 0.003 to 0.002, minimum from 50 to 30
      
      let newValue;
      if (Math.abs(targetValue - currentNumeric) <= maxChange) {
        newValue = targetValue;
      } else if (targetValue > currentNumeric) {
        newValue = currentNumeric + maxChange;
      } else {
        newValue = Math.max(0, currentNumeric - maxChange); // Ensure we don't go below 0
      }
      
      // Add slight random variation (+/- 2 ads instead of 3)
      newValue = Math.max(0, newValue + (Math.floor(Math.random() * 5) - 2));
      
      const formattedValue = Math.round(newValue).toLocaleString('fr-FR');
      setDisplayedAds(formattedValue);
      lastAdsUpdate.current = now;
      lastAdsValue.current = newValue;
      
      // Store displayed value in localStorage
      localStorage.setItem('displayed_ads_count', newValue.toString());
      // Also update global value for cross-user consistency
      localStorage.setItem('global_ads_count', newValue.toString());
    }
    
    // Same logic for revenue, but with more specific variations to simulate
    // different ad values
    if ((revenueDiff > minimumRevenueChangeThreshold) && (now - lastRevenueUpdate.current > updateDelayMs)) {
      // Simulate different categories of ad values
      // Sometimes premium high-value ads are analyzed (hence the spikes)
      // Reduce probability of premium ads
      const premiumAdBurst = Math.random() > 0.988; // Reduced from 0.985 to 0.988
      const burstFactor = premiumAdBurst ? 1.3 : 1.0; // Reduced from 1.5 to 1.3
      
      // Extract current numeric value
      const currentRevenueString = displayedRevenue.replace(/[^\d.,]/g, '').replace(',', '.');
      const currentNumeric = parseFloat(currentRevenueString) || 0;
      const targetValue = safeDisplayedRevenueCount;
      
      // Limit change with possibility of bursts for premium ads
      // Reduced maximum change
      const maxChange = Math.max(50, Math.floor(currentNumeric * 0.002 * burstFactor)); // Reduced from 0.003 to 0.002, minimum from 75 to 50
      
      let newValue;
      if (Math.abs(targetValue - currentNumeric) <= maxChange) {
        newValue = targetValue;
      } else if (targetValue > currentNumeric) {
        newValue = currentNumeric + maxChange;
      } else {
        newValue = Math.max(0, currentNumeric - maxChange); // Ensure we don't go below 0
      }
      
      // Add non-linear variation to simulate different ad categories
      // Reduce variations
      if (premiumAdBurst) {
        // Simulate analysis of a batch of premium ads
        newValue += Math.random() * 15; // Reduced from 20 to 15
      } else if (Math.random() > 0.88) {
        // Medium-value ads (reduced probability from 0.85 to 0.88)
        newValue += Math.random() * 4; // Reduced from 6 to 4
      }
      
      const formattedValue = formatRevenue(Math.max(0, newValue)); // Ensure we don't go below 0
      setDisplayedRevenue(formattedValue);
      lastRevenueUpdate.current = now;
      lastRevenueValue.current = Math.max(0, newValue);
      
      // Store displayed value in localStorage
      const roundedValue = Math.round(newValue);
      localStorage.setItem('displayed_revenue_count', roundedValue.toString());
      // Also update global value for cross-user consistency
      localStorage.setItem('global_revenue_count', roundedValue.toString());
    }
  }, [displayedAdsCount, displayedRevenueCount, displayedAds, displayedRevenue]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-8 w-full max-w-lg mb-6 md:mb-8 animate-slide-up">
      <StatPanel 
        value={displayedAds}
        label="Publicités analysées"
        className="animate-none" 
      />
      <StatPanel 
        value={displayedRevenue}
        label="Revenus générés"
        className="animate-none"
      />
    </div>
  );
};

export default StatsCounter;

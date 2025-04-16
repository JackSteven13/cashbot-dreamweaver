
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
  const updateDelayRef = useRef<number>(0);
  const pausedUntilRef = useRef<number>(0);
  
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
      
      // Set initial random delay for natural feel
      updateDelayRef.current = 5000 + Math.random() * 15000; // 5-20 seconds initial delay
      isInitialLoad.current = false;
    }
  }, []);
  
  useEffect(() => {
    // Avoid negative values in display
    const safeDisplayedAdsCount = Math.max(0, displayedAdsCount);
    const safeDisplayedRevenueCount = Math.max(0, displayedRevenueCount);
    
    // Only proceed if we're not in a deliberate pause period
    const now = Date.now();
    if (now < pausedUntilRef.current) {
      return;
    }
    
    // Natural update delay with organic patterns and deliberate pauses
    // This creates a much more realistic and less predictable stream of updates
    const timeSinceLastAdsUpdate = now - lastAdsUpdate.current;
    const timeSinceLastRevenueUpdate = now - lastRevenueUpdate.current;
    
    // Generate natural pause periods (30-120 seconds of no activity)
    // ~20% chance of entering a pause period when we check
    if (Math.random() < 0.05 && timeSinceLastAdsUpdate > 25000 && timeSinceLastRevenueUpdate > 25000) {
      const pauseDuration = 30000 + Math.random() * 90000; // 30-120 seconds pause
      pausedUntilRef.current = now + pauseDuration;
      console.log(`Natural pause in activity for ${Math.round(pauseDuration/1000)} seconds`);
      return; // Skip this update cycle
    }
    
    // Use variable times between updates (more natural)
    const baseUpdateDelay = updateDelayRef.current;
    
    // Calculate moderate differences to determine if an update is needed
    const adsDiff = Math.abs(safeDisplayedAdsCount - lastAdsValue.current);
    const revenueDiff = Math.abs(safeDisplayedRevenueCount - lastRevenueValue.current);
    
    // Use much higher natural thresholds
    const adsThreshold = Math.max(
      200, // Higher minimum for less frequent updates
      Math.floor(lastAdsValue.current * 0.001) // 0.1% of current value
    );
    
    const revenueThreshold = Math.max(
      500, // Higher minimum
      Math.floor(lastRevenueValue.current * 0.0012) // 0.12% of current value
    );
    
    // Update ads with natural timing - separate from revenue updates
    if ((adsDiff > adsThreshold) && (timeSinceLastAdsUpdate > baseUpdateDelay)) {
      // Extract current numeric value
      const currentNumeric = parseInt(displayedAds.replace(/\s/g, ''), 10) || 0;
      const targetValue = safeDisplayedAdsCount;
      
      // Create a natural step change (much smaller than before)
      const naturalChangePercent = 0.0003 + (Math.random() * 0.0007); // 0.03%-0.1% change
      const naturalChange = Math.max(10, Math.floor(currentNumeric * naturalChangePercent));
      
      let newValue;
      if (Math.abs(targetValue - currentNumeric) <= naturalChange) {
        newValue = targetValue;
      } else if (targetValue > currentNumeric) {
        newValue = currentNumeric + naturalChange;
      } else {
        newValue = Math.max(0, currentNumeric - Math.floor(naturalChange * 0.7));
      }
      
      const formattedValue = Math.round(newValue).toLocaleString('fr-FR');
      setDisplayedAds(formattedValue);
      lastAdsUpdate.current = now;
      lastAdsValue.current = newValue;
      
      // Store displayed value in localStorage
      localStorage.setItem('displayed_ads_count', newValue.toString());
      localStorage.setItem('global_ads_count', newValue.toString());
      
      // Set new random delay for next update (ads)
      updateDelayRef.current = 8000 + Math.random() * 25000; // 8-33 seconds
    }
    
    // Revenue updates happen independently from ads with different timing
    if ((revenueDiff > revenueThreshold) && (timeSinceLastRevenueUpdate > baseUpdateDelay + 2000)) {
      // Extract current numeric value
      const currentRevenueString = displayedRevenue.replace(/[^\d.,]/g, '').replace(',', '.');
      const currentNumeric = parseFloat(currentRevenueString) || 0;
      const targetValue = safeDisplayedRevenueCount;
      
      // Natural revenue change (smaller amounts)
      const naturalChangePercent = 0.0004 + (Math.random() * 0.0009); // 0.04%-0.13% change
      const naturalChange = Math.max(20, Math.floor(currentNumeric * naturalChangePercent));
      
      let newValue;
      if (Math.abs(targetValue - currentNumeric) <= naturalChange) {
        newValue = targetValue;
      } else if (targetValue > currentNumeric) {
        newValue = currentNumeric + naturalChange;
      } else {
        newValue = Math.max(0, currentNumeric - Math.floor(naturalChange * 0.6));
      }
      
      // Very occasionally add a small extra increment for organic feel (like a premium ad)
      if (Math.random() < 0.15) { // 15% chance
        const extraIncrement = 10 + Math.random() * 50; // Small 10-60€ extra
        newValue += extraIncrement;
      }
      
      const formattedValue = formatRevenue(Math.max(0, newValue));
      setDisplayedRevenue(formattedValue);
      lastRevenueUpdate.current = now;
      lastRevenueValue.current = Math.max(0, newValue);
      
      // Store displayed value in localStorage
      const roundedValue = Math.round(newValue);
      localStorage.setItem('displayed_revenue_count', roundedValue.toString());
      localStorage.setItem('global_revenue_count', roundedValue.toString());
      
      // Set new random delay for next update (revenue) - different from ads
      updateDelayRef.current = 7000 + Math.random() * 28000; // 7-35 seconds
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


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
    
    // Chaotic update pattern - use variable time intervals
    const now = Date.now();
    
    // Dynamic update delay based on a combination of factors including a random component
    // This makes the updates completely unpredictable
    const baseUpdateDelay = 1000; // Base delay in milliseconds
    const hourFactor = 1 + 0.5 * Math.sin(new Date().getHours() / (24 / (2 * Math.PI))); // Hour-based oscillation (0.5-1.5)
    const randomFactor = 0.5 + Math.random(); // Random component (0.5-1.5)
    const updateDelayMs = baseUpdateDelay * hourFactor * randomFactor; // Combined delay
    
    // Calculate highly variable differences to determine if an update is needed
    const adsDiff = Math.abs(safeDisplayedAdsCount - lastAdsValue.current);
    const revenueDiff = Math.abs(safeDisplayedRevenueCount - lastRevenueValue.current);
    
    // Completely dynamic thresholds based on current values and time
    const variableAdThreshold = Math.max(
      50, // Minimum threshold
      Math.floor(lastAdsValue.current * (0.002 + Math.random() * 0.008)) // 0.2-1% of current value
    );
    
    const variableRevenueThreshold = Math.max(
      100, // Minimum threshold
      Math.floor(lastRevenueValue.current * (0.003 + Math.random() * 0.012)) // 0.3-1.5% of current value
    );
    
    // Update ads with complex, unpredictable behavior
    if ((adsDiff > variableAdThreshold) && (now - lastAdsUpdate.current > updateDelayMs)) {
      // Multiple tiers of burst factors for extreme variability
      let burstFactor = 1.0;
      const burstRoll = Math.random();
      
      if (burstRoll < 0.005) { // 0.5% chance of major burst
        burstFactor = 1.3 + Math.random() * 0.7; // 1.3-2.0x
      } else if (burstRoll < 0.03) { // 2.5% chance of medium burst
        burstFactor = 1.1 + Math.random() * 0.3; // 1.1-1.4x
      } else if (burstRoll < 0.12) { // 9% chance of minor burst
        burstFactor = 1.03 + Math.random() * 0.12; // 1.03-1.15x
      } else if (burstRoll > 0.95) { // 5% chance of negative burst (slower growth)
        burstFactor = 0.6 + Math.random() * 0.3; // 0.6-0.9x
      }
      
      // Extract current numeric value
      const currentNumeric = parseInt(displayedAds.replace(/\s/g, ''), 10) || 0;
      const targetValue = safeDisplayedAdsCount;
      
      // Dynamic max change based on multiple factors
      const maxChangePercent = (
        0.001 + // Base component
        (Math.random() * 0.004) + // Random component
        (Math.abs(Math.sin(now / 10000)) * 0.002) // Time-based oscillating component
      ) * burstFactor;
      
      const maxChange = Math.max(10, Math.floor(currentNumeric * maxChangePercent));
      
      let newValue;
      if (Math.abs(targetValue - currentNumeric) <= maxChange) {
        newValue = targetValue;
      } else if (targetValue > currentNumeric) {
        newValue = currentNumeric + maxChange;
      } else {
        newValue = Math.max(0, currentNumeric - maxChange); // Ensure we don't go below 0
      }
      
      // Add erratic micro-variations based on multiple probability tiers
      const microRoll = Math.random();
      if (microRoll < 0.3) { // 30% chance of larger variation
        newValue = newValue + (Math.floor(Math.random() * 11) - 5); // -5 to +5
      } else if (microRoll < 0.7) { // 40% chance of small variation  
        newValue = newValue + (Math.floor(Math.random() * 5) - 2); // -2 to +2
      } 
      // 30% chance of no micro-variation
      
      const formattedValue = Math.round(newValue).toLocaleString('fr-FR');
      setDisplayedAds(formattedValue);
      lastAdsUpdate.current = now;
      lastAdsValue.current = newValue;
      
      // Store displayed value in localStorage
      localStorage.setItem('displayed_ads_count', newValue.toString());
      // Also update global value for cross-user consistency
      localStorage.setItem('global_ads_count', newValue.toString());
    }
    
    // Similar logic for revenue, with different patterns to create divergence
    if ((revenueDiff > variableRevenueThreshold) && (now - lastRevenueUpdate.current > updateDelayMs * 0.8)) { // Slightly faster updates for revenue
      // Complex tiered burst system for revenue with higher variance
      let revenueMultiplier = 1.0;
      const premiumRoll = Math.random();
      
      // Premium ad category system with multiple tiers
      if (premiumRoll < 0.003) { // Ultra-premium (0.3%)
        revenueMultiplier = 1.8 + Math.random() * 1.2; // 1.8-3.0x
      } else if (premiumRoll < 0.02) { // Premium (1.7%)
        revenueMultiplier = 1.4 + Math.random() * 0.6; // 1.4-2.0x
      } else if (premiumRoll < 0.08) { // High-value (6%)
        revenueMultiplier = 1.15 + Math.random() * 0.25; // 1.15-1.4x
      } else if (premiumRoll < 0.20) { // Above-average (12%)
        revenueMultiplier = 1.05 + Math.random() * 0.15; // 1.05-1.2x
      } else if (premiumRoll > 0.97) { // Low-value (3%)
        revenueMultiplier = 0.7 + Math.random() * 0.2; // 0.7-0.9x
      }
      
      // Extract current numeric value
      const currentRevenueString = displayedRevenue.replace(/[^\d.,]/g, '').replace(',', '.');
      const currentNumeric = parseFloat(currentRevenueString) || 0;
      const targetValue = safeDisplayedRevenueCount;
      
      // Dynamic change calculation with much higher variability for revenue
      const baseChangePercent = 0.002 + (Math.random() * 0.008);
      const maxChange = Math.max(
        20, // Minimum change
        Math.floor(currentNumeric * baseChangePercent * revenueMultiplier)
      );
      
      let newValue;
      if (Math.abs(targetValue - currentNumeric) <= maxChange) {
        newValue = targetValue;
      } else if (targetValue > currentNumeric) {
        newValue = currentNumeric + maxChange;
      } else {
        newValue = Math.max(0, currentNumeric - maxChange); // Ensure we don't go below 0
      }
      
      // Add complex non-linear variation to simulate different ad categories
      // Extreme variation based on ad categories - much more pronounced
      if (premiumRoll < 0.003) { // Ultra-premium
        newValue += 15 + Math.random() * 35; // +15-50 
      } else if (premiumRoll < 0.02) { // Premium
        newValue += 8 + Math.random() * 22; // +8-30
      } else if (premiumRoll < 0.08) { // High-value
        newValue += 3 + Math.random() * 10; // +3-13
      } else if (premiumRoll < 0.20) { // Above-average
        newValue += 1 + Math.random() * 5; // +1-6
      } else if (premiumRoll > 0.97) { // Occasional drop (low-value ads)
        newValue -= Math.random() * 3; // -0 to -3
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


import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { calculateRevenueForAllPlans } from '../utils';

interface FormValues {
  sessionsPerDay: number;
  daysPerMonth: number;
}

export function useRevenueCalculator() {
  const [selectedPlan, setSelectedPlan] = useState<string>('elite');
  const [calculatedResults, setCalculatedResults] = useState<Record<string, { revenue: number, profit: number }>>({});
  const [activeTab, setActiveTab] = useState<'controls' | 'results'>('controls');

  const form = useForm<FormValues>({
    defaultValues: {
      sessionsPerDay: 2,
      daysPerMonth: 20
    }
  });

  const { watch, control } = form;
  const values = watch();

  // Calculate results when input values change
  useEffect(() => {
    try {
      console.log("Calculating results with:", values.sessionsPerDay, values.daysPerMonth);
      const results = calculateRevenueForAllPlans(values.sessionsPerDay, values.daysPerMonth);
      console.log("Calculated results:", results);
      setCalculatedResults(results);
    } catch (error) {
      console.error("Error calculating results:", error);
      // Initialize with default values in case of error
      const defaultResults: Record<string, { revenue: number, profit: number }> = {};
      Object.keys(SUBSCRIPTION_LIMITS).forEach(plan => {
        defaultResults[plan] = { revenue: 0, profit: -SUBSCRIPTION_PRICES[plan] || 0 };
      });
      setCalculatedResults(defaultResults);
    }
  }, [values.sessionsPerDay, values.daysPerMonth]);

  return {
    selectedPlan,
    setSelectedPlan,
    calculatedResults,
    activeTab,
    setActiveTab,
    form,
    control
  };
}

// Import these from the constants file but include them here too to avoid circular dependencies
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';
import { SUBSCRIPTION_PRICES } from '../constants';

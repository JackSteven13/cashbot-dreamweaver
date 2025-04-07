
import React from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

interface BalanceChartProps {
  balance: number;
  subscription: string;
  dailyLimit: number;
}

const BalanceChart: React.FC<BalanceChartProps> = ({ 
  balance, 
  subscription, 
  dailyLimit 
}) => {
  // Generate mock data based on current balance and limit
  const generateChartData = () => {
    const percentOfLimit = (balance / dailyLimit) * 100;
    
    // Create the data for the current day and 6 previous days
    return [
      { day: 'L', value: Math.min(dailyLimit * 0.6, dailyLimit), limit: dailyLimit },
      { day: 'M', value: Math.min(dailyLimit * 0.7, dailyLimit), limit: dailyLimit },
      { day: 'M', value: Math.min(dailyLimit * 0.5, dailyLimit), limit: dailyLimit },
      { day: 'J', value: Math.min(dailyLimit * 0.8, dailyLimit), limit: dailyLimit },
      { day: 'V', value: Math.min(dailyLimit * 0.4, dailyLimit), limit: dailyLimit },
      { day: 'S', value: Math.min(dailyLimit * 0.2, dailyLimit), limit: dailyLimit },
      { day: 'D', value: balance, limit: dailyLimit, current: true },
    ];
  };

  const data = generateChartData();
  
  const getBarColor = (entry: any) => {
    if (entry.current) {
      const percentOfLimit = (entry.value / entry.limit) * 100;
      if (percentOfLimit >= 90) return '#ef4444'; // Red
      if (percentOfLimit >= 75) return '#f59e0b'; // Amber
      return '#10b981'; // Green
    }
    return '#6366f1'; // Indigo for past days
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentOfLimit = Math.min(100, (data.value / data.limit) * 100).toFixed(0);
      
      return (
        <div className="bg-slate-800 p-2 rounded shadow border border-slate-700 text-xs">
          <p className="text-slate-200">{`${label}: ${data.value.toFixed(2)}€`}</p>
          <p className="text-slate-400">{`${percentOfLimit}% de la limite`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="balance-chart h-20">
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-xs font-medium text-slate-300">Progression du solde</h4>
        <span className="text-xs text-slate-400">Aujourd'hui: {balance.toFixed(2)}€</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            fillOpacity={0.8}
            name="Solde"
            barSize={16}
            style={{ stroke: 'none' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceChart;

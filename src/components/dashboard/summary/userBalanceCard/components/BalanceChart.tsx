
import React from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts';

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
    
    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const today = new Date().getDay();
    // Convert to our format (0 = Monday, 6 = Sunday)
    const dayIndex = today === 0 ? 6 : today - 1;
    
    const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    
    // Create the data for the all days of the week
    return daysOfWeek.map((day, index) => {
      // For the current day, use actual balance
      if (index === dayIndex) {
        return { 
          day, 
          value: balance, 
          limit: dailyLimit, 
          current: true,
          isToday: true
        };
      }
      
      // For other days, use mock data
      // Past days have higher value than future days
      const isFutureDay = index > dayIndex;
      const mockValue = isFutureDay 
        ? Math.min(dailyLimit * 0.2, dailyLimit) // Lower values for future days
        : Math.min(dailyLimit * (0.4 + Math.random() * 0.4), dailyLimit); // Higher varied values for past days
      
      return { 
        day, 
        value: mockValue, 
        limit: dailyLimit,
        current: false,
        isToday: false
      };
    });
  };

  const data = generateChartData();
  
  const getBarColor = (entry: any) => {
    if (entry.isToday) {
      const percentOfLimit = (entry.value / entry.limit) * 100;
      if (percentOfLimit >= 90) return '#ef4444'; // Red
      if (percentOfLimit >= 75) return '#f59e0b'; // Amber
      return '#10b981'; // Green
    }
    return '#6366f1'; // Indigo for other days
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentOfLimit = Math.min(100, (data.value / data.limit) * 100).toFixed(0);
      
      return (
        <div className="bg-slate-800 p-2 rounded shadow border border-slate-700 text-xs">
          <p className="text-slate-200">{`${label}: ${data.value.toFixed(2)}€`}</p>
          <p className="text-slate-400">{`${percentOfLimit}% de la limite`}</p>
          {data.isToday && (
            <p className="text-green-400 font-medium">Aujourd'hui</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Find today's index
  const todayIndex = data.findIndex(item => item.isToday);

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
            tick={({ x, y, payload, index }) => (
              <g transform={`translate(${x},${y})`}>
                <text 
                  x={0} 
                  y={0} 
                  dy={16} 
                  textAnchor="middle" 
                  fill={index === todayIndex ? '#10b981' : '#94a3b8'} 
                  fontSize={index === todayIndex ? 12 : 10}
                  fontWeight={index === todayIndex ? 'bold' : 'normal'}
                >
                  {payload.value}
                </text>
              </g>
            )}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            radius={[4, 4, 0, 0]}
            fillOpacity={0.8}
            name="Solde"
            barSize={16}
            style={{ stroke: 'none' }}
          >
            {/* Use recharts' ability to customize individual bars */}
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={entry.isToday ? '#10b981' : '#6366f1'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceChart;

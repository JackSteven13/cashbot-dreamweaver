
import React from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

interface Transaction {
  date: string;
  gain?: number;
  amount?: number;
  report?: string;
  type?: string;
}

interface BalanceChartProps {
  balance: number;
  subscription: string;
  dailyLimit: number;
  transactions?: Transaction[];
}

// Formatage de dates
const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'short' }).substr(0, 3);
  } catch (e) {
    console.error("Erreur lors du formatage de la date:", e);
    return "";
  }
};

// Obtenir les dates des 6 derniers jours
const getLast6Days = () => {
  const days = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    days.push(date.toISOString().split('T')[0]); // Format YYYY-MM-DD
  }
  
  return days;
};

const BalanceChart: React.FC<BalanceChartProps> = ({ 
  balance, 
  subscription, 
  dailyLimit = 0.5,
  transactions = []
}) => {
  // Préparer les données pour le graphique
  const chartData = React.useMemo(() => {
    console.log("Préparation des données du graphique avec transactions:", transactions);
    
    // Obtenir les 6 derniers jours
    const last6Days = getLast6Days();
    
    // Initialiser les données avec 0 pour chaque jour
    const data = last6Days.map(day => ({
      date: day,
      gain: 0,
      formatted: formatDate(day)
    }));
    
    // Agréger les gains par jour à partir des transactions
    if (Array.isArray(transactions) && transactions.length > 0) {
      // Grouper les transactions par jour
      const gainsByDay: Record<string, number> = {};
      
      transactions.forEach(tx => {
        if (tx.date && (tx.gain || tx.amount)) {
          const txDate = tx.date;
          const amount = tx.gain || tx.amount || 0;
          
          if (!gainsByDay[txDate]) {
            gainsByDay[txDate] = 0;
          }
          
          gainsByDay[txDate] += amount;
        }
      });
      
      // Mettre à jour les données du graphique avec les gains réels
      data.forEach((day, index) => {
        if (gainsByDay[day.date]) {
          data[index].gain = Math.min(dailyLimit, gainsByDay[day.date]);
        }
      });
    }
    
    console.log("Données préparées pour le graphique:", data);
    return data;
  }, [transactions, dailyLimit]);

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-slate-300">Historique des gains</h3>
        <div className="text-xs text-slate-300">Limite: {dailyLimit}€/jour</div>
      </div>
      
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
            <XAxis 
              dataKey="formatted" 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              hide={true}
              domain={[0, dailyLimit]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#e2e8f0'
              }}
              formatter={(value) => [`${value}€`, 'Gains']}
              labelFormatter={(label) => `${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="gain" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 2 }}
              activeDot={{ fill: '#10b981', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BalanceChart;

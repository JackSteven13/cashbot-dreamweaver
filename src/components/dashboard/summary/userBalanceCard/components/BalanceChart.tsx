
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';

interface BalanceChartProps {
  balance: number;
  subscription: string;
  dailyLimit: number;
  transactions?: Array<{
    date: string;
    gain?: number;
    amount?: number;
  }>;
}

// Fonction pour obtenir des données basées sur les transactions réelles si disponibles
const generateChartData = (
  currentBalance: number, 
  subscription: string,
  transactions?: Array<{
    date: string;
    gain?: number;
    amount?: number;
  }>
) => {
  // Jours de la semaine pour l'affichage
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
  const dayIndex = today === 0 ? 6 : today - 1; // Convert to 0 = Monday, 6 = Sunday
  
  // Initialiser les données du graphique avec des valeurs nulles
  const chartData = days.map(day => ({
    day,
    gain: 0,
    isToday: false
  }));
  
  // Si nous avons des transactions, les utiliser pour remplir le graphique
  if (Array.isArray(transactions) && transactions.length > 0) {
    // Regrouper les transactions par jour de la semaine
    const transactionsByDay = new Map();
    
    // Date d'aujourd'hui au format YYYY-MM-DD pour comparaison
    const todayDate = new Date().toISOString().split('T')[0];
    
    // Obtenir le premier jour de la semaine actuelle (lundi)
    const currentDate = new Date();
    const firstDayOfWeek = new Date(currentDate);
    const daysSinceMonday = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1;
    firstDayOfWeek.setDate(currentDate.getDate() - daysSinceMonday);
    
    // Transformer en YYYY-MM-DD
    const mondayDate = firstDayOfWeek.toISOString().split('T')[0];
    
    // Filtrer pour n'avoir que les transactions de cette semaine
    const thisWeekTransactions = transactions.filter(tx => {
      if (!tx.date) return false;
      const txDate = tx.date.split('T')[0]; // Assurer le format YYYY-MM-DD
      return txDate >= mondayDate;
    });
    
    // Regrouper par jour de semaine
    thisWeekTransactions.forEach(tx => {
      if (!tx.date) return;
      
      const txDate = new Date(tx.date);
      const dayOfWeek = txDate.getDay();
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convertir en 0 = lundi
      const dayName = days[dayIndex];
      
      const isToday = tx.date.split('T')[0] === todayDate;
      const gain = tx.gain || tx.amount || 0;
      
      if (!transactionsByDay.has(dayName)) {
        transactionsByDay.set(dayName, { total: 0, isToday });
      }
      
      const current = transactionsByDay.get(dayName);
      transactionsByDay.set(dayName, {
        total: current.total + gain,
        isToday
      });
    });
    
    // Mettre à jour les données du graphique avec les valeurs réelles
    days.forEach((day, index) => {
      if (transactionsByDay.has(day)) {
        const dayData = transactionsByDay.get(day);
        chartData[index].gain = dayData.total;
        chartData[index].isToday = dayData.isToday;
      } else if (index === dayIndex) {
        // Si c'est aujourd'hui mais pas de transactions
        chartData[index].isToday = true;
      }
    });
  } else {
    // Aucune transaction disponible, générer des données simulées
    // Ajuster le multiplicateur basé sur l'abonnement
    let multiplier = 0.12;
    if (subscription === 'starter') multiplier = 0.18;
    if (subscription === 'pro' || subscription === 'gold') multiplier = 0.22;
    if (subscription === 'elite') multiplier = 0.25;
    
    // Base value - for higher subscriptions, show higher historical values
    let baseValue = currentBalance * 0.5;
    if (subscription === 'freemium') baseValue = currentBalance * 0.2;
    
    // Générer des données pour chaque jour
    chartData.forEach((item, index) => {
      // Faire du jour actuel la valeur la plus élevée
      const isToday = index === dayIndex;
      item.isToday = isToday;
      
      // Créer un modèle où les gains augmentent progressivement
      const factor = Math.min(1, 0.5 + (index / 12) + (Math.random() * 0.2));
      
      let value = baseValue * factor;
      if (isToday) value = currentBalance * 0.8; // Today is the highest, but not the full balance
      
      // Randomize a bit
      value = value * (0.9 + Math.random() * 0.2);
      
      item.gain = Number(value.toFixed(2));
    });
  }
  
  return chartData;
};

const BalanceChart: React.FC<BalanceChartProps> = ({ 
  balance = 0, 
  subscription = 'freemium',
  dailyLimit = 0.5,
  transactions = []
}) => {
  const [data, setData] = useState<{ day: string; gain: number; isToday: boolean }[]>([]);
  
  // Generate chart data
  useEffect(() => {
    if (typeof balance === 'number' && balance >= 0) {
      setData(generateChartData(balance, subscription, transactions));
    } else {
      // Default to empty data if balance is invalid
      setData([]);
    }
  }, [balance, subscription, transactions]);
  
  // Format for the tooltip
  const formatTooltip = (value: number) => {
    return `${value.toFixed(2)}€`;
  };
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const isToday = payload[0].payload.isToday;
      
      return (
        <div className="bg-slate-800 p-2 rounded shadow-md border border-slate-700 text-xs">
          <p className="text-slate-300 mb-1">{payload[0].payload.day} {isToday ? '(Auj.)' : ''}</p>
          <p className="text-green-300 font-medium">
            Gain: {formatTooltip(payload[0].value)}
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  // Safety check for undefined balance
  if (!data.length || balance === undefined || balance === null) {
    return (
      <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
        Chargement des données...
      </div>
    );
  }
  
  // Format daily limit for display
  const formattedDailyLimit = typeof dailyLimit === 'number' ? dailyLimit.toFixed(2) : '0.00';
  
  return (
    <div className="balance-chart pb-2 pt-1">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-medium opacity-80">Historique des gains</h4>
        <span className="text-xs text-green-300">Limite: {formattedDailyLimit}€/jour</span>
      </div>
      
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -35, bottom: 5 }}>
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
            />
            <YAxis 
              hide={true}
              domain={[0, 'dataMax + 0.2']}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={dailyLimit} 
              stroke="#f97316" 
              strokeDasharray="3 3" 
            />
            <Bar 
              dataKey="gain" 
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              minPointSize={2}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BalanceChart;

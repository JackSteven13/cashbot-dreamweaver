import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUserData } from '@/hooks/useUserData';
import { Transaction } from '@/types/userData';

const AnalyticsPage = () => {
  const { userData, isLoading } = useUserData();
  
  // Transformer les transactions en données pour le graphique
  const getChartData = () => {
    if (!userData?.transactions || userData.transactions.length === 0) {
      return [];
    }
    
    // Créer un tableau trié par date
    const sortedTransactions = [...userData.transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Accumuler le solde au fil du temps
    let runningBalance = 0;
    return sortedTransactions.map(transaction => {
      runningBalance += transaction.amount;
      return {
        date: new Date(transaction.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        solde: runningBalance
      };
    });
  };
  
  const chartData = getChartData();

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Analyses</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Évolution du solde</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Chargement des données...</div>
          ) : chartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="solde" 
                    stroke="#2d5f8a" 
                    activeDot={{ r: 8 }} 
                    name="Solde"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Pas assez de données pour générer un graphique.
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Statistiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              title="Solde actuel" 
              value={`${userData?.balance.toFixed(2) || '0.00'} €`}
            />
            <StatCard 
              title="Transactions" 
              value={userData?.transactions?.length.toString() || '0'}
            />
            <StatCard 
              title="Moyenne par transaction" 
              value={calculateAverage(userData?.transactions)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ title, value }: { title: string, value: string }) => (
  <div className="bg-muted/50 p-4 rounded-lg">
    <p className="text-sm text-muted-foreground">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const calculateAverage = (transactions?: Transaction[]) => {
  if (!transactions || transactions.length === 0) return '0.00 €';
  
  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  return `${(total / transactions.length).toFixed(2)} €`;
};

export default AnalyticsPage;

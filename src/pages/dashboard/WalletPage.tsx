
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserData } from '@/hooks/useUserData';
import { CreditCard, Wallet, ArrowDownToLine, ArrowUpToLine } from 'lucide-react';

const WalletPage = () => {
  const { userData, isLoading } = useUserData();

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Portefeuille</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              Solde disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              {isLoading ? "..." : `${userData?.balance.toFixed(2) || '0.00'} €`}
            </div>
            <div className="flex space-x-3">
              <Button size="sm" variant="outline">
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                Déposer
              </Button>
              <Button size="sm">
                <ArrowUpToLine className="mr-2 h-4 w-4" />
                Retirer
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Moyens de paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userData?.paymentMethods?.length > 0 ? (
              <div className="space-y-3">
                {userData.paymentMethods.map((method, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center">
                      <CreditCard className="mr-3 h-4 w-4" />
                      <div>
                        <p className="font-medium">{method.type}</p>
                        <p className="text-sm text-muted-foreground">****{method.lastFour}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Gérer</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground mb-4">Aucun moyen de paiement enregistré.</p>
                <Button>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Ajouter un moyen de paiement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
          <CardDescription>Vos 5 dernières transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-4 text-center">Chargement des transactions...</div>
          ) : userData?.transactions && userData.transactions.length > 0 ? (
            <div className="space-y-3">
              {userData.transactions.slice(0, 5).map((transaction, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{transaction.type}</p>
                    <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                  <div className={`font-bold ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} €
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2" onClick={() => {}}>
                Voir toutes les transactions
              </Button>
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              Aucune transaction à afficher.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletPage;

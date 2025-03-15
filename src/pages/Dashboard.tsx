
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  DollarSign, 
  GaugeCircle, 
  History, 
  LineChart, 
  LogOut, 
  Settings, 
  Share2, 
  UserCircle,
  Copy
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import Button from '@/components/Button';
import SessionCard from '@/components/SessionCard';
import { Card, CardContent } from '@/components/ui/card';

// Mock data - in a real app, this would come from your backend
const mockUser = {
  username: 'admin',
  balance: 1567.82,
  subscription: 'alpha',
  referrals: [],
  referralLink: 'https://cashbot.com?ref=admin',
  transactions: [
    {
      date: '2023-09-15',
      gain: 98.42,
      report: "L'algorithme a identifié une divergence de volatilité sur EUR/USD suite à la publication des données d'inflation. Exploitation d'un arbitrage temporaire avec un ratio risque/rendement de 1:3.2. Transition fluide entre les positions, minimisant l'exposition au risque systémique."
    },
    {
      date: '2023-09-14',
      gain: 76.29,
      report: "Analyse technique révélant une formation en triangle ascendant sur BTC/USD. L'IA a anticipé le franchissement du niveau de résistance et a exécuté un ordre d'achat à 42,850€ avec TP à 43,215€. Clôture avec un gain net après frais de transaction."
    },
    {
      date: '2023-09-13',
      gain: 105.11,
      report: "Corrélation inter-marchés exploitée entre indices boursiers européens et américains. Position initiée sur DAX à l'ouverture européenne avant le gap haussier américain. Optimisation du timing d'entrée basée sur les modèles historiques et les flux institutionnels."
    }
  ]
};

const Dashboard = () => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');

  const handleStartSession = () => {
    setIsStartingSession(true);
    // Simulate a session (in a real app, this would call your backend)
    setTimeout(() => {
      setIsStartingSession(false);
      toast({
        title: "Session démarrée",
        description: "L'IA analyse actuellement le marché pour vous",
      });
      // You would typically update the user data here from your backend
    }, 2000);
  };

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(mockUser.referralLink);
    toast({
      title: "Lien copié !",
      description: "Votre lien de parrainage a été copié dans le presse-papier",
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-card border-r border-border">
        <div className="p-6">
          <Link to="/" className="text-2xl font-semibold tracking-tight">
            CashBot
          </Link>
        </div>
        
        <div className="flex-1 px-3 py-4 space-y-1">
          <button
            className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
              selectedNavItem === 'dashboard' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-secondary text-foreground'
            }`}
            onClick={() => setSelectedNavItem('dashboard')}
          >
            <GaugeCircle size={18} className="mr-3" />
            Tableau de bord
          </button>
          <button
            className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
              selectedNavItem === 'transactions' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-secondary text-foreground'
            }`}
            onClick={() => setSelectedNavItem('transactions')}
          >
            <History size={18} className="mr-3" />
            Historique
          </button>
          <button
            className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
              selectedNavItem === 'analytics' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-secondary text-foreground'
            }`}
            onClick={() => setSelectedNavItem('analytics')}
          >
            <LineChart size={18} className="mr-3" />
            Analyses
          </button>
          <button
            className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
              selectedNavItem === 'wallet' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-secondary text-foreground'
            }`}
            onClick={() => setSelectedNavItem('wallet')}
          >
            <CreditCard size={18} className="mr-3" />
            Portefeuille
          </button>
          <button
            className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
              selectedNavItem === 'referrals' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-secondary text-foreground'
            }`}
            onClick={() => setSelectedNavItem('referrals')}
          >
            <Share2 size={18} className="mr-3" />
            Parrainage
          </button>
          <button
            className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
              selectedNavItem === 'settings' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-secondary text-foreground'
            }`}
            onClick={() => setSelectedNavItem('settings')}
          >
            <Settings size={18} className="mr-3" />
            Paramètres
          </button>
        </div>
        
        <div className="p-4 mt-auto">
          <Link to="/logout">
            <Button variant="outline" fullWidth className="justify-start">
              <LogOut size={18} className="mr-3" />
              Déconnexion
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-semibold">Tableau de bord</h1>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-right hidden sm:block">
                <p className="font-medium">{mockUser.username}</p>
                <p className="text-muted-foreground">Abonnement {mockUser.subscription}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <UserCircle size={24} />
              </div>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 p-4 md:p-6">
          {/* Main Dashboard Panel */}
          <div className="glass-panel p-6 rounded-xl mb-8">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column */}
              <div className="flex-1">
                <div className="flex items-center mb-6">
                  <DollarSign className="text-primary h-8 w-8 mr-2" />
                  <h2 className="text-2xl font-semibold">Solde : {mockUser.balance.toFixed(2)}€</h2>
                </div>
                
                <Button 
                  size="lg" 
                  fullWidth 
                  className="pulse-animation mb-6"
                  isLoading={isStartingSession} 
                  onClick={handleStartSession}
                >
                  {isStartingSession ? "Analyse en cours..." : "▶️ Lancer une session IA"}
                </Button>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-3">🚀 Votre lien magique :</h3>
                  <div className="flex">
                    <input 
                      type="text" 
                      value={mockUser.referralLink} 
                      readOnly 
                      className="bg-secondary/40 rounded-l-lg px-3 py-2 flex-1 text-sm"
                    />
                    <Button variant="outline" onClick={handleCopyReferralLink} className="rounded-l-none">
                      <Copy size={16} />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Gagnez 70% sur chaque filleul !</p>
                </div>
              </div>
              
              {/* Right Column - AI Terminal */}
              <Card className="w-full lg:w-1/2 bg-black border-gray-800">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-green-400 mb-3">📈 Dernier rapport IA :</h3>
                  <div className="font-mono text-sm text-green-400 space-y-2 bg-black p-3 rounded">
                    <p>> Analyse de 142 pubs...</p>
                    <p>> Détection tendance haussière crypto</p>
                    <p>> Profit estimé : +47€</p>
                    <p className="blink-cursor">&nbsp;</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Recent Sessions */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Sessions récentes</h2>
              <Button variant="outline" size="sm">
                Voir tout l'historique
              </Button>
            </div>
            
            <div className="space-y-4">
              {mockUser.transactions.map((transaction, index) => (
                <SessionCard 
                  key={index}
                  gain={transaction.gain}
                  report={transaction.report}
                  date={transaction.date}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

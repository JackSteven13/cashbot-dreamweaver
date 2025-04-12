import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Users, Gift } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { toast } from 'sonner';
import { COMMISSION_RATES } from '@/components/dashboard/summary/constants';

interface EnhancedReferral {
  id: string;
  referred_user_id: string;
  referrer_id: string;
  plan_type: string;
  commission_rate: number;
  status: string;
  created_at: string;
  updated_at?: string;
  active: boolean;
  commission_earned?: number;
  username?: string;
  joinDate?: string;
}

const ReferralsPage = () => {
  const { userData, isLoading } = useUserData();
  const [copied, setCopied] = useState(false);
  
  const referralLink = userData?.referralLink || `${window.location.origin}/register?ref=user123`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Lien de parrainage copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const processedReferrals = React.useMemo(() => {
    if (!userData?.referrals) return [];
    
    return userData.referrals.map(referral => ({
      ...referral,
      active: referral.status === 'active',
      username: `User-${referral.referred_user_id.substring(0, 6)}`,
      joinDate: referral.created_at
    } as EnhancedReferral));
  }, [userData?.referrals]);

  const commissionRate = userData?.subscription ? 
    COMMISSION_RATES[userData.subscription as keyof typeof COMMISSION_RATES] || 0.2 : 
    0.2;
  
  const commissionPercentage = Math.round(commissionRate * 100);

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Programme de parrainage</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Parrainages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : userData?.referrals?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Utilisateurs parrainés</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Gift className="mr-2 h-5 w-5" />
              Bonus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : `${calculateReferralBonus(processedReferrals).toFixed(2)} €`}
            </div>
            <p className="text-sm text-muted-foreground">Gains totaux</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Share2 className="mr-2 h-5 w-5" />
              Récompense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{commissionPercentage}%</div>
            <p className="text-sm text-muted-foreground">Commission par parrainage</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Votre lien de parrainage</CardTitle>
          <CardDescription>
            Partagez ce lien avec vos amis et gagnez jusqu'à {commissionPercentage}% de commission sur leurs abonnements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              readOnly
              value={referralLink}
              className="font-mono text-sm"
            />
            <Button onClick={handleCopyLink} variant={copied ? "default" : "outline"}>
              {copied ? "Copié !" : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 mt-4">
            <p className="text-sm font-medium text-amber-800">
              ✨ Avantage exclusif : Augmentez votre taux de commission en souscrivant à un forfait supérieur !
            </p>
          </div>
          
          <div className="mt-4 flex space-x-2">
            <Button variant="outline" onClick={() => window.open(`https://twitter.com/intent/tweet?text=Rejoignez-moi sur Stream Genius et gagnez de l'argent ! ${encodeURIComponent(referralLink)}`, '_blank')}>
              Partager sur Twitter
            </Button>
            <Button variant="outline" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank')}>
              Partager sur Facebook
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Vos filleuls</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Chargement des données...</div>
          ) : processedReferrals.length > 0 ? (
            <div className="space-y-4">
              {processedReferrals.map((referral, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{referral.username}</p>
                    <p className="text-sm text-muted-foreground">Inscrit le {new Date(referral.joinDate).toLocaleDateString()}</p>
                  </div>
                  <div className={`font-medium ${referral.active ? 'text-green-500' : 'text-amber-500'}`}>
                    {referral.active ? 'Actif' : 'En attente'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Vous n'avez pas encore de filleuls.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const calculateReferralBonus = (referrals: Array<{ active: boolean }>) => {
  if (!referrals || referrals.length === 0) return 0;
  
  const activeReferrals = referrals.filter(ref => ref.active).length;
  return activeReferrals * 10;
};

export default ReferralsPage;

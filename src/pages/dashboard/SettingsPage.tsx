
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserData } from '@/hooks/useUserData';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { userData, isLoading } = useUserData();
  const [profileData, setProfileData] = useState({
    username: userData?.username || '',
    email: userData?.email || '',
  });
  
  // Notifications settings with default values
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    sessionNotifications: true,
    marketingEmails: false,
  });
  
  // Handle profile form change
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle profile form submission
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profil mis à jour avec succès !");
  };
  
  // Handle notification toggle
  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success("Préférences de notification mises à jour !");
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="subscription">Abonnement</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Modifiez vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input 
                    id="username" 
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                  />
                </div>
                
                <Button type="submit">Enregistrer les modifications</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de notification</CardTitle>
              <CardDescription>
                Gérez comment et quand vous souhaitez être notifié
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-alerts">Alertes par e-mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevez des alertes concernant votre compte par e-mail
                  </p>
                </div>
                <Switch
                  id="email-alerts"
                  checked={notifications.emailAlerts}
                  onCheckedChange={() => handleNotificationToggle('emailAlerts')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="session-notifications">Notifications de session</Label>
                  <p className="text-sm text-muted-foreground">
                    Soyez informé lorsqu'une session se termine
                  </p>
                </div>
                <Switch
                  id="session-notifications"
                  checked={notifications.sessionNotifications}
                  onCheckedChange={() => handleNotificationToggle('sessionNotifications')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing-emails">E-mails marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevez des nouvelles sur nos offres et mises à jour
                  </p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={notifications.marketingEmails}
                  onCheckedChange={() => handleNotificationToggle('marketingEmails')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité du compte</CardTitle>
              <CardDescription>
                Gérez votre mot de passe et la sécurité de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <Input id="current-password" type="password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input id="new-password" type="password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input id="confirm-password" type="password" />
              </div>
              
              <Button>Modifier le mot de passe</Button>
              
              <div className="pt-6 border-t mt-6">
                <h3 className="font-medium mb-4">Sessions actives</h3>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Ce navigateur</p>
                        <p className="text-sm text-muted-foreground">Dernière activité : {new Date().toLocaleDateString()}</p>
                      </div>
                      <Button variant="outline" size="sm">Déconnecter</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Abonnement</CardTitle>
              <CardDescription>
                Gérez votre abonnement et vos options de paiement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium mb-1">
                      Plan {userData?.subscription === 'premium' ? 'Premium' : 
                          userData?.subscription === 'pro' ? 'Pro' : 'Freemium'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {userData?.subscription === 'premium' ? 'Accès aux fonctionnalités avancées' : 
                       userData?.subscription === 'pro' ? 'Accès à toutes les fonctionnalités' : 
                       'Plan gratuit avec fonctionnalités limitées'}
                    </p>
                  </div>
                  {userData?.subscription !== 'premium' && userData?.subscription !== 'pro' && (
                    <Button>Mettre à niveau</Button>
                  )}
                  {(userData?.subscription === 'premium' || userData?.subscription === 'pro') && (
                    <Button variant="outline">Gérer</Button>
                  )}
                </div>
              </div>
              
              {(userData?.subscription === 'premium' || userData?.subscription === 'pro') && (
                <div>
                  <h3 className="font-medium mb-4">Historique de facturation</h3>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium">Abonnement {userData?.subscription === 'premium' ? 'Premium' : 'Pro'}</p>
                        <p className="text-sm text-muted-foreground">01/03/2025</p>
                      </div>
                      <Button variant="ghost" size="sm">Reçu</Button>
                    </div>
                    <div className="p-3 border rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium">Abonnement {userData?.subscription === 'premium' ? 'Premium' : 'Pro'}</p>
                        <p className="text-sm text-muted-foreground">01/02/2025</p>
                      </div>
                      <Button variant="ghost" size="sm">Reçu</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

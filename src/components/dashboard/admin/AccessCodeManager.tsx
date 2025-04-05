
import { useState, useEffect } from 'react';
import { Filter, Search, RefreshCw, Eye, EyeOff, Ban, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AccessCodeGenerator from './AccessCodeGenerator';

interface CodeData {
  id: string;
  code: string;
  is_active: boolean;
  owner_id: string | null;
  created_at: string;
  created_by_admin: boolean;
  owner_name?: string;
  owner_email?: string;
  used_count?: number;
}

const AccessCodeManager = () => {
  const [codes, setCodes] = useState<CodeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Vérifier si l'utilisateur est administrateur (code 87878787)
    const checkAdmin = () => {
      const accessCode = localStorage.getItem('access_code');
      const isAdminFlag = localStorage.getItem('is_admin') === 'true';
      
      if (accessCode === '87878787' || isAdminFlag) {
        setIsAdmin(true);
      }
    };
    
    checkAdmin();
    loadCodes();
  }, []);
  
  const loadCodes = async () => {
    setIsLoading(true);
    
    try {
      // Récupérer les codes depuis la base de données
      const { data: codesData, error: codesError } = await supabase
        .from('referral_codes')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (codesError) throw codesError;
      
      // Récupérer les informations des propriétaires des codes
      const codesWithOwners = await Promise.all(
        (codesData || []).map(async (code) => {
          if (code.owner_id) {
            const { data: ownerData, error: ownerError } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', code.owner_id)
              .single();
              
            if (!ownerError && ownerData) {
              return {
                ...code,
                owner_name: ownerData.full_name,
                owner_email: ownerData.email
              };
            }
          }
          
          // Compter le nombre d'utilisations
          const { count, error: countError } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('access_code', code.code);
            
          return {
            ...code,
            used_count: countError ? 0 : count || 0
          };
        })
      );
      
      setCodes(codesWithOwners);
    } catch (error) {
      console.error("Error loading codes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les codes d'accès. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleCodeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('referral_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      // Mettre à jour l'état local
      setCodes(prevCodes => 
        prevCodes.map(code => 
          code.id === id ? { ...code, is_active: !currentStatus } : code
        )
      );
      
      toast({
        title: "Code mis à jour",
        description: `Le code a été ${!currentStatus ? 'activé' : 'désactivé'}.`,
      });
    } catch (error) {
      console.error("Error toggling code status:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut du code. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };
  
  // Filtrer les codes en fonction de la recherche et du filtre de statut
  const filteredCodes = codes.filter(code => {
    const matchesSearch = 
      code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (code.owner_name && code.owner_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (code.owner_email && code.owner_email.toLowerCase().includes(searchQuery.toLowerCase()));
      
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && code.is_active;
    if (statusFilter === 'inactive') return matchesSearch && !code.is_active;
    if (statusFilter === 'used') return matchesSearch && !!code.owner_id;
    if (statusFilter === 'unused') return matchesSearch && !code.owner_id;
    
    return matchesSearch;
  });

  if (!isAdmin) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Accès refusé</CardTitle>
          <CardDescription>
            Vous n'avez pas les droits administrateur nécessaires pour accéder à cette page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AccessCodeGenerator />
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Gestion des codes d'accès</CardTitle>
          <CardDescription>
            Visualisez et gérez tous les codes d'accès de la plateforme
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un code ou un utilisateur..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les codes</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="inactive">Inactifs</SelectItem>
                    <SelectItem value="used">Utilisés</SelectItem>
                    <SelectItem value="unused">Non utilisés</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={loadCodes} disabled={isLoading}>
                  <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>
            
            <div className="border rounded-md">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Créé le</TableHead>
                      <TableHead>Utilisé par</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Utilisations</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <RefreshCw size={24} className="mx-auto animate-spin text-primary" />
                          <p className="mt-2 text-sm text-muted-foreground">Chargement des codes...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredCodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <p className="text-muted-foreground">Aucun code correspondant trouvé</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCodes.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell className="font-mono">{code.code}</TableCell>
                          <TableCell>
                            {code.is_active ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                Inactif
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(code.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{code.owner_name || '—'}</TableCell>
                          <TableCell>{code.owner_email || '—'}</TableCell>
                          <TableCell>{code.used_count || 0}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleCodeStatus(code.id, code.is_active)}
                              disabled={code.code === '87878787'} // Ne pas permettre de désactiver le code admin
                            >
                              {code.is_active ? (
                                <Ban size={16} className="text-red-500" />
                              ) : (
                                <Check size={16} className="text-green-500" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 text-sm text-muted-foreground">
              <p>Total : {filteredCodes.length} codes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessCodeManager;

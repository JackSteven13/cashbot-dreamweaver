
import { useState } from 'react';
import { Copy, CheckCheck, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";

interface GeneratedCode {
  code: string;
  generated_at: string;
}

const AccessCodeGenerator = () => {
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [codeCount, setCodeCount] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const generateRandomDigits = (length: number) => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10);
    }
    return result;
  };

  const handleGenerateCodes = async () => {
    setIsGenerating(true);
    
    try {
      const newCodes: GeneratedCode[] = [];
      
      for (let i = 0; i < codeCount; i++) {
        const code = generateRandomDigits(8);
        const timestamp = new Date().toISOString();
        
        // Enregistrer le code en base de données
        const { error } = await supabase
          .from('referral_codes')
          .insert({
            code: code,
            is_active: true,
            owner_id: null, // Sera attribué au premier utilisateur qui s'inscrit avec ce code
            created_by_admin: true,
          });
          
        if (error) {
          throw new Error(`Erreur lors de l'enregistrement du code: ${error.message}`);
        }
        
        newCodes.push({
          code,
          generated_at: timestamp
        });
      }
      
      setGeneratedCodes([...newCodes, ...generatedCodes]);
      
      toast({
        title: "Codes générés avec succès",
        description: `${codeCount} nouveaux codes d'accès ont été générés.`,
      });
    } catch (error) {
      console.error("Error generating codes:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la génération des codes.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
    
    toast({
      title: "Code copié",
      description: "Le code a été copié dans le presse-papier.",
    });
  };

  const handleDownloadCodes = () => {
    if (generatedCodes.length === 0) return;
    
    const csvContent = "Code,Date de génération\n" + 
      generatedCodes.map(code => `${code.code},${new Date(code.generated_at).toLocaleString()}`).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `codes-acces-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Téléchargement réussi",
      description: "La liste des codes a été téléchargée.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Générateur de codes d'accès</CardTitle>
        <CardDescription>
          Générez des codes d'accès à 8 chiffres pour vos nouveaux utilisateurs
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codeCount">Nombre de codes</Label>
              <Input
                id="codeCount"
                type="number"
                min="1"
                max="100"
                value={codeCount}
                onChange={(e) => setCodeCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              />
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={handleGenerateCodes}
                className="w-full"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  "Générer les codes"
                )}
              </Button>
            </div>
          </div>
          
          {generatedCodes.length > 0 && (
            <>
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Codes générés ({generatedCodes.length})</h3>
                
                <div className="border rounded-md overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Code
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {generatedCodes.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-3 py-3 whitespace-nowrap text-sm font-mono">
                              {item.code}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(item.generated_at).toLocaleString()}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-right text-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyCode(item.code)}
                              >
                                {copiedCode === item.code ? (
                                  <CheckCheck size={16} className="text-green-500" />
                                ) : (
                                  <Copy size={16} />
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={handleDownloadCodes}
                  className="flex items-center"
                >
                  <Download size={16} className="mr-2" />
                  Télécharger CSV
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start border-t pt-6">
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>Note:</strong> Ces codes sont à usage unique et seront liés au premier utilisateur qui les utilisera.
          </p>
          <p>
            Le code administrateur fixe (87878787) n'apparaît pas dans cette liste mais reste toujours valide.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AccessCodeGenerator;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Link } from 'lucide-react';

interface ReferralLinkDisplayProps {
  referralLink: string;
  referralCount: number;
}

export const ReferralLinkDisplay: React.FC<ReferralLinkDisplayProps> = ({ 
  referralLink, 
  referralCount 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Programme d'affiliation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground">
            Votre lien d'affiliation :
          </div>
          <div className="flex items-center space-x-2">
            <Input 
              value={referralLink} 
              readOnly 
              className="flex-1" 
            />
            <Link className="text-blue-500" />
          </div>
          <div className="text-sm text-muted-foreground">
            {referralCount} utilisateur{referralCount !== 1 ? 's' : ''} affilié{referralCount !== 1 ? 's' : ''}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

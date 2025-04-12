
import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReferralSystem from '../../ReferralSystem';

interface ReferralButtonProps {
  referralLink: string;
  buttonClassName?: string;
}

const ReferralButton: React.FC<ReferralButtonProps> = ({ 
  referralLink,
  buttonClassName = ''
}) => {
  return (
    <div className="w-full">
      <ReferralSystem referralLink={referralLink} />
    </div>
  );
};

export default ReferralButton;

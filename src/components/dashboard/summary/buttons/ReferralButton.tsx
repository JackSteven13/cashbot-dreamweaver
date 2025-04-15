
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReferralLinkModal from '@/components/modals/ReferralLinkModal';

interface ReferralButtonProps {
  referralLink: string;
  subscription?: string;
}

const ReferralButton: React.FC<ReferralButtonProps> = ({ 
  referralLink,
  subscription = 'freemium'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white"
              variant="default"
              size="lg"
            >
              <div className="flex items-center">
                <Share2 className="mr-2 h-5 w-5" />
                <span>Parrainage</span>
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Partagez votre lien de parrainage</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ReferralLinkModal 
        open={isModalOpen} 
        setOpen={setIsModalOpen}
        referralLink={referralLink}
        subscription={subscription}
      />
    </>
  );
};

export default ReferralButton;

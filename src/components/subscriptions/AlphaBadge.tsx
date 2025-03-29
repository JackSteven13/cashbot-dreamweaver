
import React from 'react';
import { Sparkles, Zap, Trophy, Crown, Star } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AlphaBadgeProps {
  userName?: string;
}

const AlphaBadge: React.FC<AlphaBadgeProps> = ({ userName }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="w-full animate-fadeIn">
      <div className="bg-gradient-to-r from-violet-900/90 via-fuchsia-800/90 to-purple-800/90 rounded-lg shadow-lg border border-purple-400/30 p-3 md:p-4 mb-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTZtMyAzbS02IDBoLTZtMTIgMGgtNiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
        
        {/* Animated stars in the background */}
        <div className="absolute top-1 right-2 opacity-30">
          <Star className="h-3 w-3 text-purple-200 animate-pulse" />
        </div>
        <div className="absolute bottom-2 left-10 opacity-30">
          <Star className="h-2 w-2 text-purple-200 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="absolute top-3 left-1/4 opacity-30">
          <Star className="h-2 w-2 text-purple-200 animate-pulse" style={{ animationDelay: '1.2s' }} />
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 bg-gradient-to-br from-purple-400 to-violet-600 rounded-full p-2 shadow-inner">
            <Crown className="h-5 w-5 text-white" />
          </div>
          
          <div className="flex-grow">
            <div className="flex items-center">
              <h3 className="text-white font-bold text-base md:text-lg">
                Plan Élite {isMobile ? '' : 'Premium'}
              </h3>
              <Sparkles className="h-4 w-4 text-purple-200 ml-1 animate-pulse" />
            </div>
            
            <p className="text-purple-200 text-xs md:text-sm">
              {userName ? `${userName}, v` : 'V'}otre compte bénéficie des avantages Élite exclusifs
            </p>
          </div>
          
          <div className="hidden md:flex items-center px-3 py-1 bg-violet-800/60 rounded-full border border-purple-500/30">
            <Zap className="h-3.5 w-3.5 text-purple-200 mr-1" />
            <span className="text-purple-100 text-xs font-semibold">50€/jour max</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlphaBadge;

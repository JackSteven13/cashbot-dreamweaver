
import { useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronUp, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionCardProps {
  gain: number;
  report: string;
  date?: string;
}

const SessionCard = ({ gain, report, date = new Date().toLocaleDateString() }: SessionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Special case: only allow negative values for withdrawal transactions
  const isWithdrawal = report.includes("Retrait") || report.includes("retrait");

  return (
    <div className="glass-card rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md">
      <div 
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">{date}</p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className={cn(
                "text-2xl font-semibold",
                isWithdrawal ? "text-red-600" : "text-slate-300"
              )}>
                {isWithdrawal ? "" : "+"}{gain.toFixed(2)}€
              </h3>
              {isWithdrawal ? (
                <ArrowDownRight
                  size={18}
                  className="text-red-600"
                />
              ) : (
                <ArrowUpRight 
                  size={18} 
                  className="text-slate-300" 
                />
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">
              {isExpanded ? "Masquer" : "Détails"}
            </span>
            {isExpanded ? (
              <ChevronUp size={18} className="transition-transform duration-200" />
            ) : (
              <ChevronDown size={18} className="transition-transform duration-200" />
            )}
          </div>
        </div>
      </div>
      
      <div className={cn(
        "border-t border-border transition-all duration-300 overflow-hidden",
        isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="p-6">
          <h4 className="text-lg font-medium mb-3">Résumé de session</h4>
          <div className="text-sm text-muted-foreground whitespace-pre-line">
            {report}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionCard;

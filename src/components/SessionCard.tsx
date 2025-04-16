
import { useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronUp, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionCardProps {
  gain: number;
  report: string;
  date?: string;
  isToday?: boolean;
}

const SessionCard = ({ 
  gain, 
  report, 
  date = new Date().toISOString(),
  isToday = false
}: SessionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Cas spécial : n'autoriser les valeurs négatives que pour les transactions de retrait
  const isWithdrawal = report?.toLowerCase()?.includes("retrait");
  const formattedGain = isNaN(gain) ? 0 : gain;

  // S'assurer que la date est valide et correctement formatée
  const getFormattedDate = () => {
    try {
      if (!date) return new Date().toLocaleDateString('fr-FR');
      
      // Gestion correcte des formats de dates ISO et YYYY-MM-DD
      const parsedDate = new Date(date);
      
      // Vérifier si la date est valide
      if (isNaN(parsedDate.getTime())) {
        // Si c'est une simple chaîne YYYY-MM-DD, la convertir en objet Date
        if (date.length <= 10 && date.includes('-')) {
          const [year, month, day] = date.split('-').map(Number);
          return new Date(year, month - 1, day).toLocaleDateString('fr-FR');
        }
        return new Date().toLocaleDateString('fr-FR');
      }
      
      // Utiliser la locale française pour le format jour/mois/année
      return parsedDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      console.error("Erreur lors du formatage de la date:", date, e);
      return new Date().toLocaleDateString('fr-FR');
    }
  };
  
  const formattedDate = getFormattedDate();
  
  return (
    <div className="glass-card rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md">
      <div 
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              {formattedDate}
              {isToday && (
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                  Aujourd'hui
                </span>
              )}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className={cn(
                "text-2xl font-semibold",
                isWithdrawal ? "text-red-600" : "text-green-500"
              )}>
                {isWithdrawal ? "" : "+"}{formattedGain.toFixed(2)}€
              </h3>
              {isWithdrawal ? (
                <ArrowDownRight
                  size={18}
                  className="text-red-600"
                />
              ) : (
                <ArrowUpRight 
                  size={18} 
                  className="text-green-500" 
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
            {report || "Aucun détail disponible pour cette transaction."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionCard;

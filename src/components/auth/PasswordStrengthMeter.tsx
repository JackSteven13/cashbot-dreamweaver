
import React from 'react';
import { getPasswordStrength, getPasswordIssues } from '@/utils/auth/passwordValidator';

interface PasswordStrengthMeterProps {
  password: string;
  email?: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password, email }) => {
  const strength = getPasswordStrength(password, email);
  const issues = getPasswordIssues(password, email);
  
  // Déterminer la couleur et le libellé en fonction du score
  let color = 'bg-red-500';
  let label = 'Très faible';
  
  if (strength >= 80) {
    color = 'bg-green-500';
    label = 'Excellent';
  } else if (strength >= 60) {
    color = 'bg-green-400';
    label = 'Fort';
  } else if (strength >= 40) {
    color = 'bg-yellow-500';
    label = 'Moyen';
  } else if (strength >= 20) {
    color = 'bg-orange-500';
    label = 'Faible';
  }
  
  // Ne pas afficher si le mot de passe est vide
  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-300`} 
            style={{ width: `${strength}%` }}
          />
        </div>
        <span className="text-xs font-medium whitespace-nowrap">{label}</span>
      </div>
      
      {issues.length > 0 && (
        <ul className="text-xs text-red-500 space-y-1 mt-2">
          {issues.map((issue, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-1">•</span>
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;

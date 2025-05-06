
import React from 'react';

interface PasswordStrengthMeterProps {
  password: string;
  email?: string;
}

// Version simplifiée du composant PasswordStrengthMeter
// Toutes les vérifications avancées sont retirées
const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  // Vérification basique de la longueur
  if (!password) return null;
  
  // Calcul simple de force basé uniquement sur la longueur
  let strength = 0;
  let color = 'bg-red-500';
  let label = 'Faible';
  
  if (password.length >= 8) strength += 40;
  if (password.length >= 10) strength += 20;
  if (password.length >= 12) strength += 20;
  if (/[A-Z]/.test(password)) strength += 10;
  if (/[0-9]/.test(password)) strength += 10;
  
  if (strength >= 60) {
    color = 'bg-green-500';
    label = 'Fort';
  } else if (strength >= 40) {
    color = 'bg-yellow-500';
    label = 'Moyen';
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-300`} 
            style={{ width: `${strength}%` }}
          />
        </div>
        <span className="text-xs font-medium whitespace-nowrap">{label}</span>
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;

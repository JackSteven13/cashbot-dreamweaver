
import React from 'react';
import { 
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription
} from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { Control } from 'react-hook-form';
import { useIsMobile } from '@/hooks/use-mobile';

interface FormValues {
  sessionsPerDay: number;
  daysPerMonth: number;
}

interface CalculatorControlsProps {
  control: Control<FormValues>;
  isHomePage: boolean;
}

const CalculatorControls: React.FC<CalculatorControlsProps> = ({ 
  control, 
  isHomePage 
}) => {
  const isMobile = useIsMobile();
  
  // Amélioration du contraste et de la visibilité
  const labelClass = isHomePage 
    ? "text-white font-medium text-base" 
    : "text-[#1e3a5f] font-medium text-base dark:text-white";
  
  const descriptionClass = isHomePage 
    ? "text-blue-200 text-sm dark:text-blue-200" 
    : "text-gray-600 text-sm dark:text-gray-300";
  
  const valueClass = `min-w-[45px] text-center font-semibold ${
    isHomePage 
      ? 'text-white bg-blue-800 dark:bg-blue-800 rounded px-3 py-1' 
      : 'text-blue-700 dark:text-white bg-blue-50 dark:bg-blue-900/50 rounded px-3 py-1'
  }`;

  // Ajustements pour mobile - espacer correctement les éléments
  const mobileSpacing = isMobile ? "space-y-6" : "space-y-6";
  const mobileDescriptionClass = isMobile ? "mb-2" : "mb-2";

  return (
    <div className={mobileSpacing}>
      <FormField
        control={control}
        name="sessionsPerDay"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClass}>
              Sessions par jour
            </FormLabel>
            <FormDescription className={`${descriptionClass} ${mobileDescriptionClass}`}>
              Nombre de sessions de gain que vous souhaitez lancer quotidiennement
            </FormDescription>
            <div className="flex items-center space-x-4 mt-2">
              <FormControl>
                <Slider
                  min={1}
                  max={8}
                  step={1}
                  value={[field.value]}
                  onValueChange={(values) => field.onChange(values[0])}
                  className="flex-1"
                />
              </FormControl>
              <div className={valueClass}>
                {field.value}
              </div>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="daysPerMonth"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClass}>
              Jours d'activité par mois
            </FormLabel>
            <FormDescription className={`${descriptionClass} ${mobileDescriptionClass}`}>
              Combien de jours par mois utiliserez-vous l'application?
            </FormDescription>
            <div className="flex items-center space-x-4 mt-2">
              <FormControl>
                <Slider
                  min={1}
                  max={30}
                  step={1}
                  value={[field.value]}
                  onValueChange={(values) => field.onChange(values[0])}
                  className="flex-1"
                />
              </FormControl>
              <div className={valueClass}>
                {field.value}
              </div>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};

export default CalculatorControls;

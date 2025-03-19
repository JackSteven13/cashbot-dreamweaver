
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
  // Updated these classes to work better in both light and dark modes
  const labelClass = isHomePage 
    ? "text-white font-medium dark:text-blue-100" 
    : "text-[#1e3a5f] font-medium dark:text-white";
  const descriptionClass = isHomePage 
    ? "text-blue-200 dark:text-blue-200" 
    : "text-gray-600 dark:text-gray-300";
  // Improved contrast for the value display
  const valueClass = `w-12 text-center font-medium ${
    isHomePage 
      ? 'text-white bg-blue-900/50 dark:bg-blue-900/70 rounded px-2 py-1' 
      : 'text-blue-700 dark:text-white bg-blue-50 dark:bg-blue-900/50 rounded px-2 py-1'
  }`;

  return (
    <div className="space-y-5">
      <FormField
        control={control}
        name="sessionsPerDay"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClass}>
              Sessions par jour
            </FormLabel>
            <FormDescription className={descriptionClass}>
              Nombre de sessions de gain que vous souhaitez lancer quotidiennement
            </FormDescription>
            <div className="flex items-center space-x-4">
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
            <FormDescription className={descriptionClass}>
              Combien de jours par mois utiliserez-vous l'application?
            </FormDescription>
            <div className="flex items-center space-x-4">
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

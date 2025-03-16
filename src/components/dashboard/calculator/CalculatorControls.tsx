
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
  const labelClass = isHomePage ? "text-white font-medium" : "text-[#1e3a5f] font-medium";
  const descriptionClass = isHomePage ? "text-blue-200" : "";
  const valueClass = `w-12 text-center font-medium ${isHomePage ? 'text-white' : ''}`;

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

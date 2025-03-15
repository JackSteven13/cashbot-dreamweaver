
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FeatureProps {
  title: string;
  description: string;
  icon: ReactNode;
  className?: string;
}

export const Feature = ({ title, description, icon, className }: FeatureProps) => {
  return (
    <div className={cn("p-6 rounded-xl glass-card group", className)}>
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary transition-transform group-hover:scale-105">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

interface FeaturesGridProps {
  title: string;
  subtitle?: string;
  features: {
    title: string;
    description: string;
    icon: ReactNode;
  }[];
}

export const FeaturesGrid = ({ title, subtitle, features }: FeaturesGridProps) => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Feature
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;

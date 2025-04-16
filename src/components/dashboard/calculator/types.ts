
export interface SubscriptionPlanCardProps {
  title: string;
  price: number;
  description?: string;
  features: string[];
  limit: number;
  current?: boolean;
  mostPopular?: boolean;
  action?: React.ReactNode;
  plan?: string;
  isSelected?: boolean;
  isHomePage?: boolean;
  isCurrent?: boolean;
  isFreemium?: boolean;
  subscriptionLabel?: string;
  subscriptionPrice?: number;
  revenue?: number;
  profit?: number;
  onClick?: () => void;
}

export interface CardStyleProps {
  isSelected?: boolean;
  mostPopular?: boolean;
  isCurrent?: boolean;
  current?: boolean;
}

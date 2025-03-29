
import { PlanType } from '@/hooks/payment/types';

export interface Plan {
  id: PlanType;
  title: string;
  price: number;
  description: string;
  features: string[];
  limit: number;
  commission: number;
  mostPopular?: boolean;
  disabled?: boolean;
  current?: boolean;
}

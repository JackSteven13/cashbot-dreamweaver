
import { FC } from 'react';
import DailyLimitAlert from '@/components/dashboard/DailyLimitAlert';
import DormancyAlert from '@/components/dashboard/DormancyAlert';
import { useDashboardData } from './DashboardDataProvider';

export const DashboardAlerts: FC = () => {
  const {
    effectiveSubscription,
    userData,
    showLimitAlert,
    isDormant,
    dormancyData,
    handleReactivate
  } = useDashboardData();

  if (!userData) return null;

  return (
    <>
      {/* Display dormancy alert if applicable */}
      {isDormant && dormancyData && (
        <DormancyAlert 
          show={isDormant}
          dormancyDays={dormancyData.dormancyDays}
          penalties={dormancyData.penalties}
          originalBalance={dormancyData.originalBalance}
          remainingBalance={dormancyData.remainingBalance}
          reactivationFee={dormancyData.reactivationFee}
          onReactivate={handleReactivate}
        />
      )}
      
      <DailyLimitAlert 
        show={showLimitAlert && !isDormant} 
        subscription={effectiveSubscription}
        currentBalance={userData.balance}
      />
    </>
  );
};

export default DashboardAlerts;

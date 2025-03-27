
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardAlerts from '@/components/dashboard/DashboardAlerts';
import ToastProvider from '@/components/ToastProvider';
import { DashboardDataProvider, useDashboardData } from '@/components/dashboard/DashboardDataProvider';
import { useDashboardNavigation } from '@/hooks/useDashboardNavigation';

// Wrapper component to use the dashboard data context
const DashboardWrapper = () => {
  const { selectedNavItem, setSelectedNavItem } = useDashboardNavigation();
  const { userData, effectiveSubscription, renderKey } = useDashboardData();

  return (
    <DashboardLayout
      key={renderKey}
      username={userData.username}
      subscription={effectiveSubscription}
      selectedNavItem={selectedNavItem}
      setSelectedNavItem={setSelectedNavItem}
    >
      <Routes>
        <Route index element={
          <>
            <DashboardAlerts />
            <DashboardContent />
          </>
        } />
      </Routes>
    </DashboardLayout>
  );
};

// Main Dashboard component
const Dashboard = () => {
  return (
    <>
      <ToastProvider />
      <DashboardDataProvider>
        <DashboardWrapper />
      </DashboardDataProvider>
    </>
  );
};

export default Dashboard;

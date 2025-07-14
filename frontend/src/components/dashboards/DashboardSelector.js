import React from 'react';
import { useUser } from '../../contexts/UserContext';
import AdminDashboard from '../../pages/dashboards/AdminDashboard';
import TDPDashboard from '../../pages/dashboards/TDPDashboard';
import TDCDashboard from '../../pages/dashboards/TDCDashboard';
import CCRPDashboard from '../../pages/dashboards/CCRPDashboard';

const DashboardSelector = () => {
  const { currentUser: user } = useUser();

  if (!user) {
    return null;
  }

  // Route to role-specific dashboard
  switch (user.partyType) {
    case 'AppAdmin':
      return <AdminDashboard />;
    case 'TDP':
      return <TDPDashboard />;
    case 'TDC':
      return <TDCDashboard />;
    case 'CCRP':
      return <CCRPDashboard />;
    default:
      // Fallback to a generic dashboard or error page
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Dashboard</h2>
          <p>Welcome, {user.name || 'User'}!</p>
          <p>Role: {user.partyType}</p>
          <p>Role-specific dashboard is not available for your user type.</p>
        </div>
      );
  }
};

export default DashboardSelector; 
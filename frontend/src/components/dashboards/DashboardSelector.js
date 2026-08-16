import React from 'react';
import { useUser } from '../../contexts/UserContext';
import AdminDashboard from '../../pages/dashboards/AdminDashboard';
import TDPDashboard from '../../pages/dashboards/TDPDashboard';
import TDCDashboard from '../../pages/dashboards/TDCDashboard';
import TSPDashboard from '../../pages/dashboards/TSPDashboard';
import AuditorDashboard from '../../pages/dashboards/AuditorDashboard';

const DashboardSelector = () => {
  const { currentUser } = useUser();

  console.log('🔍 DashboardSelector - User data:', {
    user: currentUser,
    partyType: currentUser?.partyType,
    name: currentUser?.name,
    id: currentUser?.id
  });

  if (!currentUser) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading...</h2>
        <p>Please wait while we load your dashboard.</p>
      </div>
    );
  }

  let partyType = currentUser.partyType;

  if (!partyType || partyType === 'User') {
    if (currentUser.email?.includes('tdp')) {
      partyType = 'TDP';
    } else if (currentUser.email?.includes('tdc')) {
      partyType = 'TDC';
    } else if (currentUser.email?.includes('tsp') || currentUser.email?.includes('ccrp')) {
      partyType = 'TSP';
    } else if (currentUser.email?.includes('auditor')) {
      partyType = 'Auditor';
    } else if (currentUser.email?.includes('admin')) {
      partyType = 'AppAdmin';
    }
  }

  switch (partyType) {
    case 'AppAdmin':
      return <AdminDashboard />;
    case 'Auditor':
      return <AuditorDashboard />;
    case 'TDP':
      return <TDPDashboard />;
    case 'TDC':
      return <TDCDashboard />;
    case 'TSP':
    case 'CCRP':
      return <TSPDashboard />;
    default:
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Dashboard</h2>
          <p>Welcome, {currentUser.name || 'User'}!</p>
          <p>Role: {partyType || 'Unknown'}</p>
          <p>Email: {currentUser.email}</p>
          <p>User ID: {currentUser.id}</p>
          <p>Role-specific dashboard is not available for your user type.</p>
        </div>
      );
  }
};

export default DashboardSelector;

import React from 'react';
import { useUser } from '../../contexts/UserContext';
import AdminDashboard from '../../pages/dashboards/AdminDashboard';
import TDPDashboard from '../../pages/dashboards/TDPDashboard';
import TDCDashboard from '../../pages/dashboards/TDCDashboard';
import CCRPDashboard from '../../pages/dashboards/CCRPDashboard';

const DashboardSelector = () => {
  const { currentUser } = useUser();

  // Enhanced debugging and fallback logic
  console.log('🔍 DashboardSelector - User data:', {
    user: currentUser,
    partyType: currentUser?.partyType,
    name: currentUser?.name,
    id: currentUser?.id
  });

  // If no user, show loading
  if (!currentUser) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading...</h2>
        <p>Please wait while we load your dashboard.</p>
      </div>
    );
  }

  // Get partyType with fallback logic
  let partyType = currentUser.partyType;
  
  // If partyType is missing or generic, try to determine from other data
  if (!partyType || partyType === 'User') {
    if (currentUser.email?.includes('tdp')) {
      partyType = 'TDP';
    } else if (currentUser.email?.includes('tdc')) {
      partyType = 'TDC';
    } else if (currentUser.email?.includes('ccrp')) {
      partyType = 'CCRP';
    } else if (currentUser.email?.includes('admin')) {
      partyType = 'AppAdmin';
    }
    
    console.log('🔄 DashboardSelector - Determined partyType from email:', partyType);
  }

  // Route to role-specific dashboard
  switch (partyType) {
    case 'AppAdmin':
      return <AdminDashboard />;
    case 'TDP':
      return <TDPDashboard />;
    case 'TDC':
      return <TDCDashboard />;
    case 'CCRP':
      return <CCRPDashboard />;
    default:
      // Fallback to a generic dashboard with debugging info
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Dashboard</h2>
          <p>Welcome, {currentUser.name || 'User'}!</p>
          <p>Role: {partyType || 'Unknown'}</p>
          <p>Email: {currentUser.email}</p>
          <p>User ID: {currentUser.id}</p>
          <p>Role-specific dashboard is not available for your user type.</p>
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary>Debug Information</summary>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify(currentUser, null, 2)}
            </pre>
          </details>
        </div>
      );
  }
};

export default DashboardSelector; 
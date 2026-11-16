const TERMINAL_STATUSES = new Set([
  'COMPLETED',
  'FAILED',
  'REJECTED',
  'CANCELLED',
  'REVOKED',
  'TERMINATED',
]);

const LIVE_STATUSES = new Set(['SIGNED', 'EXECUTING']);

const ACTION_STATUS = {
  cancel: 'CANCELLED',
  revoke: 'REVOKED',
  terminate: 'TERMINATED',
};

function isLiveStatus(status) {
  return LIVE_STATUSES.has(status);
}

function defaultAction(status, partyRole) {
  if (!isLiveStatus(status)) return 'cancel';
  if (partyRole === 'TDP') return 'revoke';
  return 'terminate';
}

function allowedActionsForRole(partyRole, status) {
  if (isLiveStatus(status)) {
    if (partyRole === 'AppAdmin') return ['revoke', 'terminate'];
    if (partyRole === 'TDC') return ['revoke', 'terminate'];
    if (partyRole === 'TDP') return ['revoke'];
    if (partyRole === 'TSP') return ['terminate'];
    return [];
  }
  if (['TDC', 'TDP', 'TSP', 'AppAdmin'].includes(partyRole)) return ['cancel'];
  return [];
}

module.exports = {
  TERMINAL_STATUSES,
  LIVE_STATUSES,
  ACTION_STATUS,
  isLiveStatus,
  defaultAction,
  allowedActionsForRole,
};

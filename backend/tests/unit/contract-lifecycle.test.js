const {
  defaultAction,
  allowedActionsForRole,
  ACTION_STATUS,
  isLiveStatus,
} = require('../../services/contractLifecyclePolicy');

describe('contractLifecycleService mapping', () => {
  it('cancels unsigned contracts and ends live ones', () => {
    expect(defaultAction('DRAFT', 'TDC')).toBe('cancel');
    expect(defaultAction('PENDING_TDP', 'TDP')).toBe('cancel');
    expect(defaultAction('SIGNED', 'TDP')).toBe('revoke');
    expect(defaultAction('SIGNED', 'TDC')).toBe('terminate');
    expect(defaultAction('EXECUTING', 'TSP')).toBe('terminate');
  });

  it('maps actions to portal statuses', () => {
    expect(ACTION_STATUS.cancel).toBe('CANCELLED');
    expect(ACTION_STATUS.revoke).toBe('REVOKED');
    expect(ACTION_STATUS.terminate).toBe('TERMINATED');
  });

  it('restricts TDP to revoke on signed contracts', () => {
    expect(allowedActionsForRole('TDP', 'SIGNED')).toEqual(['revoke']);
    expect(allowedActionsForRole('TSP', 'SIGNED')).toEqual(['terminate']);
    expect(allowedActionsForRole('TDC', 'SIGNED')).toEqual(['revoke', 'terminate']);
    expect(allowedActionsForRole('TDC', 'DRAFT')).toEqual(['cancel']);
  });

  it('treats SIGNED and EXECUTING as live', () => {
    expect(isLiveStatus('SIGNED')).toBe(true);
    expect(isLiveStatus('DRAFT')).toBe(false);
    expect(isLiveStatus('CANCELLED')).toBe(false);
  });
});

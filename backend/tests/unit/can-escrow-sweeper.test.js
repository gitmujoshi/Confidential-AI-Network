jest.mock('../../models', () => {
  return {
    CANJcsJob: {
      findAll: jest.fn()
    }
  };
});

jest.mock('../../services/canJcsService', () => {
  return {
    ESCROW_STATES: {
      RELEASED: 'RELEASED',
      EXPIRED: 'EXPIRED',
      CANCELLED: 'CANCELLED'
    },
    CANJcsService: jest.fn().mockImplementation(() => ({
      getJob: jest.fn().mockResolvedValue(true)
    }))
  };
});

jest.mock('sequelize', () => {
  return { Op: { notIn: '$notIn', lt: '$lt' } };
});

describe('CANEescrowSweeper', () => {
  const db = require('../../models');
  const { CANJcsService } = require('../../services/canJcsService');
  const { CANEscrowSweeper } = require('../../services/canEscrowSweeper');

  test('sweeps overdue jobs and calls JCS getJob()', async () => {
    db.CANJcsJob.findAll.mockResolvedValue([{ jobId: '00000000-0000-0000-0000-000000000010' }]);

    const sweeper = new CANEscrowSweeper({ intervalMs: 1 });
    await sweeper.sweep();

    const jcsInstance = CANJcsService.mock.results[0].value;
    expect(jcsInstance.getJob).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000010');
  });
});


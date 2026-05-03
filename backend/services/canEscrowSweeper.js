const { Op } = require('sequelize');
const db = require('../models');
const { CANJcsService, ESCROW_STATES } = require('./canJcsService');

class CANEscrowSweeper {
  constructor({ intervalMs = 5000 } = {}) {
    this.intervalMs = intervalMs;
    this.timer = null;
    this.jcs = new CANJcsService();
  }

  start() {
    if (this.timer) return;

    this.timer = setInterval(() => {
      this.sweep().catch(() => {
        // Swallow errors to keep interval running; logs are handled by sequelize/server.
      });
    }, this.intervalMs);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  async sweep() {
    const terminal = [ESCROW_STATES.RELEASED, ESCROW_STATES.EXPIRED, ESCROW_STATES.CANCELLED];
    const now = new Date();

    const overdue = await db.CANJcsJob.findAll({
      where: {
        escrowState: { [Op.notIn]: terminal },
        escrowDeadline: { [Op.lt]: now }
      },
      limit: 50
    });

    for (const job of overdue) {
      // Use existing expiry logic (writes events + destroys CCR session).
      await this.jcs.getJob(job.jobId);
    }
  }
}

module.exports = {
  CANEscrowSweeper
};


/**
 * The training barrier and the output gate.
 * Both the data-owner key and the model-owner key have to be released.
 * The output lease is the escrow deadline. An expired lease blocks the sealed output.
 */

function barrierError(message, code) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = 409;
  throw err;
}

function assertReleaseBarrier({ dekReleased, mekReleased, escrowState } = {}) {
  const ready = escrowState === 'BOTH_READY' || escrowState === 'RELEASED'
    || (dekReleased === true && mekReleased === true);
  if (!ready) {
    barrierError(
      `Job not ready (state=${escrowState || 'OPEN'}). Data-owner and model-owner releases are both required.`,
      'RELEASE_BARRIER'
    );
  }
}

function assertOutputGate({ escrowState, escrowDeadline, ownerLeaseDeadline, now = new Date() } = {}) {
  assertReleaseBarrier({ escrowState });
  if (escrowDeadline && new Date(escrowDeadline).getTime() <= now.getTime()) {
    barrierError('Output lease expired. The sealed output was not released.', 'LEASE_EXPIRED');
  }
  if (ownerLeaseDeadline && new Date(ownerLeaseDeadline).getTime() <= now.getTime()) {
    barrierError('Owner key lease expired. The sealed output was not released.', 'LEASE_EXPIRED');
  }
}

module.exports = {
  assertReleaseBarrier,
  assertOutputGate,
};

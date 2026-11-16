/**
 * Contract cancel / revoke / terminate for the portal.
 * Ends the contract and aborts in-flight training jobs on the same monolith.
 */

const db = require('../models');
const {
  isAppAdminParty,
  resolveSigningUser,
  resolveIsLinkedTdp,
} = require('./contractSigningGate');
const { abortActiveJobsForContract } = require('../../training/trainingAbortService');
const {
  TERMINAL_STATUSES,
  ACTION_STATUS,
  isLiveStatus,
  defaultAction,
  allowedActionsForRole,
} = require('./contractLifecyclePolicy');

async function resolvePartyRole(contract, user) {
  if (!user?.id) return null;
  if (isAppAdminParty(user.partyType)) return 'AppAdmin';
  if (Number(contract.tdcId) === Number(user.id)) return 'TDC';
  if (contract.tspId != null && Number(contract.tspId) === Number(user.id)) return 'TSP';
  if (await resolveIsLinkedTdp(contract, user.id, db, user.email)) return 'TDP';
  return null;
}

function attachLifecycle(contract, { action, status, reason, endedByUserId }) {
  const legal =
    contract.legalDocument && typeof contract.legalDocument === 'object'
      ? { ...contract.legalDocument }
      : {};
  legal.lifecycle = {
    action,
    status,
    reason: reason || null,
    endedAt: new Date().toISOString(),
    endedByUserId,
  };
  return legal;
}

async function endContract({ contractId, user, action, reason }) {
  const actor = user?.id ? user : resolveSigningUser({ user });
  if (!actor?.id) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }

  const contract = await db.Contract.findOne({ where: { contractId } });
  if (!contract) {
    const err = new Error('Contract not found');
    err.statusCode = 404;
    throw err;
  }

  if (TERMINAL_STATUSES.has(contract.status)) {
    const err = new Error(`Contract is already ${contract.status}`);
    err.statusCode = 409;
    throw err;
  }

  const partyRole = await resolvePartyRole(contract, actor);
  if (!partyRole) {
    const err = new Error('Only a contract party or AppAdmin can end this contract');
    err.statusCode = 403;
    throw err;
  }

  const resolvedAction = action || defaultAction(contract.status, partyRole);
  if (!ACTION_STATUS[resolvedAction]) {
    const err = new Error(`Unknown lifecycle action: ${resolvedAction}`);
    err.statusCode = 400;
    throw err;
  }

  const allowed = allowedActionsForRole(partyRole, contract.status);
  if (!allowed.includes(resolvedAction)) {
    const err = new Error(
      `${partyRole} cannot ${resolvedAction} a contract in status ${contract.status}`
    );
    err.statusCode = 403;
    throw err;
  }

  const nextStatus = ACTION_STATUS[resolvedAction];
  const endedReason = reason || `Contract ${resolvedAction}d by ${partyRole}`;
  const legalDocument = attachLifecycle(contract, {
    action: resolvedAction,
    status: nextStatus,
    reason: endedReason,
    endedByUserId: actor.id,
  });

  const patch = {
    status: nextStatus,
    legalDocument,
  };
  try {
    await contract.update({ ...patch, multiTdpStatus: nextStatus });
  } catch (_) {
    await contract.update(patch);
  }

  const abortedJobs = await abortActiveJobsForContract(
    contract.contractId,
    `Contract ${nextStatus}: ${endedReason}`
  );

  try {
    const { NotificationService } = require('./index');
    const notificationService = new NotificationService();
    await notificationService.notifyContractCancelled(contract, actor);
  } catch (_) {
    // notifications are best-effort
  }

  await contract.reload();
  return {
    contract,
    action: resolvedAction,
    status: nextStatus,
    abortedJobs,
  };
}

module.exports = {
  TERMINAL_STATUSES,
  ACTION_STATUS,
  isLiveStatus,
  defaultAction,
  allowedActionsForRole,
  resolvePartyRole,
  endContract,
};

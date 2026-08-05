const FLOWS = {
  customer: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'],
  owner: ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Rejected'],
  rider: ['Ready for Pickup', 'Out for Delivery', 'Delivered'],
}

function getAllowedTransitions(role, currentStatus) {
  const flow = FLOWS[role]
  if (!flow) return []
  const idx = flow.indexOf(currentStatus)
  if (idx === -1 || idx === flow.length - 1) return []
  return [flow[idx + 1]]
}

function getNextStatus(current, role) {
  const flow = FLOWS[role]
  if (!flow) return null
  const idx = flow.indexOf(current)
  if (idx === -1 || idx >= flow.length - 1) return null
  return flow[idx + 1]
}

function isValidTransition(current, next, role) {
  const allowed = getAllowedTransitions(role, current)
  return allowed.includes(next)
}

const TERMINAL_STATUSES = ['Delivered', 'Cancelled', 'Rejected']

module.exports = { FLOWS, getAllowedTransitions, getNextStatus, isValidTransition, TERMINAL_STATUSES }

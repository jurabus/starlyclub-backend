export function calculateProration({
  currentAmount,
  newAmount,
  billingStart,
  billingEnd,
}) {
  const now = new Date();

  const totalMs = billingEnd - billingStart;
  const remainingMs = billingEnd - now;

  if (remainingMs <= 0) return newAmount;

  const remainingRatio = remainingMs / totalMs;
  const unusedValue = currentAmount * remainingRatio;

  return Math.max(newAmount - unusedValue, 0);
}

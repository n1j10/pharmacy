export function sellableQuantity(
  batches: { quantity: number; expiryDate: Date }[]
) {
  const now = new Date();
  return batches.reduce((sum, batch) => {
    if (batch.quantity > 0 && batch.expiryDate > now) {
      return sum + batch.quantity;
    }
    return sum;
  }, 0);
}

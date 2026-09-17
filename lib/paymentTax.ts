export const NIGERIA_VAT_RATE = 0.075;

export function estimateTotalWithTax(
  subtotalAmount: number,
  discountAmount = 0,
) {
  const taxableAmount = Number(subtotalAmount || 0) - Number(discountAmount || 0);
  const taxAmount = roundMoney(taxableAmount * NIGERIA_VAT_RATE);
  const totalWithTax = roundMoney(taxableAmount + taxAmount);

  return { taxableAmount, taxAmount, totalWithTax };
}

export function formatNaira(value: number, minimumFractionDigits = 0) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(Number(value || 0));
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

// Money helpers. All storage/arithmetic happens in integer paise;
// rupee <-> paise conversion is the only place floats are allowed to appear,
// and only at the API boundary.

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function safeDiv(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return numerator / denominator;
}

export function percent(numerator: number, denominator: number): number {
  return Math.round(safeDiv(numerator, denominator) * 1000) / 10; // one decimal place
}

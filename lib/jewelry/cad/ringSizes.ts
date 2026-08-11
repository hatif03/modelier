// US ring size → inner diameter (mm). Standard jeweler's reference values (public
// domain, used industry-wide) — safe to embed directly, no licensing concern.
export const RING_SIZE_TO_DIAMETER_MM: Record<number, number> = {
  3: 14.1,
  3.5: 14.5,
  4: 14.9,
  4.5: 15.3,
  5: 15.7,
  5.5: 16.1,
  6: 16.5,
  6.5: 16.9,
  7: 17.3,
  7.5: 17.7,
  8: 18.2,
  8.5: 18.6,
  9: 19.0,
  9.5: 19.4,
  10: 19.8,
  10.5: 20.2,
  11: 20.6,
  11.5: 21.0,
  12: 21.4,
  12.5: 21.8,
  13: 22.2,
};

export const US_RING_SIZES = Object.keys(RING_SIZE_TO_DIAMETER_MM)
  .map(Number)
  .sort((a, b) => a - b);

export function ringInnerDiameterMm(sizeUS: number): number {
  const diameter = RING_SIZE_TO_DIAMETER_MM[sizeUS];
  if (diameter === undefined) throw new Error(`Unsupported ring size: ${sizeUS}`);
  return diameter;
}

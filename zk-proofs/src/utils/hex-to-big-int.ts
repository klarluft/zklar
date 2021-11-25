export function hexToBigInt(hex: string): bigint {
  return BigInt(`0x${hex.length % 2 ? "0" : ""}${hex}`);
}

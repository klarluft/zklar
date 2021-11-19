export function hexToBigInt(hex: string): BigInt {
  return BigInt(`0x${hex.length % 2 ? "0" : ""}${hex}`);
}

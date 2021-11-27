export const bigIntToHex = (num: number | bigint | string) => "0x" + BigInt(num).toString(16);

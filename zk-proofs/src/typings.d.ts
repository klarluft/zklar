type FixedSizeArray<N extends number, T> = N extends 0
  ? never[]
  : {
      0: T;
      length: N;
    } & ReadonlyArray<T>;

declare module "circomlib-legacy/src/poseidon" {
  export default function (inputs: Array<BigInt | number>): BigInt;
}
declare module "circomlibjs" {
  export interface PoseidonFunction {
    (inputs: Array<bigint | number>): Uint8Array;
    F: {
      toObject: (input: Uint8Array) => bigint;
    };
  }
  export function buildPoseidon(): Promise<PoseidonFunction>;
}

declare module "zokrates-js/node";

declare module "snarkjs";

declare module "babyjubjub" {
  interface CipherPoint {
    x: string;
    y: string;
  }

  type Field = {
    n: BigInt;
    modulus: BigInt;
  };

  class PublicKeyPoint {
    x: Field;
    y: Field;
    JUBJUB_Q: Field;
    JUBJUB_E: Field;
    JUBJUB_C: Field;
    JUBJUB_L: Field;
    JUBJUB_A: Field;
    JUBJUB_D: Field;
    one: Field;
    zero: Field;
  }

  /**
   * @example
   * {
   *   c1: {
   *     x: '12624298877330332570414022327597157065594715800777016541663637103896998980324',
   *     y: '3170287101741502372754809363981628316355305014950824632315560878299524598799'
   *   },
   *   c2: {
   *     x: '8860166109818687326591896847384738636629128443412192787410627811728216654141',
   *     y: '18622375401522632441952668467334088536679206645180708652379086631032811192783'
   *   },
   *   added: '3'
   * }
   */
  interface Cipher {
    c1: CipherPoint;
    c2: CipherPoint;
    added: string;
  }

  type EncryptFunction = <N extends number>(
    message: FixedSizeArray<N, BigInt>,
    publicKey: any,
    nonce: string
  ) => FixedSizeArray<N, Cipher>;

  type DecryptFunction = <N extends number>(
    encryptedMessage: FixedSizeArray<N, Cipher>,
    privateKey: any
  ) => FixedSizeArray<N, string>;

  interface JubInterface {
    encrypt: EncryptFunction;
    decrypt: DecryptFunction;
  }

  export const Jub: JubInterface;
  export class PrivateKey {
    constructor(field: Field);
    s: Field;
    static getRandObj: () => {
      field: Field;
      hexString: string;
    };
  }
  export const PublicKey: {
    fromPrivate: (privateKey: PrivateKey) => {
      p: PublicKeyPoint;
    };
  };
}

declare module "*.json" {
  const value: any;
  export default value;
}

declare module "circom_tester";

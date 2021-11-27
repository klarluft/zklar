type Input = Record<string, any>;

interface WebAssemblyInstance extends WebAssembly.Instance {
  exports: WebAssembly.Instance["exports"] & {
    getMessageChar: () => number;
    getFieldNumLen32: () => number;
    readSharedRWMemory: (input: number) => number;
    getVersion: () => number;
    getRawPrime: () => void;
    getWitnessSize: () => number;
    init: (sanityCheck: 1 | 0) => void;
    writeSharedRWMemory: (input1: number, input2: number) => void;
    setInputSignal: (input1: number, input2: number, input3: number) => void;
    getWitness: (input: number) => void;
  };
}

interface Options {
  sanityCheck?: boolean;
  logGetSignal?: boolean;
  logSetSignal?: boolean;
  logStartComponent?: boolean;
  logFinishComponent?: boolean;
}

interface BuilderProps {
  code: ArrayBuffer;
  options?: Options;
}

export async function builder({ code, options = {} }: BuilderProps) {
  const wasmModule = await WebAssembly.compile(code);

  let wc;

  const instance = (await WebAssembly.instantiate(wasmModule, {
    runtime: {
      exceptionHandler: function (code: number) {
        let errStr;
        if (code == 1) {
          errStr = "Signal not found. ";
        } else if (code == 2) {
          errStr = "Too many signals set. ";
        } else if (code == 3) {
          errStr = "Signal already set. ";
        } else if (code == 4) {
          errStr = "Assert Failed. ";
        } else if (code == 5) {
          errStr = "Not enough memory. ";
        } else {
          errStr = "Unknown error\n";
        }
        // get error message from wasm
        errStr += getMessage();
        throw new Error(errStr);
      },
      showSharedRWMemory: function () {
        printSharedRWMemory();
      },
    },
  })) as WebAssemblyInstance;

  const sanityCheck =
    Boolean(options) &&
    Boolean(
      options.sanityCheck ||
        options.logGetSignal ||
        options.logSetSignal ||
        options.logStartComponent ||
        options.logFinishComponent
    );

  wc = new WitnessCalculator(instance, sanityCheck);
  return wc;

  function getMessage() {
    let message = "";
    let c = instance.exports.getMessageChar();

    while (c != 0) {
      message += String.fromCharCode(c);
      c = instance.exports.getMessageChar();
    }

    return message;
  }

  function printSharedRWMemory() {
    const getFieldNumLen32 = instance.exports.getFieldNumLen32 as () => number;
    const readSharedRWMemory = instance.exports.readSharedRWMemory as (input: number) => number;
    const shared_rw_memory_size = getFieldNumLen32();
    const arr = new Uint32Array(shared_rw_memory_size);

    for (let j = 0; j < shared_rw_memory_size; j++) {
      arr[shared_rw_memory_size - 1 - j] = readSharedRWMemory(j);
    }

    // console.log(fromArray32(arr));
  }
}

class WitnessCalculator {
  instance: WebAssemblyInstance;
  version: number;
  n32: number;
  prime: bigint;
  witnessSize: number;
  sanityCheck: boolean;

  constructor(instance: WebAssemblyInstance, sanityCheck: boolean) {
    this.instance = instance;

    this.version = this.instance.exports.getVersion();
    this.n32 = this.instance.exports.getFieldNumLen32();

    this.instance.exports.getRawPrime();
    const arr = new Array(this.n32);

    for (let i = 0; i < this.n32; i++) {
      arr[this.n32 - 1 - i] = this.instance.exports.readSharedRWMemory(i);
    }

    this.prime = fromArray32(arr);

    this.witnessSize = this.instance.exports.getWitnessSize();

    this.sanityCheck = sanityCheck;
  }

  circom_version() {
    return this.instance.exports.getVersion();
  }

  async _doCalculateWitness(input: Input, sanityCheck: boolean) {
    //input is assumed to be a map from signals to arrays of bigints
    this.instance.exports.init(this.sanityCheck || sanityCheck ? 1 : 0);
    const keys = Object.keys(input);
    keys.forEach((k) => {
      const h = fnvHash(k);
      const hMSB = parseInt(h.slice(0, 8), 16);
      const hLSB = parseInt(h.slice(8, 16), 16);
      const fArr = flatArray(input[k]);
      for (let i = 0; i < fArr.length; i++) {
        const arrFr = toArray32(fArr[i], this.n32);
        for (let j = 0; j < this.n32; j++) {
          this.instance.exports.writeSharedRWMemory(j, arrFr[this.n32 - 1 - j]);
        }
        try {
          this.instance.exports.setInputSignal(hMSB, hLSB, i);
        } catch (err) {
          // console.log(`After adding signal ${i} of ${k}`)
          throw new Error(err as string);
        }
      }
    });
  }

  async calculateWitness(input: Input, sanityCheck: boolean) {
    const w = [];

    await this._doCalculateWitness(input, sanityCheck);

    for (let i = 0; i < this.witnessSize; i++) {
      this.instance.exports.getWitness(i);
      const arr = new Uint32Array(this.n32);
      for (let j = 0; j < this.n32; j++) {
        arr[this.n32 - 1 - j] = this.instance.exports.readSharedRWMemory(j);
      }
      w.push(fromArray32(arr));
    }

    return w;
  }

  async calculateBinWitness(input: Input, sanityCheck: boolean) {
    const buff32 = new Uint32Array(this.witnessSize * this.n32);
    const buff = new Uint8Array(buff32.buffer);
    await this._doCalculateWitness(input, sanityCheck);

    for (let i = 0; i < this.witnessSize; i++) {
      this.instance.exports.getWitness(i);
      const pos = i * this.n32;
      for (let j = 0; j < this.n32; j++) {
        buff32[pos + j] = this.instance.exports.readSharedRWMemory(j);
      }
    }

    return buff;
  }

  async calculateWTNSBin(input: Input, sanityCheck: boolean): Promise<Uint8Array> {
    const buff32 = new Uint32Array(this.witnessSize * this.n32 + this.n32 + 11);
    const buff = new Uint8Array(buff32.buffer);
    await this._doCalculateWitness(input, sanityCheck);

    //"wtns"
    buff[0] = "w".charCodeAt(0);
    buff[1] = "t".charCodeAt(0);
    buff[2] = "n".charCodeAt(0);
    buff[3] = "s".charCodeAt(0);

    //version 2
    buff32[1] = 2;

    //number of sections: 2
    buff32[2] = 2;

    //id section 1
    buff32[3] = 1;

    const n8 = this.n32 * 4;
    //id section 1 length in 64bytes
    const idSection1length = 8 + n8;
    const idSection1lengthHex = idSection1length.toString(16);
    buff32[4] = parseInt(idSection1lengthHex.slice(0, 8), 16);
    buff32[5] = parseInt(idSection1lengthHex.slice(8, 16), 16);

    //this.n32
    buff32[6] = n8;

    //prime number
    this.instance.exports.getRawPrime();

    var pos = 7;
    for (let j = 0; j < this.n32; j++) {
      buff32[pos + j] = this.instance.exports.readSharedRWMemory(j);
    }
    pos += this.n32;

    // witness size
    buff32[pos] = this.witnessSize;
    pos++;

    //id section 2
    buff32[pos] = 2;
    pos++;

    // section 2 length
    const idSection2length = n8 * this.witnessSize;
    const idSection2lengthHex = idSection2length.toString(16);
    buff32[pos] = parseInt(idSection2lengthHex.slice(0, 8), 16);
    buff32[pos + 1] = parseInt(idSection2lengthHex.slice(8, 16), 16);

    pos += 2;
    for (let i = 0; i < this.witnessSize; i++) {
      this.instance.exports.getWitness(i);
      for (let j = 0; j < this.n32; j++) {
        buff32[pos + j] = this.instance.exports.readSharedRWMemory(j);
      }
      pos += this.n32;
    }

    return buff;
  }
}

function toArray32(s: number, size: number): number[] {
  const res: number[] = []; //new Uint32Array(size); //has no unshift
  let rem = BigInt(s);
  const radix = BigInt(0x100000000);
  while (rem) {
    res.unshift(Number(rem % radix));
    rem = rem / radix;
  }
  if (size) {
    var i = size - res.length;
    while (i > 0) {
      res.unshift(0);
      i--;
    }
  }
  return res;
}

function fromArray32(arr: any[] | Uint32Array): bigint {
  //returns a BigInt
  var res = BigInt(0);
  const radix = BigInt(0x100000000);
  for (let i = 0; i < arr.length; i++) {
    res = res * radix + BigInt(arr[i]);
  }
  return res;
}

function flatArray(a: any[]): number[] {
  var res: number[] = [];
  fillArray(res, a);
  return res;

  function fillArray(res: number[], a: any[]) {
    if (Array.isArray(a)) {
      for (let i = 0; i < a.length; i++) {
        fillArray(res, a[i]);
      }
    } else {
      res.push(a);
    }
  }
}

function fnvHash(str: string): string {
  const uint64_max = BigInt(2) ** BigInt(64);
  let hash = BigInt("0xCBF29CE484222325");
  for (var i = 0; i < str.length; i++) {
    hash ^= BigInt(str[i].charCodeAt(0));
    hash *= BigInt(0x100000001b3);
    hash %= uint64_max;
  }
  let shash = hash.toString(16);
  let n = 16 - shash.length;
  shash = "0".repeat(n).concat(shash);
  return shash;
}

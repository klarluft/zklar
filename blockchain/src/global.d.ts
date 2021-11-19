// Unpacks arrays, promises, functions to get a core type
// For example string[] -> string, Promise<string> -> string, () => string -> string, etc
type Unpack<TType> = TType extends readonly (infer TSubtype)[]
  ? TSubtype // eslint-disable-next-line functional/prefer-readonly-type,@typescript-eslint/no-explicit-any
  : TType extends (...args: any[]) => infer TSubtype
  ? TSubtype
  : TType extends Promise<infer TSubtype>
  ? TSubtype
  : TType;

type Head<T extends any[]> = T extends [...infer Head, any] ? Head : any[];

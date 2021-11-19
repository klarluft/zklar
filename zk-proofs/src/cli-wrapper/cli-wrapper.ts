import fs from "fs";
import util from "util";
import path from "path";
import child_process from "child_process";

const exec = util.promisify(child_process.exec);

enum COMPILE_FLAGS {
  allowUnconstrainedVariables = "--allow-unconstrained-variables",
  isolateBranches = "--isolate-branches",
  verbose = "--verbose",
  ztf = "--ztf",
}

enum COMPILE_OPTIONS {
  abiSpec = "--abi-spec",
  curve = "--curve",
  input = "--input",
  output = "--output",
  stdlibPath = "--stdlib-path",
}

interface CompileProps {
  /** Allow unconstrained variables by inserting dummy constraints */
  allowUnconstrainedVariables?: boolean;
  /** Isolate the execution of branches: a panic in a branch only makes the program panic if this branch is being logically executed */
  isolateBranches?: boolean;
  /** Path of the ABI specification [default: abi.json] */
  abiSpec?: string;
  /** Curve to be used in the compilation [default: bn128]  [possible values: bn128, bls12_381, bls12_377, bw6_761] */
  curve?: "bn128" | "bls12_381" | "bls12_377" | "bw6_761";
  /** Path of the source code */
  input: string;
  /** Path of the output binary [default: out] */
  output?: string;
  /** Path to the standard library [env: ZOKRATES_STDLIB=/home/zokrates/.zokrates/stdlib] */
  stdlibPath?: string;
}

const LOCAL_TEMP_DIRECTORY = "temp_zokrates";
const IMAGE_TEMP_DIRECTORY = "temp";
const CONTRACT_FILENAME = "main.zok";
const PROOF_FILENAME = "proof.json";
const VERIFICATION_KEY_FILENAME = "verification.key";

const rootPath = path.resolve(".");
const tempPath = path.join(rootPath, LOCAL_TEMP_DIRECTORY);
const contractPath = path.join(rootPath, LOCAL_TEMP_DIRECTORY, CONTRACT_FILENAME);
const proofPath = path.join(rootPath, LOCAL_TEMP_DIRECTORY, PROOF_FILENAME);
const verificationKeyPath = path.join(rootPath, LOCAL_TEMP_DIRECTORY, VERIFICATION_KEY_FILENAME);

export async function compile({ input, curve = "bn128", allowUnconstrainedVariables, isolateBranches }: CompileProps) {
  // Clear temp directory
  await exec(`rm -rf ${tempPath}`);

  // Create a fresh temp directory
  await exec(`mkdir -p ${tempPath}`);

  // Copy contract into temp directory
  await exec(`cp ${input} ${contractPath}`);

  await exec(
    [
      `docker run`,
      `--rm`,
      `-v ${tempPath}:/home/zokrates/${IMAGE_TEMP_DIRECTORY}`,
      `-w /home/zokrates/${IMAGE_TEMP_DIRECTORY}`,
      `zokrates/zokrates`,
      `zokrates`,
      `compile`,
      ...(allowUnconstrainedVariables ? [COMPILE_FLAGS.allowUnconstrainedVariables] : []),
      ...(isolateBranches ? [COMPILE_FLAGS.isolateBranches] : []),
      `${COMPILE_OPTIONS.input} ${CONTRACT_FILENAME}`,
      `${COMPILE_OPTIONS.curve} ${curve}`,
    ].join(" ")
  );
}

enum SETUP_OPTIONS {
  backend = "--backend",
  input = "--input",
  provingKeyPath = "--proving-key-path",
  provingScheme = "--proving-scheme",
  universalSetupPath = "--universal-setup-path",
  verificationKeyPath = "--verification-key-path",
}

interface SetupProps {
  /** Backend to use [default: bellman]  [possible values: bellman, libsnark, ark] */
  backend?: "bellman" | "libsnark" | "ark";
  /** Path of the binary [default: out] */
  input?: string;
  /** Path of the generated proving key file [default: proving.key] */
  provingKeyPath?: string;
  /** Proving scheme to use in the setup [default: g16]  [possible values: g16, pghr13, gm17, marlin] */
  provingScheme?: "g16" | "pghr13" | "gm17" | "marlin";
  /** Path of the universal setup file for universal schemes [default: universal_setup.dat] */
  universalSetupPath?: string;
  /** Path of the generated verification key file [default: verification.key] */
  verificationKeyPath?: string;
}

const SETUP_DEFAULT_INPUT = "out";
const SETUP_DEFAULT_UNIVERSAL_SETUP_PATH = "universal_setup.dat";
const SETUP_DEFAULT_VERIFICATION_KEY_PATH = "verification.key";

export async function setup({
  backend = "bellman",
  provingScheme = "g16",
  input = SETUP_DEFAULT_INPUT,
  universalSetupPath = SETUP_DEFAULT_UNIVERSAL_SETUP_PATH,
  verificationKeyPath = SETUP_DEFAULT_VERIFICATION_KEY_PATH,
}: SetupProps = {}) {
  await exec(
    [
      `docker run`,
      `--rm`,
      `-v ${tempPath}:/home/zokrates/${IMAGE_TEMP_DIRECTORY}`,
      `-w /home/zokrates/${IMAGE_TEMP_DIRECTORY}`,
      `zokrates/zokrates`,
      `zokrates`,
      `setup`,
      `${SETUP_OPTIONS.backend} ${backend}`,
      `${SETUP_OPTIONS.provingScheme} ${provingScheme}`,
      `${SETUP_OPTIONS.input} ${input}`,
      `${SETUP_OPTIONS.universalSetupPath} ${universalSetupPath}`,
      `${SETUP_OPTIONS.verificationKeyPath} ${verificationKeyPath}`,
    ].join(" ")
  );
}

enum COMPUTE_WITNESS_FLAGS {
  abi = "--abi",
  stdin = "--stdin",
}

enum COMPUTE_WITNESS_OPTIONS {
  abiSpec = "--abi-spec",
  arguments = "--arguments",
  input = "--input",
  output = "--output",
}

interface ComputeWitnessProps {
  argumentsArray: any[];
  /** Path of the ABI specification [default: abi.json] */
  abiSpec?: string;
  /** Path of the binary [default: out] */
  input?: string;
  /** Path of the output file [default: witness] */
  output?: string;
}

const COMPUTE_WITNESS_DEFAULT_ABI_SPEC = "abi.json";
const COMPUTE_WITNESS_DEFAULT_INPUT = "out";
const COMPUTE_WITNESS_DEFAULT_OUTPUT = "witness";

export async function computeWitness({
  argumentsArray,
  abiSpec = COMPUTE_WITNESS_DEFAULT_ABI_SPEC,
  input = COMPUTE_WITNESS_DEFAULT_INPUT,
  output = COMPUTE_WITNESS_DEFAULT_OUTPUT,
}: ComputeWitnessProps) {
  await exec(
    [
      `echo '${JSON.stringify(argumentsArray)}'`,
      `|`,
      `docker run`,
      `--rm`,
      `-i`,
      `-v ${tempPath}:/home/zokrates/${IMAGE_TEMP_DIRECTORY}`,
      `-w /home/zokrates/${IMAGE_TEMP_DIRECTORY}`,
      `zokrates/zokrates`,
      `zokrates`,
      `compute-witness`,
      COMPUTE_WITNESS_FLAGS.abi,
      COMPUTE_WITNESS_FLAGS.stdin,
      `${COMPUTE_WITNESS_OPTIONS.abiSpec} ${abiSpec}`,
      `${COMPUTE_WITNESS_OPTIONS.input} ${input}`,
      `${COMPUTE_WITNESS_OPTIONS.output} ${output}`,
    ].join(" ")
  );
}

enum GENERATE_PROOF_OPTIONS {
  backend = "--backend",
  input = "--input",
  proofPath = "--proof-path",
  provingKeyPath = "--proving-key-path",
  provingScheme = "--proving-scheme",
  witness = "--witness",
}

interface GenerateProofProps {
  /** Backend to use [default: bellman]  [possible values: bellman, libsnark, ark] */
  backend?: "bellman" | "libsnark" | "ark";
  /** Path of the binary [default: out] */
  input?: string;
  /** Path of the JSON proof file [default: proof.json] */
  proofPath?: string;
  /** Path of the proving key file [default: proving.key] */
  provingKeyPath?: string;
  /** Proving scheme to use in the setup [default: g16]  [possible values: g16, pghr13, gm17, marlin] */
  provingScheme?: "g16" | "pghr13" | "gm17" | "marlin";
  /** Path of the witness file [default: witness] */
  witness?: string;
}

const GENERATE_PROOF_DEFAULT_BACKEND: GenerateProofProps["backend"] = "bellman";
const GENERATE_PROOF_DEFAULT_PROVING_SCHEME: GenerateProofProps["provingScheme"] = "g16";

export interface Proof {
  proof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
  };
  inputs: string[];
}

export interface VerificationKey {
  h: [[string, string], [string, string]];
  g_alpha: [string, string];
  h_beta: [[string, string], [string, string]];
  g_gamma: [string, string];
  h_gamma: [[string, string], [string, string]];
  query: [[string, string], [string, string], [string, string], [string, string]];
}

export async function generateProof({
  backend = GENERATE_PROOF_DEFAULT_BACKEND,
  provingScheme = GENERATE_PROOF_DEFAULT_PROVING_SCHEME,
}: GenerateProofProps = {}): Promise<{ proof: Proof; verificationKey: VerificationKey }> {
  await exec(
    [
      `docker run`,
      `--rm`,
      `-v ${tempPath}:/home/zokrates/${IMAGE_TEMP_DIRECTORY}`,
      `-w /home/zokrates/${IMAGE_TEMP_DIRECTORY}`,
      `zokrates/zokrates`,
      `zokrates`,
      `generate-proof`,
      `${GENERATE_PROOF_OPTIONS.backend} ${backend}`,
      `${GENERATE_PROOF_OPTIONS.provingScheme} ${provingScheme}`,
    ].join(" ")
  );

  const proof = JSON.parse((await fs.promises.readFile(proofPath)).toString()) as Proof;
  const verificationKey = JSON.parse((await fs.promises.readFile(verificationKeyPath)).toString()) as VerificationKey;

  return { proof, verificationKey };
}

enum VERIFY_OPTIONS {
  backend = "--backend",
  curve = "--curve",
  proofPath = "--proof-path",
  provingScheme = "--proving-scheme",
  provingKeyPath = "--proving-key-path",
}

interface VerifyProps {
  /** Backend to use [default: bellman]  [possible values: bellman, libsnark, ark] */
  backend?: "bellman" | "libsnark" | "ark";
  /** Curve to be used in the compilation [default: bn128]  [possible values: bn128, bls12_381, bls12_377, bw6_761] */
  curve?: "bn128" | "bls12_381" | "bls12_377" | "bw6_761";
  /** Path of the JSON proof file [default: proof.json] */
  proofPath?: string;
  /** Proving scheme to use in the setup [default: g16]  [possible values: g16, pghr13, gm17, marlin] */
  provingScheme?: "g16" | "pghr13" | "gm17" | "marlin";
  /** Path of the generated verification key file [default: verification.key] */
  verificationKeyPath?: string;
}

const VERIFY_DEFAULT_BACKEND: VerifyProps["backend"] = "bellman";
const VERIFY_DEFAULT_CURVE: VerifyProps["curve"] = "bn128";
const VERIFY_DEFAULT_PROVING_SCHEME: VerifyProps["provingScheme"] = "g16";

export async function verify({
  backend = VERIFY_DEFAULT_BACKEND,
  curve = VERIFY_DEFAULT_CURVE,
  provingScheme = VERIFY_DEFAULT_PROVING_SCHEME,
}: VerifyProps): Promise<boolean> {
  const { stdout } = await exec(
    [
      `docker run`,
      `--rm`,
      `-v ${tempPath}:/home/zokrates/${IMAGE_TEMP_DIRECTORY}`,
      `-w /home/zokrates/${IMAGE_TEMP_DIRECTORY}`,
      `zokrates/zokrates`,
      `zokrates`,
      `verify`,
      `${VERIFY_OPTIONS.backend} ${backend}`,
      `${VERIFY_OPTIONS.curve} ${curve}`,
      `${VERIFY_OPTIONS.provingScheme} ${provingScheme}`,
    ].join(" ")
  );

  return RegExp(/PASSED/g).test(stdout);
}

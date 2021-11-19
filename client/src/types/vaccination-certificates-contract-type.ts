interface EventEmitterData<Values extends Record<string, number | string>> {
  returnValues: Values;
  raw: {
    data: string;
    topics: [string] | [string, string] | [string, string, string] | [string, string, string, string];
  };
  event: string;
  signature: string;
  logIndex: number;
  transactionIndex: number;
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  address: string;
}

interface EventEmitterOptions<Values extends Record<string, number | string>> {
  filter?: Partial<Values>;
  fromBlock?: number | string | "earliest" | "latest" | "pending";
  topics?: string[];
}

interface EventEmitter<Values extends Record<string, number | string>> {
  on(eventType: "data", callbackFn: (eventData: EventEmitterData<Values>) => void): this;
}

export interface VaccinationCertificatesContractCertificate {
  signature: string;
  authority: string;
  timestamp: string;
}

export interface CertificateIssuedEventValues extends Record<string, number | string> {
  signature: string;
  authority: string;
  timestamp: string;
}

export type CertificateIssuedEventIndexedValues = Pick<CertificateIssuedEventValues, "authority">;

export interface CertificateAuthorityNameSetEventValues extends Record<string, number | string> {
  authority: string;
  name: string;
}

export interface VaccinationCertificatesContractType {
  methods: {
    hasRole(role: string, account: string): { call(options: { from: string }): Promise<boolean> };
    issueCertificate(signature: string): { send(options: { from: string }): Promise<Record<string, unknown>> };
    setCertificateAuthorityName(
      authority: string,
      name: string
    ): { send(options: { from: string }): Promise<Record<string, unknown>> };
    certificates(
      signature: string
    ): { call(options: { from: string }): Promise<VaccinationCertificatesContractCertificate> };
    certificateAuthorityNames(authority: string): { call(options: { from: string }): Promise<string> };
  };
  events: {
    CertificateIssued(
      options?: EventEmitterOptions<CertificateIssuedEventIndexedValues>
    ): EventEmitter<CertificateIssuedEventValues>;
    CertificateAuthorityNameSet(
      options?: EventEmitterOptions<{}>
    ): EventEmitter<CertificateAuthorityNameSetEventValues>;
  };
}

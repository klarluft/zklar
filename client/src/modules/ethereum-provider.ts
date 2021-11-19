import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from "ethers";
import { nanoid } from "nanoid";

import { VaccinationCertificates, VaccinationCertificates__factory } from "blockchain";
import VaccinationCertificatesDeployment from "blockchain/typechain/VaccinationCertificates.deployment.json";

import { accountSubject } from "./account";
import { ExternalProvider } from "../ExternalProvider";
import { CertificateProofType } from "../types/certificate-proof-type";
import {
  CertificateAuthorityNameSetEventValues,
  CertificateIssuedEventValues,
} from "../types/vaccination-certificates-contract-type";
import { certificateIssuedEventSubject } from "./issued-certificates";
import { certificateAuthorityNameSetEventSubject } from "./certificate-authority-names";

type EthereumProvider = ethers.providers.Web3Provider;

let provider: EthereumProvider | undefined;
let externalProvider: ExternalProvider | undefined;
let account: string | undefined;
let signer: ethers.Signer | undefined;
let vaccinationCertificates: VaccinationCertificates | undefined;

export async function configureEthereumProvider(): Promise<EthereumProvider | undefined> {
  externalProvider = (await detectEthereumProvider()) as ExternalProvider | undefined;

  if (!externalProvider) return;

  provider = new ethers.providers.Web3Provider(externalProvider as ethers.providers.ExternalProvider);

  vaccinationCertificates = VaccinationCertificates__factory.connect(
    VaccinationCertificatesDeployment.contractAddress,
    provider
  );

  return provider;
}

export async function connectToMetamask(): Promise<boolean> {
  if (!provider) return false;
  if (!externalProvider) return false;
  if (!vaccinationCertificates) return false;

  await externalProvider.request({ method: "eth_requestAccounts" });
  signer = await provider.getSigner();
  account = await signer.getAddress();

  accountSubject.next(account);

  externalProvider.on("accountsChanged", async () => {
    if (!provider) return false;
    signer = await provider.getSigner();
    account = await signer.getAddress();

    accountSubject.next(account);
  });

  const CertificateIssuedEventTopic = vaccinationCertificates.filters.CertificateIssued(null, null, null);
  const certificateIssuedEvents = await vaccinationCertificates.queryFilter(CertificateIssuedEventTopic);
  certificateIssuedEvents.forEach((certificateIssuedEvent) => {
    const args = certificateIssuedEvent.args as CertificateIssuedEventValues | undefined;
    if (args)
      certificateIssuedEventSubject.next({
        signature: args.signature,
        authority: args.authority,
        timestamp: String(args.timestamp),
      });
  });

  const CertificateAuthorityNameSetEventTopic = vaccinationCertificates.filters.CertificateAuthorityNameSet(null, null);
  const certificateAuthorityNameSetEvents = await vaccinationCertificates.queryFilter(
    CertificateAuthorityNameSetEventTopic
  );
  certificateAuthorityNameSetEvents.forEach((certificateAuthorityNameSetEvent) => {
    const args = certificateAuthorityNameSetEvent.args as CertificateAuthorityNameSetEventValues | undefined;
    if (args)
      certificateAuthorityNameSetEventSubject.next({
        authority: args.authority,
        name: ethers.utils.parseBytes32String(args.name),
      });
  });

  vaccinationCertificates.on(CertificateIssuedEventTopic, (_, __, ___, certificateIssuedEvent) => {
    const args = certificateIssuedEvent.args as CertificateIssuedEventValues | undefined;
    if (args)
      certificateIssuedEventSubject.next({
        signature: args.signature,
        authority: args.authority,
        timestamp: String(args.timestamp),
      });
  });

  vaccinationCertificates.on(CertificateAuthorityNameSetEventTopic, (_, __, certificateAuthorityNameSetEvent) => {
    const args = certificateAuthorityNameSetEvent.args as CertificateAuthorityNameSetEventValues | undefined;
    if (args)
      certificateAuthorityNameSetEventSubject.next({
        authority: args.authority,
        name: ethers.utils.parseBytes32String(args.name),
      });
  });

  return !!account;
}

interface IssueCertificateProps {
  passportCountry: string;
  passportNr: string;
}

export async function issueCertificate({
  passportCountry,
  passportNr,
}: IssueCertificateProps): Promise<CertificateProofType> {
  if (!provider) throw new Error("provider not available");
  if (!vaccinationCertificates) throw new Error("vaccinationCertificates not available");

  const account = accountSubject.getValue();
  if (!account) throw new Error("account not available");

  const CERTIFICATE_AUTHORITY_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CERTIFICATE_AUTHORITY_ROLE"));
  const isCertificateAuthority = await vaccinationCertificates.hasRole(CERTIFICATE_AUTHORITY_ROLE, account);
  if (!isCertificateAuthority) throw new Error("account does not have CERTIFICATE_AUTHORITY_ROLE role");

  const signatureSalt = nanoid(21);

  const signature = ethers.utils.keccak256(`${passportCountry}.${passportNr}.${signatureSalt}`);

  const receipt = await vaccinationCertificates.issueCertificate(signature);
  console.log("receipt", receipt);

  return {
    passportCountry,
    passportNr,
    signatureSalt,
  };
}

export async function verifyCertificate({ passportCountry, passportNr, signatureSalt }: CertificateProofType) {
  if (!vaccinationCertificates) throw new Error("vaccinationCertificates not available");

  const account = accountSubject.getValue();
  if (!account) throw new Error("account not available");

  const signature = ethers.utils.keccak256(`${passportCountry}.${passportNr}.${signatureSalt}`);

  const certificate = await vaccinationCertificates.certificates(signature);

  return certificate.signature !== signature ? undefined : certificate;
}

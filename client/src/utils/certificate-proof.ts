import { CertificateProofType } from "../types/certificate-proof-type";

export const encodeCertificateProofQRCode = ({ passportCountry, passportNr, signatureSalt }: CertificateProofType) =>
  `${passportCountry}|${passportNr}|${signatureSalt}`;

export const decodeCertificateProofQRCode = (encodedQRCode: string) => {
  const [passportCountry, passportNr, signatureSalt] = encodedQRCode.split("|");
  if (!passportCountry || !passportNr || !signatureSalt) throw new Error("Invalid Certificate Proof QR code");

  return { passportCountry, passportNr, signatureSalt };
};

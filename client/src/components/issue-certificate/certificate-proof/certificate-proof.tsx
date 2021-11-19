import React from "react";
import styled from "styled-components";
import qrcode from "qrcode";

import { CertificateProofType } from "../../../types/certificate-proof-type";
import { encodeCertificateProofQRCode } from "../../../utils/certificate-proof";
import { CertificateProofPdf } from "./certificate-proof-pdf";

interface Props {
  certificateProof: CertificateProofType;
  disableDownload?: boolean;
}

const CertificateDetailValue = styled.div``;
const CertificateDetailLabel = styled.div``;
const CertificateDetail = styled.div`
  width: 100%;
  padding: 4px 16px;
`;
const CertificateTitle = styled.div`
  width: 100%;
  padding: 16px;
  font-weight: 700;
`;
const Certificate = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 12px;
  font-family: "Roboto Mono", monospace;
  border-radius: 8px;
  box-shadow: 0px 0px 8px -2px #000;
  overflow: hidden;
`;

export const CertificateProof: React.VFC<Props> = ({ certificateProof, disableDownload }) => {
  const [qrCode] = React.useState<string>(encodeCertificateProofQRCode(certificateProof));
  const [qrCodeDataUrl, setQRCodeDataUrl] = React.useState<string | undefined>();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    (async () => {
      if (!canvasRef.current) throw new Error("Canvas ref is not set");

      await qrcode.toCanvas(canvasRef.current, qrCode);
      setQRCodeDataUrl(canvasRef.current?.toDataURL());
    })();
  }, [qrCode]);

  return (
    <>
      <Certificate>
        <CertificateTitle>Vaccination certificate</CertificateTitle>
        <CertificateDetail>
          <CertificateDetailLabel>Passport country:</CertificateDetailLabel>
          <CertificateDetailValue>{certificateProof.passportCountry}</CertificateDetailValue>
        </CertificateDetail>
        <CertificateDetail>
          <CertificateDetailLabel>Passport nr:</CertificateDetailLabel>
          <CertificateDetailValue>{certificateProof.passportNr}</CertificateDetailValue>
        </CertificateDetail>
        <CertificateDetail>
          <CertificateDetailLabel>Signature salt:</CertificateDetailLabel>
          <CertificateDetailValue>{certificateProof.signatureSalt}</CertificateDetailValue>
        </CertificateDetail>
        <canvas ref={canvasRef} />
      </Certificate>
      {qrCodeDataUrl && !disableDownload ? (
        <CertificateProofPdf certificateProof={certificateProof} qrCodeDataUrl={qrCodeDataUrl} />
      ) : null}
    </>
  );
};

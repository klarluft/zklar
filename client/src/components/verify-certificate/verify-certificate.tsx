import { faQrcode, faSpinner, faToggleOff, faUserCheck, faUserTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import QrReader from "react-qr-reader";
import styled from "styled-components";
import { CertificateProofType } from "../../types/certificate-proof-type";
import { decodeCertificateProofQRCode } from "../../utils/certificate-proof";

import { verifyCertificate } from "../../modules/ethereum-provider";
import { Button } from "../button";
import { CertificateProof } from "../issue-certificate/certificate-proof";

const VerifyBadge = styled.div<{ isVerified?: boolean }>`
  position: absolute;
  top: 200px;
  right: 16px;
  font-size: 64px;
  color: ${({ isVerified }) => (isVerified === false ? "#ba1414" : "#22bf3d")};
`;
const ProofContainer = styled.div`
  position: relative;
  margin-top: 24px;
`;
const StyledQRReader = styled(QrReader)`
  margin-top: 8px;
  border-radius: 8px;
  overflow: hidden;
  width: calc(140px + 8px + 140px);
  height: calc(140px + 8px + 140px);
`;
const Container = styled.div`
  width: calc(140px + 8px + 140px);
  margin: 24px auto 0;
`;

export const VerifyCertificate: React.VFC = () => {
  const [isCameraOn, setIsCameraOn] = React.useState(false);
  const [encodedQRCode, setEncodedQRCode] = React.useState<string | undefined>();
  const [certificateProof, setCertificateProof] = React.useState<CertificateProofType | undefined>();
  const [isVerified, setIsVerified] = React.useState<boolean | undefined>();

  const handleButtonClick = React.useCallback(() => {
    setEncodedQRCode(undefined);
    setCertificateProof(undefined);
    setIsVerified(undefined);
    setIsCameraOn((prev) => !prev);
  }, []);

  const handleScan = React.useCallback((code) => {
    (async () => {
      if (!code) return;

      console.log("code", code);
      setEncodedQRCode(code);
      const _certificateProof = decodeCertificateProofQRCode(code);
      setCertificateProof(_certificateProof);
      const certificate = await verifyCertificate(_certificateProof);
      setIsCameraOn(false);
      setIsVerified(!!certificate);
    })();
  }, []);

  return (
    <Container>
      <Button type="button" onClick={handleButtonClick}>
        {isCameraOn ? (
          <>
            <FontAwesomeIcon icon={faToggleOff} />
            Turn camera off
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faQrcode} />
            Scan certificate
          </>
        )}
      </Button>
      {!encodedQRCode && isCameraOn ? <StyledQRReader delay={300} onError={console.log} onScan={handleScan} /> : null}
      {certificateProof ? (
        <ProofContainer>
          <CertificateProof certificateProof={certificateProof} disableDownload={true} />
          <VerifyBadge isVerified={isVerified}>
            <FontAwesomeIcon
              icon={isVerified === undefined ? faSpinner : isVerified ? faUserCheck : faUserTimes}
              spin={isVerified === undefined}
            />
          </VerifyBadge>
        </ProofContainer>
      ) : null}
    </Container>
  );
};

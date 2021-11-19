import React from "react";
import styled from "styled-components";

import { CertificateProofType } from "../../types/certificate-proof-type";
import { IssueCertificateForm } from "./issue-certificate-form";
import { CertificateProof } from "./certificate-proof";

const Container = styled.div`
  width: calc(140px + 8px + 140px);
  margin: 24px auto 0;
`;

export const IssueCertificate: React.VFC = () => {
  const [certificateProof, setCertificateProof] = React.useState<CertificateProofType | undefined>();

  return (
    <Container>
      {!certificateProof ? (
        <IssueCertificateForm onCertificateProofCreated={setCertificateProof} />
      ) : (
        <CertificateProof certificateProof={certificateProof} />
      )}
    </Container>
  );
};

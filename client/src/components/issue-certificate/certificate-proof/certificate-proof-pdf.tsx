import { faDownload, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Document, Image, Page, PDFDownloadLink, Text, View } from "@react-pdf/renderer";
import { darken } from "polished";
import React from "react";
import styled from "styled-components";

import { CertificateProofType } from "../../../types/certificate-proof-type";
import { ErrorBoundary } from "../../error-boundry";
import logo from "../../layout/top-menu-layout/logo-200x200.png";

interface Props {
  certificateProof: CertificateProofType;
  qrCodeDataUrl: string;
}

const StyledLink = styled(PDFDownloadLink)`
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin-top: 16px;
  width: 100%;
  height: 48px;
  background: #26b4d4;
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  transition: background 300ms;

  & > svg {
    margin: 0 8px;
  }

  &:hover {
    background: ${darken(0.05, "#26b4d4")};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #ba1414;
  }
`;

export const CertificateProofPdf: React.VFC<Props> = React.memo(({ certificateProof, qrCodeDataUrl }) => {
  const MyDoc = () => (
    <Document>
      <Page>
        <View style={{ margin: 10, padding: 10, fontSize: "12pt" }}>
          <Image src={logo} style={{ width: "2cm", height: "2cm" }} />
          <Text style={{ fontSize: "16pt", fontWeight: "bold", marginTop: "1cm" }}>Vaccination Certificate</Text>

          <Text style={{ marginTop: "1cm" }}>Passport country:</Text>
          <Text>{certificateProof.passportCountry}</Text>

          <Text style={{ marginTop: "0.2cm" }}>Passport nr:</Text>
          <Text>{certificateProof.passportNr}</Text>

          <Text style={{ marginTop: "0.2cm" }}>Signature salt:</Text>
          <Text>{certificateProof.signatureSalt}</Text>

          <Image src={qrCodeDataUrl} style={{ width: "4cm", height: "4cm", marginTop: "0.2cm" }} />
        </View>
      </Page>
    </Document>
  );

  const fileName = `${certificateProof.passportCountry}-${certificateProof.passportNr}.pdf`;

  return (
    <ErrorBoundary>
      <StyledLink document={<MyDoc />} fileName={fileName}>
        {({ blob, url, loading, error }) =>
          loading ? (
            <FontAwesomeIcon icon={faSpinner} spin={true} />
          ) : (
            <>
              <FontAwesomeIcon icon={faDownload} /> Download
            </>
          )
        }
      </StyledLink>
    </ErrorBoundary>
  );
});

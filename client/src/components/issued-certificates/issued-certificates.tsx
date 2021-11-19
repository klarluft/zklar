import React from "react";
import styled from "styled-components";
import { useCertificateAuthorityNames } from "../../modules/certificate-authority-names";

import { useIssuedCertificates } from "../../modules/issued-certificates";
import { Avatar } from "../avatar";

const ITEM_SIZE_PX = 64;

const Timestamp = styled.pre`
  display: flex;
  line-height: 1;
  flex-direction: column;
  font-size: 10px;
  width: 66px;
  white-space: pre-wrap;
  word-break: break-all;
  color: #ba1414;
  margin-left: 8px;
`;
const Signature = styled.pre`
  display: flex;
  line-height: 1;
  flex-direction: column;
  font-size: 10px;
  width: 66px;
  white-space: pre-wrap;
  word-break: break-all;
  color: #ba1414;
`;
const AuthorityAccount = styled.pre`
  display: flex;
  margin-left: 8px;
  line-height: 1;
  flex-direction: column;
  font-size: 10px;
  width: 42px;
  white-space: pre-wrap;
  word-break: break-all;
  color: #ba1414;
`;
const Authority = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
`;
const Item = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  border-radius: 8px;
  box-shadow: 0px 0px 8px -2px #000;
  overflow: hidden;
`;
const List = styled.div`
  display: flex;
  flex-direction: column;

  > ${Item} {
    margin-top: 8px;

    &:first-child {
      margin-top: 0;
    }
  }
`;
const Container = styled.div`
  width: calc(140px + 8px + 140px);
  margin: 24px auto;
`;

export const IssuedCertificates: React.VFC = () => {
  const issuedCertificates = useIssuedCertificates();
  const certificateAuthorityNames = useCertificateAuthorityNames();

  console.log("certificateAuthorityNames", certificateAuthorityNames);

  return (
    <Container>
      <List>
        {issuedCertificates.map((issuedCertificate) => (
          <Item key={issuedCertificate.signature}>
            <Authority>
              <Avatar account={issuedCertificate.authority} sizePx={ITEM_SIZE_PX} />
              <AuthorityAccount>
                {certificateAuthorityNames[issuedCertificate.authority]?.name ?? issuedCertificate.authority}
              </AuthorityAccount>
            </Authority>
            <Signature>{issuedCertificate.signature}</Signature>
            <Timestamp>{new Date(Number(issuedCertificate.timestamp) * 1000).toLocaleString()}</Timestamp>
          </Item>
        ))}
      </List>
    </Container>
  );
};

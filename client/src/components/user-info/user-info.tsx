import React from "react";
import styled from "styled-components";

import { useAccount } from "../../modules/account";
import { Avatar } from "../avatar";

const SIZE_PX = 104;

const Hash = styled.pre`
  display: flex;
  margin-top: 4px;
  flex-direction: column;
  font-size: 12px;
  width: 101px;
  line-height: 1;
  white-space: pre-wrap;
  word-break: break-all;
  color: #ba1414;
`;
const Container = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  width: ${SIZE_PX}px;
`;

export const UserInfo: React.FC = () => {
  const account = useAccount();

  if (!account) return null;

  return (
    <Container>
      <Avatar account={account} sizePx={SIZE_PX} />
      <Hash>{account}</Hash>
    </Container>
  );
};

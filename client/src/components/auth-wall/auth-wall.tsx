import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import styled from "styled-components";

import { configureEthereumProvider, connectToMetamask } from "../../modules/ethereum-provider";
import { Button } from "../button";
import logo from "../layout/top-menu-layout/logo-200x200.png";

const Logo = styled.img`
  width: 100px;
  height: 100px;
  margin-bottom: 24px;
`;
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: calc(140px + 8px + 140px);
  margin: 24px auto 0;
`;

export const AuthWall: React.FC = ({ children }) => {
  const [isWeb3Loading, setIsWeb3Loading] = React.useState(true);
  const [isWeb3Configured, setIsWeb3Configured] = React.useState(false);
  const [isMetamaskLoading, setIsMetamaskLoading] = React.useState(false);
  const [isConnectedToMetamask, setIsConnectedToMetamask] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const web3 = await configureEthereumProvider();

      setIsWeb3Loading(false);
      setIsWeb3Configured(!!web3);
    })();
  }, []);

  const handleConnectToMetamask = React.useCallback(() => {
    (async () => {
      setIsMetamaskLoading(true);
      const result = await connectToMetamask();
      setIsMetamaskLoading(false);
      setIsConnectedToMetamask(result);
    })();
  }, []);

  if (isConnectedToMetamask) return <React.Fragment>{children}</React.Fragment>;

  return (
    <Container>
      <Logo src={logo} />
      {isWeb3Loading || isMetamaskLoading ? (
        <Button type="button" isLoading={true} />
      ) : isWeb3Configured && !isConnectedToMetamask ? (
        <Button type="button" onClick={handleConnectToMetamask}>
          <FontAwesomeIcon icon={faEthereum} />
          Connect
        </Button>
      ) : null}
    </Container>
  );
};

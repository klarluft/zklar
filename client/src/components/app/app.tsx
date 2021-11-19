import React from "react";
import { Route, Router, Switch } from "react-router-dom";
import { createBrowserHistory } from "history";

import { AccountProvider } from "../../modules/account";
import { IssuedCertificatesProvider } from "../../modules/issued-certificates";
import { AuthWall } from "../auth-wall";
import { IssueCertificate } from "../issue-certificate/issue-certificate";
import { UserInfo } from "../user-info";
import { VerifyCertificate } from "../verify-certificate";
import { Layout } from "../layout";
import { GlobalStyles } from "../../styles/global-styles";
import { IssuedCertificates } from "../issued-certificates";
import { CertificateAuthorityNamesProvider } from "../../modules/certificate-authority-names";

const history = createBrowserHistory();

export const App: React.VFC = () => (
  <Router history={history}>
    <AccountProvider>
      <IssuedCertificatesProvider>
        <CertificateAuthorityNamesProvider>
          <GlobalStyles />
          <AuthWall>
            <Layout>
              <Switch>
                <Route path="/issue-certificate">
                  <IssueCertificate />
                </Route>
                <Route path="/verify-certificate">
                  <VerifyCertificate />
                </Route>
                <Route path="/issued-certificates">
                  <IssuedCertificates />
                </Route>
              </Switch>
              <UserInfo />
            </Layout>
          </AuthWall>
        </CertificateAuthorityNamesProvider>
      </IssuedCertificatesProvider>
    </AccountProvider>
  </Router>
);

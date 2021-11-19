import React from "react";
import styled from "styled-components";

import { createContent } from "./create-content";
import { TopMenuLayout } from "./top-menu-layout";

const { Provider: TopMenuProvider, Renderer: TopMenuRenderer, Content: TopMenu } = createContent();

const { Provider: FooterProvider, Renderer: FooterRenderer, Content: Footer } = createContent();

const { Provider: ContentProvider, Renderer: ContentRenderer, Content } = createContent();

export { Footer, TopMenu };

const FooterContainer = styled.div``;
const ContentContainer = styled.div``;
const TopMenuContainer = styled.div``;
const Page = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Layout: React.FC = ({ children }) => {
  return (
    <TopMenuProvider>
      <ContentProvider>
        <FooterProvider>
          <Content>{children}</Content>
          <Page>
            <TopMenuContainer>
              <TopMenuLayout>
                <TopMenuRenderer />
              </TopMenuLayout>
            </TopMenuContainer>
            <ContentContainer>
              <ContentRenderer />
            </ContentContainer>
            <FooterContainer>
              <FooterRenderer />
            </FooterContainer>
          </Page>
        </FooterProvider>
      </ContentProvider>
    </TopMenuProvider>
  );
};

import { createGlobalStyle } from "styled-components";

import { normalizeCss } from "./normalizeCss";

export const GlobalStyles = createGlobalStyle`
  ${normalizeCss};

  html, body {
    font-family: 'Roboto', sans-serif;
  }

  pre {
    margin: 0;
    font-family: 'Roboto Mono', monospace;
  }
`;

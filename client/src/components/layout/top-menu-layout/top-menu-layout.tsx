import React from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { darken } from "polished";

import logo from "./logo-200x200.png";

const LogoLink = styled(NavLink)`
  border-radius: 8px;

  &:focus,
  &:active {
    outline: none;
    box-shadow: 0 0 0 2px #ba1414;
  }
`;
const MenuLink = styled(NavLink)`
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: 140px;
  height: 48px;
  background: #26b4d4;
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  transition: background 300ms;

  &.active {
    background: #ba1414;

    &:hover {
      background: ${darken(0.05, "#ba1414")};
    }

    &:focus {
      outline: none;
      box-shadow: 0 0 0 2px #26b4d4;
    }
  }

  &:hover {
    background: ${darken(0.05, "#26b4d4")};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #ba1414;
  }
`;
const Buttons = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 8px;

  > ${MenuLink} {
    margin-left: 8px;

    &:first-child {
      margin-left: 0;
    }
  }
`;
const Logo = styled.img`
  width: 100px;
  height: 100px;
`;
const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 8px;
`;

export const TopMenuLayout: React.FC = ({ children }) => {
  return (
    <Container>
      <LogoLink to="/">
        <Logo src={logo} />
      </LogoLink>
      <Buttons>
        <MenuLink to="/issue-certificate">Issue</MenuLink>
        <MenuLink to="/verify-certificate">Verify</MenuLink>
        <MenuLink to="/issued-certificates">List</MenuLink>
      </Buttons>
    </Container>
  );
};

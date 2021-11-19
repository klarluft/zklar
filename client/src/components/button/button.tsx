import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { darken } from "polished";
import React from "react";
import styled from "styled-components";

interface Props
  extends React.PropsWithoutRef<
    React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
  > {
  isLoading?: boolean;
}

export const ButtonBase = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  margin: 0;
  height: 48px;
  border: none;
  text-decoration: none;
  background: #26b4d4;
  color: #fff;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  text-align: center;
  transition: background 300ms;
  appearance: none;
  width: 100%;
  border-radius: 8px;

  &:hover {
    background: ${darken(0.05, "#26b4d4")};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #ba1414;
  }

  & > svg {
    margin: 0 8px;
  }
`;

export const Button = React.forwardRef<HTMLButtonElement, Props>(({ children, isLoading, ...otherProps }, ref) => {
  return (
    <ButtonBase ref={ref} {...otherProps}>
      {isLoading ? <FontAwesomeIcon icon={faSpinner} spin={true} /> : children}
    </ButtonBase>
  );
});

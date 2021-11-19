import { tint } from "polished";
import React from "react";
import styled from "styled-components";

interface Props
  extends React.PropsWithoutRef<
    React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
  > {
  errors?: string;
  touched?: boolean;
  label: string;
}

const Errors = styled.div`
  position: absolute;
  font-size: 12px;
  line-height: 12px;
  bottom: 8px;
  padding: 0 8px;
  color: #ba1414;
`;
const Input = styled.input<{ isErrored: boolean }>`
  width: 100%;
  height: 48px;
  margin: 0;
  box-sizing: border-box;
  border: 1px solid ${({ isErrored }) => (isErrored ? "#ba1414" : "#26b4d4")};
  border-radius: 8px;
  padding: 0 8px;
  color: ${tint(0.2, "#000")};

  &:focus {
    outline: none;
    box-shadow: 0 0 0 1px ${({ isErrored }) => (isErrored ? "#ba1414" : "#26b4d4")};
  }
`;
const Label = styled.label`
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
  color: ${tint(0.4, "#000")};
`;
const Container = styled.div`
  position: relative;

  padding-bottom: 24px;
`;

export const TextInput = React.forwardRef<HTMLInputElement, Props>(
  ({ errors, name, label, className, touched, ...rest }, ref) => (
    <Container className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Input isErrored={!!touched && !!errors} ref={ref} name={name} {...rest} />
      <Errors>{!!touched && !!errors ? errors : null}</Errors>
    </Container>
  )
);

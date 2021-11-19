import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStamp } from "@fortawesome/free-solid-svg-icons";

import { TextInput } from "../../text-input";
import { issueCertificate } from "../../../modules/ethereum-provider";
import { CertificateProofType } from "../../../types/certificate-proof-type";
import { Button } from "../../button";

interface Props {
  onCertificateProofCreated: (certificateProof: CertificateProofType) => void;
}

interface CertificateFormValues {
  passportCountry: string;
  passportNr: string;
}

const Errors = styled.div`
  font-size: 12px;
  color: #ba1414;
  margin: 8px 0;
`;

const CertificateFormSchema = Yup.object()
  .shape({
    passportCountry: Yup.string().required(),
    passportNr: Yup.string().required(),
  })
  .required();

export const IssueCertificateForm: React.VFC<Props> = ({ onCertificateProofCreated }) => {
  const [issuingError, setIssuingError] = React.useState<string | undefined>();

  const formik = useFormik<CertificateFormValues>({
    initialValues: {
      passportCountry: "",
      passportNr: "",
    },
    onSubmit: async ({ passportCountry, passportNr }) => {
      try {
        const certificateProof = await issueCertificate({ passportCountry, passportNr });
        onCertificateProofCreated(certificateProof);
      } catch (error) {
        setIssuingError(error?.message ?? "There were some issue with issuing this certificate");
      }
    },
    validationSchema: CertificateFormSchema,
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <TextInput
        label="Passport country code"
        type="text"
        onChange={formik.handleChange}
        name="passportCountry"
        placeholder="Passport country code"
        value={formik.values.passportCountry}
        errors={formik.errors.passportCountry}
        touched={formik.touched.passportCountry}
      />
      <TextInput
        label="Passport nr"
        type="text"
        onChange={formik.handleChange}
        name="passportNr"
        placeholder="Passport nr"
        value={formik.values.passportNr}
        errors={formik.errors.passportNr}
        touched={formik.touched.passportNr}
      />
      <Button type="submit" isLoading={formik.isSubmitting}>
        <FontAwesomeIcon icon={faStamp} />
        Issue certificate
      </Button>
      <Errors>{issuingError}</Errors>
    </form>
  );
};

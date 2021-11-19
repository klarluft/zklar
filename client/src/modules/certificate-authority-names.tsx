import React from "react";
import { BehaviorSubject, Subject } from "rxjs";
import { CertificateAuthorityNameSetEventValues } from "../types/vaccination-certificates-contract-type";

export const certificateAuthorityNameSetEventSubject = new Subject<CertificateAuthorityNameSetEventValues>();
export const certificateAuthorityNamesSubject = new BehaviorSubject<
  Record<string, CertificateAuthorityNameSetEventValues>
>({});

certificateAuthorityNameSetEventSubject.subscribe((certificateAuthorityName) => {
  console.log("certificateAuthorityName", certificateAuthorityName);
  const certificateAuthorityNames = certificateAuthorityNamesSubject.getValue();

  certificateAuthorityNamesSubject.next({
    ...certificateAuthorityNames,
    [certificateAuthorityName.authority]: certificateAuthorityName,
  });
});

export const CertificateAuthorityNamesContext = React.createContext<typeof certificateAuthorityNamesSubject>(
  certificateAuthorityNamesSubject
);

export const CertificateAuthorityNamesProvider: React.FC = ({ children }) => {
  return (
    <CertificateAuthorityNamesContext.Provider value={certificateAuthorityNamesSubject}>
      {children}
    </CertificateAuthorityNamesContext.Provider>
  );
};

export const useCertificateAuthorityNames = () => {
  const subject = React.useContext(CertificateAuthorityNamesContext);
  const [data, setData] = React.useState(subject.getValue());

  if (!subject) throw new Error("CertificateAuthorityNamesProvider missing");

  React.useEffect(() => {
    const subscription = subject.subscribe(setData);

    return () => subscription.unsubscribe();
  }, [subject]);

  return data;
};

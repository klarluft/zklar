import React from "react";
import { BehaviorSubject, Subject } from "rxjs";
import { CertificateIssuedEventValues } from "../types/vaccination-certificates-contract-type";

export const certificateIssuedEventSubject = new Subject<CertificateIssuedEventValues>();
export const issuedCertificatesSubject = new BehaviorSubject<CertificateIssuedEventValues[]>([]);

certificateIssuedEventSubject.subscribe((issuedCertificate) => {
  const issuedCertificates = issuedCertificatesSubject.getValue();

  issuedCertificatesSubject.next([
    issuedCertificate,
    ...issuedCertificates.filter((someCertificate) => someCertificate.signature !== issuedCertificate.signature),
  ]);
});

export const IssuedCertificatesContext = React.createContext<typeof issuedCertificatesSubject>(
  issuedCertificatesSubject
);

export const IssuedCertificatesProvider: React.FC = ({ children }) => {
  return (
    <IssuedCertificatesContext.Provider value={issuedCertificatesSubject}>
      {children}
    </IssuedCertificatesContext.Provider>
  );
};

export const useIssuedCertificates = () => {
  const subject = React.useContext(IssuedCertificatesContext);
  const [data, setData] = React.useState(subject.getValue());

  if (!subject) throw new Error("IssuedCertificatesProvider missing");

  React.useEffect(() => {
    const subscription = subject.subscribe(setData);

    return () => subscription.unsubscribe();
  }, [subject]);

  return data;
};

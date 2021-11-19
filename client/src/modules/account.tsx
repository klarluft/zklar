import React from "react";
import { BehaviorSubject } from "rxjs";

export const accountSubject = new BehaviorSubject<string | undefined>(undefined);

export const AccountContext = React.createContext<typeof accountSubject>(accountSubject);

export const AccountProvider: React.FC = ({ children }) => (
  <AccountContext.Provider value={accountSubject}>{children}</AccountContext.Provider>
);

export const useAccount = () => {
  const subject = React.useContext(AccountContext);
  const [data, setData] = React.useState(subject.getValue());

  if (!subject) throw new Error("AccountProvider missing");

  React.useEffect(() => {
    const subscription = subject.subscribe(setData);

    return () => subscription.unsubscribe();
  }, [subject]);

  return data;
};

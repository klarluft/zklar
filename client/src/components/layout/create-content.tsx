import React from "react";

interface ContextValues {
  content: React.ReactNode;
  setContent: React.Dispatch<React.SetStateAction<React.ReactNode>>;
}

export const createContent = () => {
  const Context = React.createContext<ContextValues>({} as ContextValues);

  const Provider: React.FC = ({ children }) => {
    const [content, setContent] = React.useState<React.ReactNode>(null);

    return <Context.Provider value={{ content, setContent }}>{children}</Context.Provider>;
  };

  const Renderer: React.VFC = () => {
    const { content } = React.useContext(Context);

    return <React.Fragment>{content}</React.Fragment>;
  };

  const Content: React.FC = ({ children }) => {
    const { setContent } = React.useContext(Context);

    React.useEffect(() => {
      setContent(children);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [children]);

    return null;
  };

  return { Provider, Renderer, Content };
};

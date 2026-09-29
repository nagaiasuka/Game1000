import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import { acceptsDeveloperPassword } from "./access";

const DeveloperContext = createContext({
  enabled: false,
  unlock: (_password: string): boolean => false,
  disable: () => {},
});
export function DeveloperModeProvider({ children }: PropsWithChildren) {
  const [enabled, setEnabled] = useState(false);
  return (
    <DeveloperContext.Provider
      value={{
        enabled,
        unlock: (password) => {
          if (!acceptsDeveloperPassword(password)) return false;
          setEnabled(true);
          return true;
        },
        disable: () => setEnabled(false),
      }}
    >
      {children}
    </DeveloperContext.Provider>
  );
}
export const useDeveloperMode = () => useContext(DeveloperContext);

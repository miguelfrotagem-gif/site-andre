import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import type { Dispatch, ReactNode } from "react";
import { reducer } from "../domain/simulation";
import type { SimulationAction } from "../domain/simulation";
import type { SimulationState } from "../types";
import { restoreState, storageKey } from "../domain/storage";
function readState(): SimulationState {
  try {
    return restoreState(localStorage.getItem(storageKey));
  } catch {
    return restoreState(null);
  }
}
const Context = createContext<{
  state: SimulationState;
  dispatch: Dispatch<SimulationAction>;
  storageWarning: boolean;
} | null>(null);
export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, readState);
  const [storageWarning, setStorageWarning] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      setStorageWarning(false);
    } catch {
      setStorageWarning(true);
    }
  }, [state]);
  return (
    <Context.Provider value={{ state, dispatch, storageWarning }}>
      {children}
    </Context.Provider>
  );
}
export function useSimulation() {
  const context = useContext(Context);
  if (!context) throw Error("Provedor ausente");
  return context;
}

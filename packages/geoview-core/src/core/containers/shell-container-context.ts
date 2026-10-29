import { createContext, useContext } from 'react';

/** Context exposing the mounted shell element to React descendants. */
export const ShellContainerContext = createContext<HTMLElement | undefined>(undefined);

/** Hook that returns the shell element when it has mounted. */
export const useShellContainer = (): HTMLElement | undefined => useContext(ShellContainerContext);

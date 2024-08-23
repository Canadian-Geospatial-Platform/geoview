import React, { createContext, useContext, ReactNode } from 'react';
import { ICgpvHook, useCgpvHook } from './cgpvHook';

// Create context

export const CGPVContext = createContext<ICgpvHook | null>(null);

// Provider component
interface CGPVProviderProps {
  children: ReactNode;
}

export const CGPVProvider = ({ children }: CGPVProviderProps) => {
  const cgpvHookValues = useCgpvHook();

  return <CGPVContext.Provider value={cgpvHookValues}>{children}</CGPVContext.Provider>;
};

import React, { createContext, useContext, ReactNode } from 'react';
import { useCgpvHook } from './cgpvHook';

// Create context
interface CGPVContextType {
  isInitialized: boolean;
  displayLanguage: string;
  displayTheme: string;
  displayProjection: number | string;
  configFilePath: string;
  configJson: object;
  mapWidth: number;
  setMapWidth: React.Dispatch<React.SetStateAction<number>>;
  mapHeight: number;
  setMapHeight: React.Dispatch<React.SetStateAction<number>>;

  initializeMap: (mapId: string, config: string | object) => void;
  handleDisplayLanguage: (e: any) => void;
  handleDisplayTheme: (e: any) => void;
  handleDisplayProjection: (e: any) => void;
  handleReloadMap: () => void;
  handleRemoveMap: () => string;
  handleConfigFileChange: (filePath: string | null) => void;
}

export const CGPVContext = createContext<CGPVContextType | null>(null);

// Provider component
interface CGPVProviderProps {
  children: ReactNode;
}

export const CGPVProvider = ({ children }: CGPVProviderProps) => {
  const cgpvHookValues = useCgpvHook();

  return (
    <CGPVContext.Provider value={cgpvHookValues}>
      {children}
    </CGPVContext.Provider>
  );
};
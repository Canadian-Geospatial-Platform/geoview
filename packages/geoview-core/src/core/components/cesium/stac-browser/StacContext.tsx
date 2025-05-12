/* eslint-disable react/jsx-no-constructed-context-values */
import { createContext, JSX, useContext, useState } from 'react';
import type { StacAssetObject, StacCollection, StacItem } from './Types';

interface callbackReturnType {
  asset: StacAssetObject;
  feature: StacItem;
}
export type callbackType = (ret: callbackReturnType) => void;
// Define the context type
export interface StacContextType {
  collections: StacCollection[];
  setCollections: React.Dispatch<React.SetStateAction<StacCollection[]>>;
  callback: callbackType | null;
  setCallback: React.Dispatch<React.SetStateAction<callbackType | null>>;
  bbox: string;
  setBbox: React.Dispatch<React.SetStateAction<string>>;
  intersects: string;
  setIntersects: React.Dispatch<React.SetStateAction<string>>;
  datetimeStart: string;
  setDatetimeStart: React.Dispatch<React.SetStateAction<string>>;
  datetimeEnd: string;
  setDatetimeEnd: React.Dispatch<React.SetStateAction<string>>;
}

// Create the context
const StacContext = createContext<StacContextType | undefined>(undefined);

/**
 * Use function for the STAC Context Provider.
 * @returns Object full of States.
 */
function useProviderValue(): {
  collections: StacCollection[];
  setCollections: React.Dispatch<React.SetStateAction<StacCollection[]>>;
  callback: callbackType | null;
  setCallback: React.Dispatch<React.SetStateAction<callbackType | null>>;
} {
  const [collections, setCollections] = useState([] as StacCollection[]);
  const [callback, setCallback] = useState<callbackType | null>(null);
  return {
    collections,
    setCollections,
    setCallback,
    callback,
  };
}

/**
 * Provide the context
 * @param param0 {
      children: Child elements
      bboxSignal: bbox state to pass in for searching via bounding box.
      intersectsSignal: intersects state to pass in for searching via intersection
      datetimeStartSignal: datetime start state to pass in for searching via date time
      datetimeEndSignal: datetime end state to pass in for searching via date time
   }
 * @returns 
 */
export function StacContextProvider({
  children,
  bboxSignal,
  intersectsSignal,
  datetimeStartSignal,
  datetimeEndSignal,
}: {
  children?: JSX.Element;
  bboxSignal: [string, React.Dispatch<React.SetStateAction<string>>];
  intersectsSignal: [string, React.Dispatch<React.SetStateAction<string>>];
  datetimeStartSignal: [string, React.Dispatch<React.SetStateAction<string>>];
  datetimeEndSignal: [string, React.Dispatch<React.SetStateAction<string>>];
}): JSX.Element {
  const { collections, setCollections, callback, setCallback } = useProviderValue();
  const [bbox, setBbox] = bboxSignal;
  const [intersects, setIntersects] = intersectsSignal;
  const [datetimeStart, setDatetimeStart] = datetimeStartSignal;
  const [datetimeEnd, setDatetimeEnd] = datetimeEndSignal;
  return (
    <StacContext.Provider
      value={{
        collections,
        setCollections,
        callback,
        setCallback,
        bbox,
        setBbox,
        intersects,
        setIntersects,
        datetimeStart,
        setDatetimeStart,
        datetimeEnd,
        setDatetimeEnd,
      }}
    >
      {children}
    </StacContext.Provider>
  );
}

/**
 * Use function for STAC Context
 * @returns Stac Context
 */
export const useStacContext = (): StacContextType => {
  const context = useContext(StacContext);
  if (!context) {
    throw new Error('useStacContext must be used within a StateContextProvider');
  }
  return context;
};

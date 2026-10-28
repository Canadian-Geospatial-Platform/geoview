import { createContext } from 'react';

// GV Kept out of app-start.tsx so the store layer does not import the React component tree (#3711)

/** React context holding the map id of the GeoView store used by the components below it. */
export const StoreContext = createContext<string | undefined>(undefined);

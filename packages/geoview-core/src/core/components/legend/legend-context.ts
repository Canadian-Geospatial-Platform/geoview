import { createContext } from 'react';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const LegendContext = createContext({ selectedLayer: null, setSelectedLayer: () => {} });

import { createContext, useContext } from 'react';

import type { ControllerRegistry } from './controller-registry';

/** Create the controller context */
export const ControllerContext = createContext<ControllerRegistry | null>(null);

/**
 * Hook to access the controller registry from the context.
 * @returns The controller registry instance from the context.
 * @throws Will throw an error if used outside of a ControllerProvider.
 */
export function useControllers(): ControllerRegistry {
  const ctx = useContext(ControllerContext);

  if (!ctx) {
    throw new Error('useControllers must be used inside ControllerProvider');
  }

  return ctx;
}

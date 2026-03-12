import { createContext, useContext } from 'react';

import type { ControllerRegistry } from './controller-registry';

// GV This file is the equivalent of the store-manager.ts file, but for controllers.

/** Create the controller context */
export const ControllerContext = createContext<ControllerRegistry | null>(null);

/**
 * Hook to access the controller registry from the context.
 *
 * @returns The controller registry instance from the context.
 * @throws {Error} When used outside of a ControllerProvider.
 */
export function useControllers(): ControllerRegistry {
  const ctx = useContext(ControllerContext);

  if (!ctx) {
    throw new Error('useControllers must be used inside ControllerContext.Provider');
  }

  return ctx;
}

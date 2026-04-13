import type { ControllerRegistry } from './controller-registry';
/** Create the controller context */
export declare const ControllerContext: import("react").Context<ControllerRegistry | null>;
/**
 * Hook to access the controller registry from the context.
 *
 * @returns The controller registry instance from the context.
 * @throws {Error} When used outside of a ControllerProvider.
 */
export declare function useControllers(): ControllerRegistry;
//# sourceMappingURL=controller-manager.d.ts.map
import type { ReactNode } from 'react';
import type { TypeContainerBox } from '@/core/types/global-types';
/** Properties for the FocusTrapContainer component. */
interface FocusTrapContainerProps {
    children: ReactNode;
    id: string;
    containerType: TypeContainerBox;
    open?: boolean;
}
/**
 * Traps keyboard tab focus within a container.
 *
 * @param props - FocusTrapContainer properties
 * @returns The focus trap wrapper element
 */
export declare const FocusTrapContainer: import("react").NamedExoticComponent<FocusTrapContainerProps>;
export {};
//# sourceMappingURL=focus-trap-container.d.ts.map
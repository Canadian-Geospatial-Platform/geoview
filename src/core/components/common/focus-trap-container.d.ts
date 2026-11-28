import type { ReactNode } from 'react';
import type { TypeContainerBox } from '@/core/types/global-types';
/** Properties for the FocusTrapContainer component. */
interface FocusTrapContainerProps {
    children: ReactNode;
    /** Key for focus-trap coordination, compared against the focusItem.activeElementId store field. */
    focusTrapContainerId: string;
    /** DOM id of the element to focus when a FOOTER_BAR trap closes (e.g. the tab button owning this panel). If omitted, falls back to the currently selected tab. */
    restoreFocusElementId?: string;
    containerType: TypeContainerBox;
    open?: boolean;
}
/**
 * Traps keyboard tab focus within a container.
 *
 * @param props - FocusTrapContainer properties
 * @returns The focus trap wrapper element
 */
export declare function FocusTrapContainer({ children, open, focusTrapContainerId, restoreFocusElementId, containerType, }: FocusTrapContainerProps): JSX.Element;
export {};
//# sourceMappingURL=focus-trap-container.d.ts.map
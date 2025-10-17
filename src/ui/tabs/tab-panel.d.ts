import type { ReactNode } from 'react';
import type { TypeContainerBox } from '@/core/types/global-types';
/**
 * Interface used for the tab panel properties
 */
export interface TypeTabPanelProps {
    index: number;
    value: number;
    id: string;
    children?: ReactNode;
    containerType?: TypeContainerBox;
    tabId: string;
    className?: string;
}
export declare const TabPanel: import("react").ForwardRefExoticComponent<TypeTabPanelProps & import("react").RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=tab-panel.d.ts.map
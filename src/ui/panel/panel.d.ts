import type { KeyboardEvent } from 'react';
import type { TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
/**
 * Interface for panel properties
 */
export type TypePanelAppProps = {
    panel: TypePanelProps;
    button: IconButtonPropsExtend;
    onGeneralClose?: () => void;
    onOpen?: () => void;
    onClose?: () => void;
    onKeyDown?: (event: KeyboardEvent) => void;
};
/**
 * Material-UI Panel component for displaying collapsible content with header and close button.
 *
 * Wraps card components with title, close button, and animated slide-in transitions.
 * Manages focus trapping and accessibility attributes for modal-like behavior when needed.
 * Content can be HTML strings or React elements.
 *
 * @param props - Panel configuration (see TypePanelAppProps interface)
 * @returns Panel component with slide animation and focus management
 *
 * @example
 * ```tsx
 * <Panel
 *   panel={{ title: 'settings.title', content: 'Panel content' }}
 *   button={{ id: 'panel-btn' }}
 *   onOpen={() => console.log('opened')}
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-card/}
 */
declare function PanelUI(props: TypePanelAppProps): JSX.Element;
export declare const Panel: typeof PanelUI;
export {};
//# sourceMappingURL=panel.d.ts.map
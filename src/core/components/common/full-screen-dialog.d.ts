import type { ReactNode } from 'react';
import type { DialogProps } from '@mui/material';
/** Properties for the FullScreenDialog component. */
interface FullScreenDialogProps extends DialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback fired when dialog closes. Matches MUI Dialog signature */
    onClose: (event?: {}, reason?: 'backdropClick' | 'escapeKeyDown') => void;
    /** Callback when dialog exit animation completes */
    onExited?: () => void;
    /** Title text for the dialog header */
    title: string;
    /** Dialog content elements */
    children: ReactNode;
}
/**
 * Fullscreen dialog with custom header and accessibility features.
 *
 * Wraps Material-UI's Dialog with fullscreen layout, custom header with close button,
 * and body scroll lock management. Handles focus management for keyboard accessibility.
 *
 * @param props - Fullscreen dialog configuration (see FullScreenDialogProps)
 * @returns Fullscreen dialog component
 */
export declare const FullScreenDialog: import("react").NamedExoticComponent<FullScreenDialogProps>;
export {};
//# sourceMappingURL=full-screen-dialog.d.ts.map
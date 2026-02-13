import type { ReactNode } from 'react';
import type { DialogProps } from '@mui/material';
interface FullScreenDialogProps extends DialogProps {
    open: boolean;
    onClose: (event?: {}, reason?: 'backdropClick' | 'escapeKeyDown') => void;
    onExited?: () => void;
    title: string;
    children: ReactNode;
}
export declare const FullScreenDialog: import("react").NamedExoticComponent<FullScreenDialogProps>;
export {};
//# sourceMappingURL=full-screen-dialog.d.ts.map
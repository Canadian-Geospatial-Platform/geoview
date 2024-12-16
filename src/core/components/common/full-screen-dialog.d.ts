import { ReactNode } from 'react';
import { DialogProps } from '@mui/material';
interface FullScreenDialogProps extends DialogProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
}
export declare const FullScreenDialog: import("react").NamedExoticComponent<FullScreenDialogProps>;
export {};

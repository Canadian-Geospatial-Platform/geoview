import { DialogProps } from '@mui/material';
import { ReactNode } from 'react';
interface FullScreenDialogProps extends DialogProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
}
declare function FullScreenDialog({ open, onClose, children }: FullScreenDialogProps): JSX.Element;
export default FullScreenDialog;

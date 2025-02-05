import { memo, ReactNode } from 'react';
import { DialogProps } from '@mui/material';
import { CloseIcon, Dialog, DialogContent, IconButton } from '@/ui';

interface FullScreenDialogProps extends DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

// Constant styles to prevent recreation on each render
const DIALOG_CONTENT_STYLES = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'end',
} as const;

const CLOSE_BUTTON_STYLES = {
  marginBottom: '1.5rem',
} as const;

// Memoizes entire component, preventing re-renders if props haven't changed
export const FullScreenDialog = memo(function FullScreenDialog({
  open,
  onClose,
  children,
  ...dialogProps
}: FullScreenDialogProps): JSX.Element {
  return (
    <Dialog fullScreen maxWidth="xl" open={open} onClose={onClose} disablePortal {...dialogProps} sx={{ maxHeight: '100% !important' }}>
      <DialogContent sx={DIALOG_CONTENT_STYLES}>
        <IconButton onClick={onClose} color="primary" className="buttonFilledOutline" sx={CLOSE_BUTTON_STYLES}>
          <CloseIcon />
        </IconButton>
        {children}
      </DialogContent>
    </Dialog>
  );
});
